import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { userRepository } from "./repositories/user.repository";
import { categoryRepository } from "./repositories/category.repository";
import { insertUserSchema, User } from "@shared/schema";
import { getErrorMessage } from "./lib/errors";
import type { Express } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import memorystore from "memorystore";
import bcrypt from "bcryptjs";
import { createDefaultTags } from "./services/tag.service";
import { pool } from "./db";
import { authRateLimiter } from "./middleware/rate-limit";
import { logError, logWarning, logInfo } from "./lib/logger";
import { logAuditEvent, AuditAction, AuditEntityType } from "./services/audit-log.service";
import { env } from "./lib/env";

const PgSession = connectPgSimple(session);
const MemoryStore = memorystore(session);

/**
 * Create default categories for new user
 */
async function createDefaultCategories(userId: number) {
  const defaultCategories = [
    { name: 'Food & Drinks', type: 'expense', icon: '🍔', color: '#ef4444' },
    { name: 'Transport', type: 'expense', icon: '🚗', color: '#f97316' },
    { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#8b5cf6' },
    { name: 'Entertainment', type: 'expense', icon: '🎮', color: '#ec4899' },
    { name: 'Bills', type: 'expense', icon: '💳', color: '#6366f1' },
    { name: 'Salary', type: 'income', icon: '💰', color: '#10b981' },
    { name: 'Freelance', type: 'income', icon: '💻', color: '#06b6d4' },
    { name: 'Unaccounted', type: 'expense', icon: '❓', color: '#dc2626' }
  ];

  try {
    for (const category of defaultCategories) {
      await categoryRepository.createCategory({
        userId,
        name: category.name,
        type: category.type as "income" | "expense",
        icon: category.icon,
        color: category.color
      });
    }
  } catch (error) {
    logError('Failed to create default categories', error as Error, { userId });
  }
}

export async function setupAuth(app: Express) {
  // 🔒 Validate SESSION_SECRET
  if (!process.env.SESSION_SECRET) {
    throw new Error(
      'SESSION_SECRET environment variable is required. ' +
      'Generate with: openssl rand -base64 32'
    );
  }

  if (process.env.SESSION_SECRET.length < 32) {
    logWarning(
      'SESSION_SECRET is too short (< 32 characters). ' +
      'Generate a stronger secret with: openssl rand -base64 32'
    );
  }

  // 💾 Session Store - Try PostgreSQL, fallback to Memory
  let sessionStore: session.Store;
  
  try {
    // Test database connection first
    await pool.query('SELECT 1');
    
    // Database is available, use PostgreSQL session store
    sessionStore = new PgSession({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: false,
      pruneSessionInterval: 60 * 15,
      errorLog: (error) => {
        logError('Session store error', error as Error);
      }
    });
    logInfo('✅ Using PostgreSQL session store');
  } catch (error) {
    // Fallback to memory store if PostgreSQL is unavailable
    logWarning('⚠️  PostgreSQL unavailable, using Memory session store (sessions will not persist across restarts)');
    logError('Database connection failed', error as Error);
    sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true, // Prevent XSS attacks
      sameSite: 'lax', // CSRF protection
    },
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    // Only enable secure cookies if SECURE_COOKIES is not explicitly disabled
    // For HTTP-only deployments (VPS without HTTPS), set SECURE_COOKIES=false
    if (env.SECURE_COOKIES) {
      sessionSettings.cookie = {
        ...sessionSettings.cookie,
        secure: true, // HTTPS only
      };
    } else {
      logWarning('⚠️  Running in production without secure cookies (SECURE_COOKIES=false). Sessions will work over HTTP but this is not recommended for production.');
    }
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport Local Strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await userRepository.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Incorrect email or password" });
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Incorrect email or password" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: number | string, done) => {
    try {
      // Ensure id is always a number (session storage may serialize as string)
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      const user = await userRepository.getUserById(numericId);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes with rate limiting
  app.post("/api/register", authRateLimiter, async (req, res, next) => {
    try {
      const { email, password, name } = insertUserSchema.parse(req.body);

      const existingUser = await userRepository.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await userRepository.createUser({
        email,
        password: hashedPassword,
        name,
      });

      await createDefaultCategories(user.id);
      await createDefaultTags(user.id);

      // Log registration audit event
      await logAuditEvent({
        userId: user.id,
        action: AuditAction.REGISTER,
        entityType: AuditEntityType.USER,
        entityId: user.id,
        metadata: {
          email: user.email,
        },
        req,
      });

      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({
          id: user.id,
          email: user.email,
          name: user.name,
        });
      });
    } catch (error: unknown) {
      res.status(400).json({ error: getErrorMessage(error) });
    }
  });

  app.post("/api/login", authRateLimiter, (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: User | false, info: { message: string } | undefined) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(400).json({ error: info?.message || "Login failed" });
      }

      req.login(user, async (err) => {
        if (err) {
          return next(err);
        }

        // Log login audit event
        await logAuditEvent({
          userId: user.id,
          action: AuditAction.LOGIN,
          entityType: AuditEntityType.USER,
          entityId: user.id,
          metadata: {
            email: user.email,
          },
          req,
        });

        return res.json({
          id: user.id,
          email: user.email,
          name: user.name,
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", async (req, res) => {
    const userId = (req.user as User | undefined)?.id;

    req.logout(async (err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }

      // Log logout audit event
      if (userId) {
        await logAuditEvent({
          userId,
          action: AuditAction.LOGOUT,
          entityType: AuditEntityType.USER,
          entityId: userId,
          req,
        });
      }

      res.json({ success: true });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as User;
      return res.json({
        id: user.id,
        email: user.email,
        name: user.name,
      });
    }
    res.status(401).json({ error: "Not authenticated" });
  });
}

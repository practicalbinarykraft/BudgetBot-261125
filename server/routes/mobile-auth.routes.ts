import { Router } from "express";
import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/user.repository";
import { categoryRepository } from "../repositories/category.repository";
import { createDefaultTags } from "../services/tag.service";
import { grantWelcomeBonus } from "../services/credits.service";
import { signMobileToken, withMobileAuth } from "../middleware/mobile-auth";
import { authRateLimiter } from "../middleware/rate-limit";
import { logAuditEvent, AuditAction, AuditEntityType } from "../services/audit-log.service";
import { logError } from "../lib/logger";
import { grantSignupReward, ensureReferralCode } from "../services/referral.service";
import { getUserByReferralCode } from "../repositories/referral.repository";
import { z } from "zod";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  referralCode: z.string().optional(),
});

const defaultCategories = [
  { name: "Food & Drinks", type: "expense" as const, icon: "🍔", color: "#ef4444" },
  { name: "Transport", type: "expense" as const, icon: "🚗", color: "#f97316" },
  { name: "Shopping", type: "expense" as const, icon: "🛍️", color: "#8b5cf6" },
  { name: "Entertainment", type: "expense" as const, icon: "🎮", color: "#ec4899" },
  { name: "Bills", type: "expense" as const, icon: "💳", color: "#6366f1" },
  { name: "Salary", type: "income" as const, icon: "💰", color: "#10b981" },
  { name: "Freelance", type: "income" as const, icon: "💻", color: "#06b6d4" },
  { name: "Unaccounted", type: "expense" as const, icon: "❓", color: "#dc2626" },
];

// POST /api/mobile/auth/login
router.post("/login", authRateLimiter, async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await userRepository.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "Incorrect email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect email or password" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: "Account is blocked" });
    }

    const token = signMobileToken({ userId: user.id, email: user.email! });

    try {
      await logAuditEvent({
        userId: user.id,
        action: AuditAction.LOGIN,
        entityType: AuditEntityType.USER,
        entityId: user.id,
        metadata: { email: user.email, source: "mobile" },
        req,
      });
    } catch (auditError) {
      logError("Failed to log mobile login audit event", auditError);
    }

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier || "free",
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid email or password format" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/mobile/auth/register
router.post("/register", authRateLimiter, async (req, res) => {
  try {
    const { email, password, name, referralCode } = registerSchema.parse(req.body);

    const existingUser = await userRepository.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Look up referrer before creating user
    let referrerId: number | null = null;
    if (referralCode) {
      try {
        const referrer = await getUserByReferralCode(referralCode);
        if (referrer) referrerId = referrer.id;
      } catch (e) {
        logError("Failed to look up referral code", e as Error);
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userRepository.createUser({
      email,
      password: hashedPassword,
      name,
    });

    // Set referredBy if valid referral code
    if (referrerId) {
      try {
        const { db } = await import("../db");
        const { users } = await import("@shared/schema");
        const { eq } = await import("drizzle-orm");
        await db.update(users).set({ referredBy: referrerId }).where(eq(users.id, user.id));
      } catch (e) {
        logError("Failed to set referredBy", e as Error, { userId: user.id });
      }
    }

    // Create defaults
    try {
      for (const category of defaultCategories) {
        await categoryRepository.createCategory({ userId: user.id, ...category });
      }
    } catch (e) {
      logError("Failed to create default categories for mobile user", e as Error, { userId: user.id });
    }

    try {
      await createDefaultTags(user.id);
    } catch (e) {
      logError("Failed to create default tags for mobile user", e as Error, { userId: user.id });
    }

    try {
      await grantWelcomeBonus(user.id);
    } catch (e) {
      logError("Failed to grant welcome bonus for mobile user", e as Error, { userId: user.id });
    }

    // Referral: generate code + grant signup reward
    try {
      await ensureReferralCode(user.id);
    } catch (e) {
      logError("Failed to generate referral code", e as Error, { userId: user.id });
    }

    if (referrerId) {
      try {
        await grantSignupReward(referrerId, user.id);
      } catch (e) {
        logError("Failed to grant referral signup reward", e as Error, { userId: user.id, referrerId });
      }
    }

    const token = signMobileToken({ userId: user.id, email: user.email! });

    try {
      await logAuditEvent({
        userId: user.id,
        action: AuditAction.REGISTER,
        entityType: AuditEntityType.USER,
        entityId: user.id,
        metadata: { email: user.email, source: "mobile" },
        req,
      });
    } catch (auditError) {
      logError("Failed to log mobile register audit event", auditError);
    }

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier || "free",
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid registration data" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/mobile/auth/me
router.get(
  "/me",
  withMobileAuth(async (req, res) => {
    const user = req.user;
    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      tier: (user as any).tier || "free",
    });
  })
);

export default router;

// ===== Environment Validation (MUST be first import) =====
// This validates all environment variables on startup and crashes if invalid
import { env } from "./lib/env";

// ===== Sentry Initialization (MUST be early, after env validation) =====
import { initSentry } from "./lib/sentry";
initSentry();

// ===== Redis Initialization =====
import { initRedis } from "./lib/redis";

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes/index";
import { setupAuth } from "./auth";
import { serveStatic, log } from "./static";
import { createServer } from "http";
import { initTelegramBot } from "./telegram/bot";
import { initializeScheduledNotifications } from "./services/notification-scheduler.service";
import { initHourlyBudgetNotifications } from "./cron/hourly-budget-notifications";
import { initSessionCleanup } from "./cron/session-cleanup";
import logger, { logError, logInfo, logRequest } from "./lib/logger";
import { captureException } from "./lib/sentry";
import { isAppError, toAppError } from "./lib/errors";
import { apiLimiter } from "./middleware/rate-limiter";
import { securityHeaders } from "./middleware/security-headers";
import { requestId } from "./middleware/request-id";
import { compressResponse } from "./middleware/compression";

const app = express();
const server = createServer(app);

// Render.com requires longer timeouts for free tier
// https://render.com/docs/troubleshooting-deploys
server.keepAliveTimeout = 120000; // 120 seconds
server.headersTimeout = 120000; // 120 seconds

// Security headers - MUST be first middleware
app.use(securityHeaders);

// Request ID for tracing
app.use(requestId);

// Response compression (gzip) - reduce bandwidth
app.use(compressResponse);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Rate limiting - protect API from abuse
app.use('/api', apiLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    // Log API requests with Winston
    if (req.path.startsWith("/api")) {
      logRequest(req, res, duration);
    }
  });

  next();
});

(async () => {
  // Setup authentication (async - needs to check DB connection)
  await setupAuth(app);
  
  console.log('[SERVER] About to register routes...');
  registerRoutes(app);
  console.log('[SERVER] Routes registered');

  // Setup static file serving BEFORE error handler
  // This ensures SPA routes work correctly in production
  if (app.get("env") === "development") {
    // Dynamic import to avoid loading vite in production
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
    logInfo("✅ Vite dev server setup complete");
  } else {
    serveStatic(app);
    logInfo("✅ Static file serving setup complete");
  }

  // Global error handler - MUST be last middleware
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    // Convert to AppError for consistent handling
    const appError = isAppError(err) ? err : toAppError(err);
    const status = appError.statusCode || 500;
    const user = req.user as { id?: number; email?: string; username?: string } | undefined;

    // Log error with Winston (includes requestId for tracing)
    logError('Request failed', err, {
      requestId: req.requestId,
      status,
      code: appError.code,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: user?.id,
    });

    // Send error to Sentry (only 5xx errors or unexpected errors)
    if (status >= 500 || !isAppError(err)) {
      captureException(err, {
        user: user?.id ? {
          id: user.id,
          email: user.email,
          username: user.username,
        } : undefined,
        tags: {
          path: req.path,
          method: req.method,
          status: String(status),
          requestId: req.requestId,
        },
        extra: {
          ip: req.ip,
          headers: req.headers,
          query: req.query,
          body: req.body,
        },
      });
    }

    // Send user-friendly error response to client (includes requestId for support)
    res.status(status).json({
      ...appError.toJSON(),
      requestId: req.requestId,
    });

    // ⚠️ DO NOT throw here! It will crash the server.
    // Errors are already handled and logged.
  });

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = env.PORT; // Validated and type-safe
  server.listen(port, "0.0.0.0", async () => {
    logInfo(`🚀 Server started on port ${port}`, {
      port,
      environment: env.NODE_ENV,
      logLevel: logger.level,
    });

    // Initialize background services
    logInfo('Initializing background services...');

    // Initialize WebSocket server
    try {
      const { initializeWebSocket } = await import('./lib/websocket');
      initializeWebSocket(server);
      logInfo('✅ WebSocket server initialized');
    } catch (error) {
      logError('WebSocket initialization failed', error);
    }

    // Initialize Redis cache
    try {
      initRedis();
      logInfo('✅ Redis cache initialized');
    } catch (error) {
      logError('Redis initialization failed (app will continue without cache)', error);
    }

    initTelegramBot();
    
    // Initialize database-dependent services
    try {
      await initializeScheduledNotifications();
      initHourlyBudgetNotifications();
      initSessionCleanup(); // Clean up expired sessions daily
      logInfo('✅ Notification services initialized');
    } catch (error) {
      logError('Notification services initialization failed (app will continue without scheduled notifications)', error);
    }

    // Initialize currency updates
    try {
      const { initCurrencyUpdates } = await import('./services/currency-update.service');
      const { initCurrencyUpdateCron } = await import('./cron/currency-update.cron');

      await initCurrencyUpdates(); // Fetch rates immediately
      initCurrencyUpdateCron(); // Schedule daily updates
      logInfo('✅ Currency updates initialized');
    } catch (error) {
      logError('Currency updates initialization failed (app will use fallback rates)', error);
    }

    logInfo('✅ All background services initialized');
  });

  // ===== Graceful Shutdown =====
  // Handle SIGTERM (Docker/Kubernetes stop), SIGINT (Ctrl+C)
  const shutdown = async (signal: string) => {
    logInfo(`📴 ${signal} received, starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
      logInfo('✅ HTTP server closed (no new connections accepted)');

      try {
        // Stop background services
        logInfo('⏸️  Stopping background services...');

        // 1. Stop Telegram bot (no more updates)
        try {
          const { stopTelegramBot } = await import('./telegram/bot');
          stopTelegramBot();
          logInfo('   ✅ Telegram bot stopped');
        } catch (error) {
          logError('   ❌ Telegram bot stop failed', error);
        }

        // 2. Close database connections
        try {
          const { pool } = await import('./db');
          await pool.end();
          logInfo('   ✅ Database connections closed');
        } catch (error) {
          logError('   ❌ Database close failed', error);
        }

        // 3. Close Redis connections (if initialized)
        try {
          const { closeRedis } = await import('./lib/redis');
          await closeRedis();
          logInfo('   ✅ Redis disconnected');
        } catch (error) {
          // Redis is optional, no error
          logInfo('   ⏭️  Redis not initialized or already closed');
        }

        logInfo('✅ Graceful shutdown complete');
        process.exit(0);
      } catch (error) {
        logError('❌ Error during shutdown', error);
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logError('⚠️  Forced shutdown after 30s timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
})();

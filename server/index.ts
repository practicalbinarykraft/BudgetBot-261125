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

const app = express();
const server = createServer(app);

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

setupAuth(app);

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
  registerRoutes(app);

  // Global error handler - MUST be last middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Convert to AppError for consistent handling
    const appError = isAppError(err) ? err : toAppError(err);
    const status = appError.statusCode || 500;

    // Log error with Winston
    logError('Request failed', err, {
      status,
      code: appError.code,
      path: _req.path,
      method: _req.method,
      ip: _req.ip,
      userId: (_req.user as any)?.id,
    });

    // Send error to Sentry (only 5xx errors or unexpected errors)
    if (status >= 500 || !isAppError(err)) {
      captureException(err, {
        user: (_req.user as any)?.id ? {
          id: (_req.user as any).id,
          email: (_req.user as any).email,
          username: (_req.user as any).username,
        } : undefined,
        tags: {
          path: _req.path,
          method: _req.method,
          status: String(status),
        },
        extra: {
          ip: _req.ip,
          headers: _req.headers,
          query: _req.query,
          body: _req.body,
        },
      });
    }

    // Send user-friendly error response to client
    res.status(status).json(appError.toJSON());

    // ⚠️ DO NOT throw here! It will crash the server.
    // Errors are already handled and logged.
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    // Dynamic import to avoid loading vite in production
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

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
    await initializeScheduledNotifications();
    initHourlyBudgetNotifications();
    initSessionCleanup(); // Clean up expired sessions daily

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

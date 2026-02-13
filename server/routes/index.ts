/**
 * Central routing composition for Budget Buddy API
 * 
 * This module splits the legacy monolithic routes.ts into domain-specific Express routers
 * to improve code organization and junior developer readability. Each router handles
 * a single domain (transactions, budgets, etc.) and preserves all security checks:
 * 
 * - withAuth middleware for authentication
 * - Ownership verification before updates/deletes
 * - userId sanitization in PATCH endpoints
 * - Foreign key ownership validation (categoryId, walletId)
 * 
 * Pattern: Each router exports relative paths ('/' instead of '/api/transactions')
 * and is mounted here with the full prefix (e.g., app.use('/api/transactions', router))
 */
import type { Express } from "express";
import { authLimiter, aiLimiter } from "../middleware/rate-limiter";
import transactionsRouter from "./transactions.routes";
import walletsRouter from "./wallets.routes";
import categoriesRouter from "./categories.routes";
import recurringRouter from "./recurring.routes";
import wishlistRouter from "./wishlist.routes";
import plannedRouter from "./planned.routes";
import plannedIncomeRouter from "./planned-income.routes";
import notificationsRouter from "./notifications.routes";
import budgetsRouter from "./budgets.routes";
import limitsRouter from "./limits.routes";
import settingsRouter from "./settings.routes";
import statsRouter from "./stats.routes";
import aiRouter from "./ai";
import currencyRouter from "./currency.routes";
import calibrationsRouter from "./calibrations.routes";
import telegramRouter from "./telegram.routes";
import analyticsRouter from "./analytics.routes";
import personalTagsRouter from "./personal-tags.routes";
import sortingRouter from "./sorting.routes";
import productCatalogRouter from "./product-catalog.routes";
import assetsRouter from "./assets";
import telegramWebhookRouter from "./telegram-webhook.routes";
import healthRouter from "./health.routes";
import swaggerRouter from "./swagger.routes";
import auditLogRouter from "./audit-log.routes";
import advancedAnalyticsRouter from "./advanced-analytics.routes";
import backupRouter from "./backup.routes";
import twoFactorRouter from "./two-factor.routes";
import creditsRouter from "./credits.routes";
import mobileAuthRouter from "./mobile-auth.routes";
import accountRouter from "./account.routes";

export function registerRoutes(app: Express) {
  // API Documentation (Swagger UI)
  app.use("/api-docs", swaggerRouter);

  // Health check endpoints (no auth required)
  app.use("/api", healthRouter);

  // Telegram webhook (must be before other routes, matches TELEGRAM_WEBHOOK_URL)
  app.use("/api/telegram", telegramWebhookRouter);

  // Domain-specific routes
  app.use("/api/transactions", transactionsRouter);
  app.use("/api/wallets", walletsRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/assets", assetsRouter);
  app.use("/api/recurring", recurringRouter);
  app.use("/api/wishlist", wishlistRouter);
  app.use("/api/planned", plannedRouter);
  app.use("/api/planned-income", plannedIncomeRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/budgets", budgetsRouter);
  app.use("/api/limits", limitsRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/credits", creditsRouter);
  app.use("/api/calibrations", calibrationsRouter);
  app.use("/api/telegram", telegramRouter);
  app.use("/api/tags", personalTagsRouter);
  app.use("/api/sorting", sortingRouter);
  app.use("/api/product-catalog", productCatalogRouter);
  app.use("/api/audit-logs", auditLogRouter);
  app.use("/api/backup", backupRouter);


  // Stats and analytics (mounted on /api for /api/stats and /api/financial-health)
  app.use("/api", statsRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/analytics/advanced", advancedAnalyticsRouter);
  
  // Currency exchange rates and conversions
  app.use("/api", currencyRouter);
  
  // AI routes (with stricter rate limiting - expensive operations)
  app.use("/api/ai", aiLimiter, aiRouter);

  // Two-factor authentication
  app.use("/api/2fa", twoFactorRouter);

  // Mobile JWT auth
  app.use("/api/mobile/auth", mobileAuthRouter);

  // Account management (reset, etc.)
  app.use("/api/account", accountRouter);
}

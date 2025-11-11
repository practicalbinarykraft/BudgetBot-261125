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
import transactionsRouter from "./transactions.routes";
import walletsRouter from "./wallets.routes";
import categoriesRouter from "./categories.routes";
import recurringRouter from "./recurring.routes";
import wishlistRouter from "./wishlist.routes";
import budgetsRouter from "./budgets.routes";
import settingsRouter from "./settings.routes";
import statsRouter from "./stats.routes";
import aiRouter from "./ai.routes";
import currencyRouter from "./currency.routes";
import calibrationsRouter from "./calibrations.routes";
import telegramRouter from "./telegram.routes";

export function registerRoutes(app: Express) {
  // Domain-specific routes
  app.use("/api/transactions", transactionsRouter);
  app.use("/api/wallets", walletsRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/recurring", recurringRouter);
  app.use("/api/wishlist", wishlistRouter);
  app.use("/api/budgets", budgetsRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/calibrations", calibrationsRouter);
  app.use("/api/telegram", telegramRouter);
  
  // Stats and analytics (mounted on /api for /api/stats and /api/financial-health)
  app.use("/api", statsRouter);
  
  // Currency exchange rates and conversions
  app.use("/api", currencyRouter);
  
  // AI routes
  app.use("/api/ai", aiRouter);
}

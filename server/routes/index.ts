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

export function registerRoutes(app: Express) {
  // Domain-specific routes
  app.use("/api/transactions", transactionsRouter);
  app.use("/api/wallets", walletsRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/recurring", recurringRouter);
  app.use("/api/wishlist", wishlistRouter);
  app.use("/api/budgets", budgetsRouter);
  app.use("/api/settings", settingsRouter);
  
  // Stats and analytics (mounted on /api for /api/stats and /api/financial-health)
  app.use("/api", statsRouter);
  
  // AI routes
  app.use("/api/ai", aiRouter);
}

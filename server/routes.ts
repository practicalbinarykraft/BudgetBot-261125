import type { Express } from "express";
import { storage } from "./storage";
import { 
  insertTransactionSchema, 
  insertWalletSchema, 
  insertCategorySchema,
  insertRecurringSchema,
  insertWishlistSchema,
  insertSettingsSchema,
  insertBudgetSchema
} from "@shared/schema";
import { z } from "zod";
import { analyzeSpending, scanReceipt } from "./services/ai-service";
import { convertToUSD } from "./services/currency-service";

export function registerRoutes(app: Express) {
  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  // Transactions
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const { from, to } = req.query;
      let transactions = await storage.getTransactionsByUserId(req.user.id);
      
      // Apply date filters if provided
      if (from) {
        transactions = transactions.filter(t => t.date >= String(from));
      }
      if (to) {
        transactions = transactions.filter(t => t.date <= String(to));
      }
      
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const { amount, currency, ...rest } = req.body;
      
      // Convert to USD for storage
      const amountUsd = currency && currency !== "USD" 
        ? convertToUSD(parseFloat(amount), currency).toFixed(2)
        : amount;
      
      const data = insertTransactionSchema.parse({
        ...rest,
        amount,
        amountUsd,
        currency: currency || "USD",
        userId: req.user.id,
      });
      
      const transaction = await storage.createTransaction(data);
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/transactions/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getTransactionById(id);
      if (!transaction || transaction.userId !== req.user.id) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      // Validate update data
      let data = insertTransactionSchema.partial().parse(req.body);
      
      // Recompute amountUsd if amount or currency changed
      if (data.amount || data.currency) {
        const amount = data.amount ? parseFloat(data.amount) : parseFloat(transaction.amount);
        const currency = data.currency || transaction.currency || "USD";
        const amountUsd = currency !== "USD" 
          ? convertToUSD(amount, currency).toFixed(2)
          : amount.toFixed(2);
        data = { ...data, amountUsd };
      }
      
      const updated = await storage.updateTransaction(id, data);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/transactions/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getTransactionById(id);
      if (!transaction || transaction.userId !== req.user.id) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      await storage.deleteTransaction(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Wallets
  app.get("/api/wallets", requireAuth, async (req, res) => {
    try {
      const wallets = await storage.getWalletsByUserId(req.user.id);
      res.json(wallets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/wallets", requireAuth, async (req, res) => {
    try {
      const data = insertWalletSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      const wallet = await storage.createWallet(data);
      res.json(wallet);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/wallets/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const wallet = await storage.getWalletById(id);
      if (!wallet || wallet.userId !== req.user.id) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      await storage.deleteWallet(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Categories
  app.get("/api/categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getCategoriesByUserId(req.user.id);
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/categories", requireAuth, async (req, res) => {
    try {
      const data = insertCategorySchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      const category = await storage.createCategory(data);
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategoryById(id);
      if (!category || category.userId !== req.user.id) {
        return res.status(404).json({ error: "Category not found" });
      }
      await storage.deleteCategory(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Recurring
  app.get("/api/recurring", requireAuth, async (req, res) => {
    try {
      const recurring = await storage.getRecurringByUserId(req.user.id);
      res.json(recurring);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/recurring", requireAuth, async (req, res) => {
    try {
      const data = insertRecurringSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      const recurringItem = await storage.createRecurring(data);
      res.json(recurringItem);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/recurring/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recurringItem = await storage.getRecurringById(id);
      if (!recurringItem || recurringItem.userId !== req.user.id) {
        return res.status(404).json({ error: "Recurring payment not found" });
      }
      await storage.deleteRecurring(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Wishlist
  app.get("/api/wishlist", requireAuth, async (req, res) => {
    try {
      const wishlist = await storage.getWishlistByUserId(req.user.id);
      res.json(wishlist);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/wishlist", requireAuth, async (req, res) => {
    try {
      const data = insertWishlistSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      const wishlistItem = await storage.createWishlist(data);
      res.json(wishlistItem);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/wishlist/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const wishlistItem = await storage.getWishlistById(id);
      if (!wishlistItem || wishlistItem.userId !== req.user.id) {
        return res.status(404).json({ error: "Wishlist item not found" });
      }
      
      // Validate update data
      const data = insertWishlistSchema.partial().parse(req.body);
      const updated = await storage.updateWishlist(id, data);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/wishlist/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const wishlistItem = await storage.getWishlistById(id);
      if (!wishlistItem || wishlistItem.userId !== req.user.id) {
        return res.status(404).json({ error: "Wishlist item not found" });
      }
      await storage.deleteWishlist(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Settings
  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      let settings = await storage.getSettingsByUserId(req.user.id);
      if (!settings) {
        // Create default settings if they don't exist
        settings = await storage.createSettings({
          userId: req.user.id,
          language: "en",
          currency: "USD",
          telegramNotifications: true,
        });
      }
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/settings", requireAuth, async (req, res) => {
    try {
      const data = insertSettingsSchema.partial().parse(req.body);
      let settings = await storage.getSettingsByUserId(req.user.id);
      
      if (!settings) {
        settings = await storage.createSettings({
          userId: req.user.id,
          ...data,
        });
      } else {
        settings = await storage.updateSettings(req.user.id, data);
      }
      
      res.json(settings);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Budgets
  app.get("/api/budgets", requireAuth, async (req, res) => {
    try {
      const budgets = await storage.getBudgetsByUserId(req.user.id);
      res.json(budgets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/budgets", requireAuth, async (req, res) => {
    try {
      const data = insertBudgetSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      const budget = await storage.createBudget(data);
      res.json(budget);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/budgets/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const budget = await storage.getBudgetById(id);
      if (!budget || budget.userId !== req.user.id) {
        return res.status(404).json({ error: "Budget not found" });
      }
      
      // Parse and sanitize - prevent userId hijacking
      const { userId, ...sanitizedBody } = req.body;
      const data = insertBudgetSchema.partial().parse(sanitizedBody);
      const updated = await storage.updateBudget(id, data);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/budgets/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const budget = await storage.getBudgetById(id);
      if (!budget || budget.userId !== req.user.id) {
        return res.status(404).json({ error: "Budget not found" });
      }
      
      await storage.deleteBudget(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stats
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const { from, to } = req.query;
      let transactions = await storage.getTransactionsByUserId(req.user.id);
      
      // Apply date filters if provided
      if (from) {
        transactions = transactions.filter(t => t.date >= String(from));
      }
      if (to) {
        transactions = transactions.filter(t => t.date <= String(to));
      }
      
      const totalIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + parseFloat(t.amountUsd), 0);
      
      const totalExpense = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + parseFloat(t.amountUsd), 0);
      
      const balance = totalIncome - totalExpense;
      
      res.json({
        totalIncome,
        totalExpense,
        balance,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Analysis
  app.post("/api/ai/analyze", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByUserId(req.user.id);
      const analysis = await analyzeSpending(transactions);
      res.json({ analysis });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/scan-receipt", requireAuth, async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Image required" });
      }
      
      const result = await scanReceipt(image);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}

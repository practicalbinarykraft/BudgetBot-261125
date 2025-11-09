import { Router } from "express";
import { storage } from "../storage";
import { insertTransactionSchema } from "@shared/schema";
import { convertToUSD } from "../services/currency-service";
import { withAuth } from "../middleware/auth-utils";

const router = Router();

// GET /api/transactions
router.get("/", withAuth(async (req, res) => {
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
}));

// POST /api/transactions
router.post("/", withAuth(async (req, res) => {
  try {
    // 🔒 Security: Strip categoryId from client - always resolve server-side!
    const { amount, currency, categoryId, ...rest } = req.body;
    
    // Convert to USD for storage
    const amountUsd = currency && currency !== "USD" 
      ? convertToUSD(parseFloat(amount), currency).toFixed(2)
      : amount;
    
    let data = insertTransactionSchema.parse({
      ...rest,
      amount,
      amountUsd,
      currency: currency || "USD",
      userId: req.user.id,
    });
    
    // 🔒 Security: Verify walletId ownership if provided
    if (data.walletId) {
      const wallet = await storage.getWalletById(data.walletId);
      if (!wallet || wallet.userId !== req.user.id) {
        return res.status(400).json({ error: "Invalid wallet" });
      }
    }
    
    // 🔄 Hybrid migration: populate categoryId from category name (server-side only!)
    if (data.category) {
      const category = await storage.getCategoryByNameAndUserId(data.category, req.user.id);
      data = { ...data, categoryId: category?.id ?? null };
    }
    
    const transaction = await storage.createTransaction(data);
    res.json(transaction);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// PATCH /api/transactions/:id
router.patch("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const transaction = await storage.getTransactionById(id);
    if (!transaction || transaction.userId !== req.user.id) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    
    // 🔒 Security: Strip categoryId AND userId from client - always resolve server-side!
    const { categoryId, userId, ...sanitizedBody } = req.body;
    
    // Validate update data
    let data = insertTransactionSchema.partial().parse(sanitizedBody);
    
    // 🔒 Security: Verify walletId ownership if being updated
    if (data.walletId) {
      const wallet = await storage.getWalletById(data.walletId);
      if (!wallet || wallet.userId !== req.user.id) {
        return res.status(400).json({ error: "Invalid wallet" });
      }
    }
    
    // Recompute amountUsd if amount or currency changed
    if (data.amount || data.currency) {
      const amount = data.amount ? parseFloat(data.amount) : parseFloat(transaction.amount);
      const currency = data.currency || transaction.currency || "USD";
      const amountUsd = currency !== "USD" 
        ? convertToUSD(amount, currency).toFixed(2)
        : amount.toFixed(2);
      data = { ...data, amountUsd };
    }
    
    // 🔄 Hybrid migration: populate categoryId from category name (server-side only!)
    if (data.category) {
      const category = await storage.getCategoryByNameAndUserId(data.category, req.user.id);
      data = { ...data, categoryId: category?.id ?? null };
    }
    
    const updated = await storage.updateTransaction(id, data);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// DELETE /api/transactions/:id
router.delete("/:id", withAuth(async (req, res) => {
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
}));

export default router;

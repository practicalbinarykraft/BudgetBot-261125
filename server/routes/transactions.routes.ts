import { Router } from "express";
import { storage } from "../storage";
import { insertTransactionSchema } from "@shared/schema";
import { convertToUSD, getExchangeRate } from "../services/currency-service";
import { withAuth } from "../middleware/auth-utils";
import { createTransaction } from "../services/transaction.service";

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
    const validated = insertTransactionSchema.omit({ userId: true }).parse(req.body);
    
    // 🔒 Security: Verify walletId ownership if provided
    if (validated.walletId) {
      const wallet = await storage.getWalletById(validated.walletId);
      if (!wallet || wallet.userId !== req.user.id) {
        return res.status(400).json({ error: "Invalid wallet" });
      }
    }
    
    // ✨ ML-powered transaction creation with auto-categorization
    const transaction = await createTransaction(req.user.id, {
      type: validated.type,
      amount: parseFloat(validated.amount),
      description: validated.description,
      category: validated.category || undefined,
      date: validated.date,
      currency: validated.currency || undefined,
      source: 'manual',
      walletId: validated.walletId || undefined
    });
    
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
    
    // 💱 Multi-currency: Recompute amountUsd and update conversion history if amount or currency changed
    if (data.amount || data.currency) {
      const amount = data.amount ? parseFloat(data.amount) : parseFloat(transaction.amount);
      const currency = data.currency || transaction.currency || "USD";
      
      if (currency !== "USD") {
        // Convert to USD and update conversion history
        const usdValue = convertToUSD(amount, currency);
        const rate = getExchangeRate(currency);
        data = { 
          ...data, 
          amountUsd: usdValue.toFixed(2),
          originalAmount: amount.toString(),
          originalCurrency: currency,
          exchangeRate: rate.toString(),
        };
      } else {
        // USD transaction - no conversion
        data = { 
          ...data, 
          amountUsd: amount.toFixed(2),
          originalAmount: undefined,
          originalCurrency: undefined,
          exchangeRate: undefined,
        };
      }
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

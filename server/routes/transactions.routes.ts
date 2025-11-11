import { Router } from "express";
import { storage } from "../storage";
import { insertTransactionSchema } from "@shared/schema";
import { convertToUSD, getExchangeRate } from "../services/currency-service";
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
    
    const inputCurrency = currency || "USD";
    const inputAmount = parseFloat(amount);
    
    // 💱 Multi-currency: Calculate USD amount and save conversion history
    let amountUsd: string;
    let originalAmount: string | undefined;
    let originalCurrency: string | undefined;
    let exchangeRate: string | undefined;
    
    if (inputCurrency !== "USD") {
      // Convert to USD and save original values
      const usdValue = convertToUSD(inputAmount, inputCurrency);
      amountUsd = usdValue.toFixed(2);
      originalAmount = amount;
      originalCurrency = inputCurrency;
      exchangeRate = getExchangeRate(inputCurrency).toString();
    } else {
      // USD transaction - no conversion needed
      amountUsd = amount;
    }
    
    let data = insertTransactionSchema.parse({
      ...rest,
      amount,
      amountUsd,
      currency: inputCurrency,
      originalAmount,
      originalCurrency,
      exchangeRate,
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

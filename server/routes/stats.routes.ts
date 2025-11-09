import { Router } from "express";
import { storage } from "../storage";
import { withAuth } from "../middleware/auth-utils";

const router = Router();

// GET /api/stats
router.get("/stats", withAuth(async (req, res) => {
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
}));

// GET /api/financial-health
router.get("/financial-health", withAuth(async (req, res) => {
  try {
    const { calculateFinancialHealth } = await import("../services/financial-health");
    let daysWindow = 30;
    if (req.query.days) {
      const parsed = parseInt(String(req.query.days));
      if (!isNaN(parsed) && parsed > 0) {
        daysWindow = parsed;
      }
    }
    const result = await calculateFinancialHealth(storage, req.user.id, daysWindow);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

export default router;

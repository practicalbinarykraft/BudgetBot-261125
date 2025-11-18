import { Router } from "express";
import { storage } from "../storage";
import { withAuth } from "../middleware/auth-utils";

const router = Router();

// GET /api/stats
router.get("/stats", withAuth(async (req, res) => {
  try {
    const { from, to } = req.query;
    let transactions = await storage.getTransactionsByUserId(req.user.id);
    
    // Apply date filters if provided (convert to UTC timestamps for correct comparison)
    if (from) {
      const fromDate = new Date(String(from));
      fromDate.setUTCHours(0, 0, 0, 0); // Start of day in UTC
      const fromTimestamp = fromDate.getTime();
      transactions = transactions.filter(t => new Date(t.date).getTime() >= fromTimestamp);
    }
    if (to) {
      const toDate = new Date(String(to));
      toDate.setUTCHours(23, 59, 59, 999); // End of day in UTC
      const toTimestamp = toDate.getTime();
      transactions = transactions.filter(t => new Date(t.date).getTime() <= toTimestamp);
    }
    
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amountUsd), 0);
    
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amountUsd), 0);
    
    // Calculate balance: current wallet balances minus transactions after the period
    const wallets = await storage.getWalletsByUserId(req.user.id);
    let balance = wallets.reduce((sum, w) => sum + parseFloat(w.balanceUsd || '0'), 0);
    
    // If date filter is active, subtract transactions after the 'to' date
    if (to) {
      const allTransactions = await storage.getTransactionsByUserId(req.user.id);
      // Parse 'to' as end of day in UTC for inclusive filtering
      const toDate = new Date(String(to));
      toDate.setUTCHours(23, 59, 59, 999); // End of day in UTC
      const toTimestamp = toDate.getTime();
      
      const transactionsAfter = allTransactions.filter(t => {
        const transactionDate = new Date(t.date).getTime();
        return transactionDate > toTimestamp;
      });
      
      const incomeAfter = transactionsAfter
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + parseFloat(t.amountUsd), 0);
      const expenseAfter = transactionsAfter
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + parseFloat(t.amountUsd), 0);
      balance = balance - incomeAfter + expenseAfter;
    }
    
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

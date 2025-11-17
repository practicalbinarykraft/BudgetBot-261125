import { Router } from "express";
import { storage } from "../storage";
import { insertRecurringSchema } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";
import { convertToUSD, getExchangeRate } from "../services/currency-service";

const router = Router();

// GET /api/recurring
router.get("/", withAuth(async (req, res) => {
  try {
    const recurring = await storage.getRecurringByUserId(req.user.id);
    res.json(recurring);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

// POST /api/recurring
router.post("/", withAuth(async (req, res) => {
  try {
    const inputData = {
      ...req.body,
      userId: req.user.id,
    };
    
    const currency = inputData.currency || 'USD';
    const amountStr = inputData.amount;
    const amount = parseFloat(amountStr);
    
    let amountUsd: string;
    let originalAmount: string | undefined;
    let originalCurrency: string | undefined;
    let exchangeRate: string | undefined;
    
    if (currency !== 'USD') {
      const usdValue = convertToUSD(amount, currency);
      amountUsd = usdValue.toFixed(2);
      originalAmount = amountStr;
      originalCurrency = currency;
      exchangeRate = getExchangeRate(currency).toString();
    } else {
      amountUsd = amount.toFixed(2);
    }
    
    const data = insertRecurringSchema.parse({
      ...inputData,
      amount: amountStr,
      currency,
      amountUsd,
      originalAmount,
      originalCurrency,
      exchangeRate,
    });
    
    const recurringItem = await storage.createRecurring(data);
    res.json(recurringItem);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// DELETE /api/recurring/:id
router.delete("/:id", withAuth(async (req, res) => {
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
}));

export default router;

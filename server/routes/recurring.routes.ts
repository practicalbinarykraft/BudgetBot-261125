import { Router } from "express";
import { storage } from "../storage";
import { insertRecurringSchema } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";
import { convertToUSD, getExchangeRate } from "../services/currency-service";
import { getErrorMessage } from "../lib/errors";
import { recurringRepository } from "../repositories/recurring.repository";

const router = Router();

// GET /api/recurring
// Supports pagination: ?limit=100&offset=0
router.get("/", withAuth(async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const filters: { limit?: number; offset?: number } = {};

    // Parse and validate pagination parameters
    if (limit) {
      const limitNum = parseInt(String(limit));
      if (isNaN(limitNum) || limitNum <= 0) {
        return res.status(400).json({ error: "Invalid limit parameter. Must be a positive integer." });
      }
      if (limitNum > 1000) {
        return res.status(400).json({ error: "Limit cannot exceed 1000. Please use pagination for large datasets." });
      }
      filters.limit = limitNum;
    }

    if (offset) {
      const offsetNum = parseInt(String(offset));
      if (isNaN(offsetNum) || offsetNum < 0) {
        return res.status(400).json({ error: "Invalid offset parameter. Must be a non-negative integer." });
      }
      filters.offset = offsetNum;
    }

    const result = await storage.getRecurringByUserId(Number(req.user.id), filters);

    // Unified response: always { data, pagination }
    const effectiveLimit = filters.limit ?? 100;
    const effectiveOffset = filters.offset ?? 0;
    const response = {
      data: result.recurring,
      pagination: {
        total: result.total,
        limit: effectiveLimit,
        offset: effectiveOffset,
        hasMore: effectiveOffset + result.recurring.length < result.total,
      },
    };

    res.json(response);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

// POST /api/recurring
router.post("/", withAuth(async (req, res) => {
  try {
    const inputData = {
      ...req.body,
      userId: Number(req.user.id),
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
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

// DELETE /api/recurring/:id
router.delete("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const recurringItem = await storage.getRecurringById(id);
    if (!recurringItem || recurringItem.userId !== Number(req.user.id)) {
      return res.status(404).json({ error: "Recurring payment not found" });
    }
    await storage.deleteRecurring(id);
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

// PATCH /api/recurring/:id/update-next-date
router.patch("/:id/update-next-date", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const recurringItem = await storage.getRecurringById(id);
    
    if (!recurringItem || recurringItem.userId !== Number(req.user.id)) {
      return res.status(404).json({ error: "Recurring payment not found" });
    }
    
    const { transactionDate, frequency } = req.body;
    if (!transactionDate || !frequency) {
      return res.status(400).json({ error: "transactionDate and frequency are required" });
    }
    
    const date = new Date(transactionDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: "Invalid transactionDate format" });
    }
    
    const updated = await recurringRepository.updateNextDate(id, date, frequency);
    res.json(updated);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

export default router;

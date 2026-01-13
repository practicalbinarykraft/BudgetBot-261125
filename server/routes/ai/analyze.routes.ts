import { Router } from "express";
import { storage } from "../../storage";
import { analyzeSpending, scanReceipt } from "../../services/ai-service";
import { withAuth } from "../../middleware/auth-utils";
import { predictForTransaction, enrichPrediction } from "../../services/ai/prediction.service";
import { getErrorMessage } from "../../lib/errors";

const router = Router();

// POST /api/ai/analyze
router.post("/analyze", withAuth(async (req, res) => {
  try {
    const userId = Number(req.user.id);
    
    // 🎯 Smart API key selection: BYOK or system key with credits
    const { getApiKey } = await import('../../services/api-key-manager');
    const { chargeCredits } = await import('../../services/billing.service');
    const { BillingError } = await import('../../types/billing');
    
    let apiKeyInfo;
    try {
      apiKeyInfo = await getApiKey(userId, 'financial_advisor');
    } catch (error: any) {
      if (error instanceof BillingError && error.code === 'INSUFFICIENT_CREDITS') {
        return res.status(402).json({
          error: "You have insufficient credits to use this feature. Add credits or switch to another tier.",
          creditsExhausted: true
        });
      }
      throw error;
    }
    
    const result = await storage.getTransactionsByUserId(userId);
    const analysis = await analyzeSpending(result.transactions, apiKeyInfo.key);
    
    // 💳 Charge credits if using system key
    if (apiKeyInfo.shouldCharge) {
      await chargeCredits(
        userId,
        'financial_advisor',
        apiKeyInfo.provider,
        { input: 2000, output: 500 }, // Estimated tokens for analysis
        apiKeyInfo.billingMode === 'free'
      );
    }
    
    res.json({ analysis });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

// POST /api/ai/scan-receipt
router.post("/scan-receipt", withAuth(async (req, res) => {
  try {
    const { image } = req.body;
    const userId = Number(req.user.id);
    
    if (!image) {
      return res.status(400).json({ error: "Image required" });
    }
    
    // 🎯 Smart API key selection: BYOK or system key with credits
    const { getApiKey } = await import('../../services/api-key-manager');
    const { chargeCredits } = await import('../../services/billing.service');
    const { BillingError } = await import('../../types/billing');
    
    let apiKeyInfo;
    try {
      apiKeyInfo = await getApiKey(userId, 'ocr');
    } catch (error: any) {
      if (error instanceof BillingError && error.code === 'INSUFFICIENT_CREDITS') {
        return res.status(402).json({
          error: "You have insufficient credits to use this feature. Add credits or switch to another tier.",
          creditsExhausted: true
        });
      }
      throw error;
    }
    
    const result = await scanReceipt(image, apiKeyInfo.key);
    
    // 💳 Charge credits if using system key
    if (apiKeyInfo.shouldCharge) {
      await chargeCredits(
        userId,
        'ocr',
        apiKeyInfo.provider,
        { input: 1500, output: 200 }, // Typical tokens for receipt OCR
        apiKeyInfo.billingMode === 'free'
      );
    }
    
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

// GET /api/ai/predict/:transactionId
router.get("/predict/:transactionId", withAuth(async (req, res) => {
  try {
    const transactionId = parseInt(req.params.transactionId);
    if (isNaN(transactionId)) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    const prediction = await predictForTransaction(transactionId, req.user.id);
    const enriched = await enrichPrediction(prediction, req.user.id);
    
    res.json(enriched);
  } catch (error: unknown) {
    console.error("AI prediction error:", error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

export default router;

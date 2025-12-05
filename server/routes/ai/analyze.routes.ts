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
    
    // Get API key from user settings (BYOK pattern)
    const settings = await storage.getSettingsByUserId(userId);
    const anthropicApiKey = settings?.anthropicApiKey;
    
    if (!anthropicApiKey) {
      return res.status(400).json({
        error: "Anthropic API key not configured. Please add it in Settings."
      });
    }
    
    const result = await storage.getTransactionsByUserId(userId);
    const analysis = await analyzeSpending(result.transactions, anthropicApiKey);
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
    
    // Get API key from user settings (BYOK pattern)
    const settings = await storage.getSettingsByUserId(userId);
    const anthropicApiKey = settings?.anthropicApiKey;
    
    if (!anthropicApiKey) {
      return res.status(400).json({
        error: "Anthropic API key not configured. Please add it in Settings."
      });
    }
    
    const result = await scanReceipt(image, anthropicApiKey);
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

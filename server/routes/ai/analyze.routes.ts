import { Router } from "express";
import { storage } from "../../storage";
import { analyzeSpending, scanReceipt } from "../../services/ai-service";
import { withAuth } from "../../middleware/auth-utils";
import { predictForTransaction, enrichPrediction } from "../../services/ai/prediction.service";

const router = Router();

// POST /api/ai/analyze
router.post("/analyze", withAuth(async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get API key from user settings (BYOK pattern)
    const settings = await storage.getSettingsByUserId(userId);
    const anthropicApiKey = settings?.anthropicApiKey;
    
    if (!anthropicApiKey) {
      return res.status(400).json({
        error: "Anthropic API key not configured. Please add it in Settings."
      });
    }
    
    const transactions = await storage.getTransactionsByUserId(userId);
    const analysis = await analyzeSpending(transactions, anthropicApiKey);
    res.json({ analysis });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

// POST /api/ai/scan-receipt
router.post("/scan-receipt", withAuth(async (req, res) => {
  try {
    const { image } = req.body;
    const userId = req.user.id;
    
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
  } catch (error: any) {
    console.error("AI prediction error:", error);
    res.status(500).json({ error: error.message });
  }
}));

export default router;

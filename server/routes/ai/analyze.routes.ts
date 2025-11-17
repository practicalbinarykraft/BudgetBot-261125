import { Router } from "express";
import { storage } from "../../storage";
import { analyzeSpending, scanReceipt } from "../../services/ai-service";
import { withAuth } from "../../middleware/auth-utils";
import { predictForTransaction, enrichPrediction } from "../../services/ai/prediction.service";

const router = Router();

// POST /api/ai/analyze
router.post("/analyze", withAuth(async (req, res) => {
  try {
    const transactions = await storage.getTransactionsByUserId(req.user.id);
    const analysis = await analyzeSpending(transactions);
    res.json({ analysis });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

// POST /api/ai/scan-receipt
router.post("/scan-receipt", withAuth(async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image required" });
    }
    
    const result = await scanReceipt(image);
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

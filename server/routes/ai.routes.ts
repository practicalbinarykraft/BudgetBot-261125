import { Router } from "express";
import { storage } from "../storage";
import { analyzeSpending, scanReceipt } from "../services/ai-service";
import { withAuth } from "../middleware/auth-utils";
import { predictForTransaction, enrichPrediction } from "../services/ai/prediction.service";
import { getTrainingStats, saveTrainingExample } from "../services/ai/training.service";
import { getTrainingHistory } from "../services/ai/training-history.service";
import { insertAiTrainingExampleSchema, type TrainingStats } from "@shared/schema";

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

// GET /api/ai/training-stats
router.get("/training-stats", withAuth(async (req, res) => {
  try {
    const stats: TrainingStats = await getTrainingStats(req.user.id);
    res.json(stats);
  } catch (error: any) {
    console.error("Training stats error:", error);
    res.status(500).json({ error: error.message });
  }
}));

// POST /api/ai/training
router.post("/training", withAuth(async (req, res) => {
  try {
    const validated = insertAiTrainingExampleSchema.parse(req.body);

    await saveTrainingExample({
      userId: req.user.id,
      transactionDescription: validated.transactionDescription,
      transactionAmount: validated.transactionAmount ? parseFloat(validated.transactionAmount) : undefined,
      merchantName: validated.merchantName || undefined,
      aiSuggestedCategoryId: validated.aiSuggestedCategoryId || undefined,
      aiSuggestedTagId: validated.aiSuggestedTagId || undefined,
      aiConfidence: validated.aiConfidence || undefined,
      userChosenCategoryId: validated.userChosenCategoryId || undefined,
      userChosenTagId: validated.userChosenTagId || undefined,
      userChosenType: validated.userChosenType || "discretionary",
    });

    res.status(201).json({ success: true });
  } catch (error: any) {
    console.error("Save training example error:", error);
    res.status(400).json({ error: error.message });
  }
}));

// GET /api/ai/training/history
router.get("/training/history", withAuth(async (req, res) => {
  try {
    const rawLimit = parseInt(req.query.limit as string);
    const rawOffset = parseInt(req.query.offset as string);

    const limit = Math.min(Math.max(isNaN(rawLimit) ? 50 : rawLimit, 1), 100);
    const offset = Math.max(isNaN(rawOffset) ? 0 : rawOffset, 0);

    const history = await getTrainingHistory(req.user.id, limit, offset);
    res.json(history);
  } catch (error: any) {
    console.error("Training history error:", error);
    res.status(500).json({ error: error.message });
  }
}));

export default router;

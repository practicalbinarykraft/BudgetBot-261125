import { Router } from "express";
import { withAuth } from "../../middleware/auth-utils";
import { getTrainingStats, saveTrainingExample } from "../../services/ai/training.service";
import { getTrainingHistory } from "../../services/ai/training-history.service";
import { insertAiTrainingExampleSchema, type TrainingStats } from "@shared/schema";
import { getErrorMessage } from "../../lib/errors";
import { logError } from '../../lib/logger';

const router = Router();

// GET /api/ai/training-stats
router.get("/training-stats", withAuth(async (req, res) => {
  try {
    const stats: TrainingStats = await getTrainingStats(Number(req.user.id));
    res.json(stats);
  } catch (error: unknown) {
    logError("Training stats error:", error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

// POST /api/ai/training
router.post("/training", withAuth(async (req, res) => {
  try {
    const validated = insertAiTrainingExampleSchema.parse(req.body);

    await saveTrainingExample({
      userId: Number(req.user.id),
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
  } catch (error: unknown) {
    logError("Save training example error:", error);
    res.status(400).json({ error: getErrorMessage(error) });
  }
}));

// GET /api/ai/training/history
router.get("/training/history", withAuth(async (req, res) => {
  try {
    const rawLimit = parseInt(req.query.limit as string);
    const rawOffset = parseInt(req.query.offset as string);

    const limit = Math.min(Math.max(isNaN(rawLimit) ? 50 : rawLimit, 1), 100);
    const offset = Math.max(isNaN(rawOffset) ? 0 : rawOffset, 0);

    const history = await getTrainingHistory(Number(req.user.id), limit, offset);
    res.json(history);
  } catch (error: unknown) {
    logError("Training history error:", error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

export default router;

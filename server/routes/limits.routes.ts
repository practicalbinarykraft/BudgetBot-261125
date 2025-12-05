import { Router } from "express";
import { withAuth } from "../middleware/auth-utils";
import { getBudgetProgress } from "../services/budget-progress.service";
import { checkLimitsCompliance } from "../services/budget/limits-checker.service";
import { getErrorMessage } from "../lib/errors";

const router = Router();

// GET /api/limits - получить все лимиты с прогрессом
router.get("/", withAuth(async (req, res) => {
  try {
    const limits = await getBudgetProgress(req.user.id);
    res.json(limits);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

// POST /api/limits/check - on-demand проверка всех лимитов
router.post("/check", withAuth(async (req, res) => {
  try {
    const compliance = await checkLimitsCompliance(req.user.id);
    res.json(compliance);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

export default router;

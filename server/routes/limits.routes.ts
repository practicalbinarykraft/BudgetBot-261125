import { Router } from "express";
import { withAuth } from "../middleware/auth-utils";
import { getBudgetProgress } from "../services/budget-progress.service";

const router = Router();

// GET /api/limits - получить все лимиты с прогрессом
router.get("/", withAuth(async (req, res) => {
  try {
    const limits = await getBudgetProgress(req.user.id);
    res.json(limits);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

export default router;

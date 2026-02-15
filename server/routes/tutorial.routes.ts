import { Router } from "express";
import { withAuth } from "../middleware/auth-utils";
import { completeStep, getProgress } from "../services/tutorial.service";

const router = Router();

/**
 * GET /api/tutorial
 * Get tutorial progress for the authenticated user
 */
router.get("/", withAuth(async (req, res) => {
  try {
    const userId = req.user!.id;
    const progress = await getProgress(userId);
    res.json(progress);
  } catch (error: any) {
    console.error("Error fetching tutorial progress:", error);
    res.status(500).json({ error: "Failed to fetch tutorial progress" });
  }
}));

/**
 * POST /api/tutorial/complete-step
 * Complete a tutorial step and earn credits
 */
router.post("/complete-step", withAuth(async (req, res) => {
  try {
    const userId = req.user!.id;
    const { stepId } = req.body;

    if (!stepId || typeof stepId !== "string") {
      return res.status(400).json({ error: "stepId is required" });
    }

    const result = await completeStep(userId, stepId);
    res.json(result);
  } catch (error: any) {
    if (error.message?.startsWith("Invalid tutorial step")) {
      return res.status(400).json({ error: error.message });
    }
    console.error("Error completing tutorial step:", error);
    res.status(500).json({ error: "Failed to complete tutorial step" });
  }
}));

export default router;

import { Router } from "express";
import { withAuth } from "../middleware/auth-utils";
import { getCalibrationHistory } from "../services/calibration.service";
import { getErrorMessage } from "../lib/errors";

const router = Router();

// GET /api/calibrations
router.get("/", withAuth(async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await getCalibrationHistory(userId);
    res.json(history);
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
}));

export default router;

/**
 * Advanced Analytics Routes
 *
 * Endpoints for spending forecasts, budget recommendations, and insights
 */

import { Router } from "express";
import { withAuth } from "../middleware/auth-utils";
import {
  getSpendingForecast,
  getBudgetRecommendations,
  getSpendingTrends,
  getFinancialHealthScore,
} from "../services/advanced-analytics.service";
import { getErrorMessage } from "../lib/errors";

const router = Router();

// GET /api/analytics/forecast
router.get("/forecast", withAuth(async (req, res) => {
  try {
    const forecast = await getSpendingForecast(req.user.id);
    res.json(forecast);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

// GET /api/analytics/recommendations
router.get("/recommendations", withAuth(async (req, res) => {
  try {
    const recommendations = await getBudgetRecommendations(req.user.id);
    res.json(recommendations);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

// GET /api/analytics/trends
router.get("/trends", withAuth(async (req, res) => {
  try {
    const trends = await getSpendingTrends(req.user.id);
    res.json(trends);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

// GET /api/analytics/health-score
router.get("/health-score", withAuth(async (req, res) => {
  try {
    const healthScore = await getFinancialHealthScore(req.user.id);
    res.json(healthScore);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

export default router;

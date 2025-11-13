import { Router } from "express";
import { storage } from "../storage";
import { withAuth } from "../middleware/auth-utils";
import { calculateTrend } from "../services/trend-calculator.service";

const router = Router();

/**
 * GET /api/analytics/trend
 * Returns financial trend data (historical + forecast)
 * 
 * Для джуна: Это роут - тонкий слой между клиентом и сервисом
 * Только валидация параметров и вызов сервиса
 * 
 * Query params:
 * - historyDays: number of historical days (default: 30)
 * - forecastDays: number of forecast days (default: 365)
 */
router.get("/trend", withAuth(async (req, res) => {
  try {
    const userId = req.user.id;
    
    // ШАГ 1: Распарсить и валидировать параметры
    const historyDays = parseInt(req.query.historyDays as string) || 30;
    const forecastDays = parseInt(req.query.forecastDays as string) || 365;

    // ШАГ 2: Получить API ключ пользователя для AI прогноза
    const settings = await storage.getSettingsByUserId(userId);
    const anthropicApiKey = settings?.anthropicApiKey || undefined;

    // ШАГ 3: Вызвать сервис для расчёта (ВСЯ логика там!)
    const trendData = await calculateTrend({
      userId,
      historyDays,
      forecastDays,
      anthropicApiKey,
    });

    // ШАГ 4: Вернуть результат
    res.json(trendData);
  } catch (error: any) {
    console.error("Trend data error:", error);
    res.status(500).json({ error: error.message });
  }
}));

export default router;

import { Router } from "express";
import { storage } from "../storage";
import { withAuth } from "../middleware/auth-utils";
import { calculateTrend } from "../services/trend-calculator.service";
import { getCategoryBreakdown } from "../services/analytics/category-breakdown.service";
import { getPersonBreakdown } from "../services/analytics/person-breakdown.service";
import { getTypeBreakdown } from "../services/analytics/type-breakdown.service";
import { getUnsortedTransactions } from "../services/analytics/unsorted-filter.service";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, format, addYears } from "date-fns";

const router = Router();

function getPeriodDates(period: string = 'month'): { startDate: string; endDate: string } {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (period) {
    case 'week':
      start = startOfWeek(now);
      end = endOfWeek(now);
      break;
    case 'year':
      start = startOfYear(now);
      end = endOfYear(now);
      break;
    case 'month':
    default:
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
  }

  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
  };
}

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

router.get("/by-category", withAuth(async (req, res) => {
  try {
    const period = req.query.period as string;
    const { startDate, endDate } = getPeriodDates(period);

    const breakdown = await getCategoryBreakdown(req.user.id, startDate, endDate);

    return res.json(breakdown);
  } catch (error: any) {
    console.error('Error in /api/analytics/by-category:', error);
    return res.status(500).json({ error: error.message || 'Failed to get category breakdown' });
  }
}));

router.get("/by-person", withAuth(async (req, res) => {
  try {
    const period = req.query.period as string;
    const { startDate, endDate } = getPeriodDates(period);

    const breakdown = await getPersonBreakdown(req.user.id, startDate, endDate);

    return res.json(breakdown);
  } catch (error: any) {
    console.error('Error in /api/analytics/by-person:', error);
    return res.status(500).json({ error: error.message || 'Failed to get person breakdown' });
  }
}));

router.get("/by-type", withAuth(async (req, res) => {
  try {
    const period = req.query.period as string;
    const { startDate, endDate } = getPeriodDates(period);

    const breakdown = await getTypeBreakdown(req.user.id, startDate, endDate);

    return res.json(breakdown);
  } catch (error: any) {
    console.error('Error in /api/analytics/by-type:', error);
    return res.status(500).json({ error: error.message || 'Failed to get type breakdown' });
  }
}));

router.get("/unsorted", withAuth(async (req, res) => {
  try {
    const period = req.query.period as string || 'all';
    
    let startDate: string;
    let endDate: string;
    
    if (period === 'all') {
      startDate = '1970-01-01';
      endDate = format(addYears(new Date(), 10), 'yyyy-MM-dd');
    } else {
      const dates = getPeriodDates(period);
      startDate = dates.startDate;
      endDate = dates.endDate;
    }

    const transactions = await getUnsortedTransactions(req.user.id, startDate, endDate);

    return res.json({
      count: transactions.length,
      transactions,
    });
  } catch (error: any) {
    console.error('Error in /api/analytics/unsorted:', error);
    return res.status(500).json({ error: error.message || 'Failed to get unsorted transactions' });
  }
}));

export default router;

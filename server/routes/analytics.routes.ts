import { Router } from "express";
import { storage } from "../storage";
import { withAuth } from "../middleware/auth-utils";
import { calculateTrend } from "../services/trend-calculator.service";
import { getCategoryBreakdown } from "../services/analytics/category-breakdown.service";
import { getPersonBreakdown } from "../services/analytics/person-breakdown.service";
import { getTypeBreakdown } from "../services/analytics/type-breakdown.service";
import { getUnsortedTransactions } from "../services/analytics/unsorted-filter.service";
import { getMonthlyStats, getTotalBudgetLimits } from "../services/budget-stats.service";
import { predictGoalWithStats } from "../services/goal-predictor.service";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, format, addYears } from "date-fns";
import type { PlannedTransaction } from "@shared/schema";

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
 * Returns financial trend data (historical + forecast) + planned transaction goals
 * 
 * Response includes:
 * - trendData: array of data points (income, expense, capital over time)
 * - goals: planned transactions with affordability predictions for timeline markers
 * 
 * Query params:
 * - historyDays: number of historical days (default: 30)
 * - forecastDays: number of forecast days (default: 365)
 * - includeRecurring: include recurring transactions in forecast (default: true)
 * - includePlannedIncome: include planned income in forecast (default: true)
 * - includePlannedExpenses: include planned expenses in forecast (default: true)
 * - includeBudgetLimits: include budget limits in forecast (default: false)
 */
router.get("/trend", withAuth(async (req, res) => {
  try {
    const userId = req.user.id;
    
    // ШАГ 1: Распарсить и валидировать параметры
    const historyDays = parseInt(req.query.historyDays as string) || 30;
    const forecastDays = parseInt(req.query.forecastDays as string) || 365;
    
    // ШАГ 1.5: Распарсить фильтры прогноза
    const includeRecurring = req.query.includeRecurring !== 'false';
    const includePlannedIncome = req.query.includePlannedIncome !== 'false';
    const includePlannedExpenses = req.query.includePlannedExpenses !== 'false';
    const includeBudgetLimits = req.query.includeBudgetLimits === 'true';

    // ШАГ 2: Получить API ключ пользователя для AI прогноза
    const settings = await storage.getSettingsByUserId(userId);
    const anthropicApiKey = settings?.anthropicApiKey || undefined;

    // ШАГ 3: Вызвать сервис для расчёта тренда
    const trendData = await calculateTrend({
      userId,
      historyDays,
      forecastDays,
      anthropicApiKey,
      includeRecurring,
      includePlannedIncome,
      includePlannedExpenses,
      includeBudgetLimits,
    });

    // ШАГ 4: Получить planned transaction goals с предсказаниями для timeline markers
    const allPlanned = await storage.getPlannedByUserId(userId);
    const planned = allPlanned.filter((item: PlannedTransaction) => item.status === 'planned');
    const stats = await getMonthlyStats(userId);
    const budgetLimits = await getTotalBudgetLimits(userId);
    const today = new Date();
    
    // Добавить AI predictions и derived priority к каждой цели
    const goals = planned
      .map((item: PlannedTransaction) => {
        const amount = parseFloat(item.amount);
        
        if (isNaN(amount) || amount <= 0) {
          return {
            ...item,
            prediction: null,
            priority: 'low',
          };
        }
        
        // Derive priority from targetDate proximity
        const targetDate = new Date(item.targetDate);
        const daysUntil = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        let priority: string;
        if (daysUntil < 0 || daysUntil <= 30) {
          priority = 'high'; // Overdue or within 30 days
        } else if (daysUntil <= 90) {
          priority = 'medium'; // 31-90 days
        } else {
          priority = 'low'; // >90 days
        }
        
        const prediction = predictGoalWithStats(amount, stats, budgetLimits);
        return {
          ...item,
          prediction,
          priority,
        };
      })
      .filter((item: any) => item.prediction?.monthsToAfford !== null); // Только доступные цели

    // ШАГ 5: Вернуть тренд + цели
    res.json({
      trendData,
      goals,
    });
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

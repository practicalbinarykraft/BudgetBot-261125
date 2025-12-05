import { Router } from "express";
import { storage } from "../storage";
import { withAuth } from "../middleware/auth-utils";
import { heavyOperationRateLimiter } from "../middleware/rate-limit";
import { getErrorMessage } from "../lib/errors";
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

// Apply rate limiting to all analytics routes (computationally expensive)
router.use(heavyOperationRateLimiter);

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
 * - graphMode: 'lite' (all filters auto-enabled) or 'pro' (manual control, default: lite)
 * - capitalMode: 'cash' (only money) or 'networth' (money + assets - liabilities, default: networth)
 * - useAI: use AI forecast (opt-in, default: false)
 * 
 * LITE MODE (graphMode='lite'):
 * - All forecast filters are automatically enabled (true)
 * - User sees simplified UI with zero configuration
 * 
 * PRO MODE (graphMode='pro'):
 * - includeRecurringIncome: include recurring income in forecast (default: true)
 * - includeRecurringExpense: include recurring expenses in forecast (default: true)
 * - includePlannedIncome: include planned income in forecast (default: true)
 * - includePlannedExpenses: include planned expenses in forecast (default: true)
 * - includeBudgetLimits: include budget limits in forecast (default: false)
 * - includeAssetIncome: include asset income in forecast (default: true)
 * - includeLiabilityExpense: include liability expenses in forecast (default: true)
 * - includeAssetValue: include asset value in capital calculation (default: true)
 * - includeLiabilityValue: include liability value in capital calculation (default: true)
 */
router.get("/trend", withAuth(async (req, res) => {
  try {
    const userId = Number(req.user.id);

    // ШАГ 1: Распарсить и валидировать параметры
    const historyDays = parseInt(req.query.historyDays as string) || 30;
    const forecastDays = parseInt(req.query.forecastDays as string) || 365;
    const graphMode = (req.query.graphMode as 'lite' | 'pro') || 'lite';
    
    // ШАГ 1.5: Capital Mode и Forecast Type
    const capitalMode = (req.query.capitalMode as 'cash' | 'networth') || 'networth';
    const useAI = req.query.useAI === 'true'; // Opt-in для AI прогноза
    
    // ШАГ 1.6: Распарсить фильтры прогноза в зависимости от graphMode
    let includeRecurringIncome: boolean;
    let includeRecurringExpense: boolean;
    let includePlannedIncome: boolean;
    let includePlannedExpenses: boolean;
    let includeBudgetLimits: boolean;
    let includeAssetIncome: boolean;
    let includeLiabilityExpense: boolean;
    let includeAssetValue: boolean;
    let includeLiabilityValue: boolean;
    
    if (graphMode === 'lite') {
      // В LITE всё включено автоматически
      includeRecurringIncome = true;
      includeRecurringExpense = true;
      includePlannedIncome = true;
      includePlannedExpenses = true;
      includeBudgetLimits = true;
      includeAssetIncome = true;
      includeLiabilityExpense = true;
      includeAssetValue = capitalMode === 'networth';
      includeLiabilityValue = capitalMode === 'networth';
    } else {
      // В PRO берём из query параметров
      includeRecurringIncome = req.query.includeRecurringIncome !== 'false';
      includeRecurringExpense = req.query.includeRecurringExpense !== 'false';
      includePlannedIncome = req.query.includePlannedIncome !== 'false';
      includePlannedExpenses = req.query.includePlannedExpenses !== 'false';
      includeBudgetLimits = req.query.includeBudgetLimits === 'true';
      includeAssetIncome = req.query.includeAssetIncome !== 'false';
      includeLiabilityExpense = req.query.includeLiabilityExpense !== 'false';
      includeAssetValue = capitalMode === 'networth' ? (req.query.includeAssetValue !== 'false') : false;
      includeLiabilityValue = capitalMode === 'networth' ? (req.query.includeLiabilityValue !== 'false') : false;
    }

    // ШАГ 2: Получить API ключ пользователя для AI прогноза
    const settings = await storage.getSettingsByUserId(userId);
    const anthropicApiKey = settings?.anthropicApiKey || undefined;

    // ШАГ 3: Вызвать сервис для расчёта тренда (с metadata)
    const result = await calculateTrend({
      userId,
      historyDays,
      forecastDays,
      anthropicApiKey,
      useAI,
      includeRecurringIncome,
      includeRecurringExpense,
      includePlannedIncome,
      includePlannedExpenses,
      includeBudgetLimits,
      includeAssetIncome,
      includeLiabilityExpense,
      includeAssetValue,
      includeLiabilityValue,
    });
    
    const { trendData, metadata } = result;

    // ШАГ 4: Получить planned transaction goals с предсказаниями для timeline markers
    const allPlanned = await storage.getPlannedByUserId(userId);
    const planned = allPlanned.filter((item: PlannedTransaction) => item.status === 'planned' && item.showOnChart !== false);
    const stats = await getMonthlyStats(userId);
    const budgetLimits = await getTotalBudgetLimits(userId);
    const today = new Date();
    
    // Получить текущий капитал (сумма всех кошельков)
    const walletsResult = await storage.getWalletsByUserId(userId);
    const wallets = walletsResult.wallets;
    const currentCapital = wallets.reduce((sum, w) => {
      const balance = parseFloat(w.balanceUsd || w.balance || "0");
      return sum + (isNaN(balance) ? 0 : balance);
    }, 0);
    
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
        
        const prediction = predictGoalWithStats(
          amount, 
          stats, 
          budgetLimits, 
          currentCapital, 
          item.targetDate
        );
        return {
          ...item,
          prediction,
          priority,
        };
      })

    // ШАГ 5: Вернуть тренд + цели + metadata (already ISO string)
    res.json({
      trendData,
      goals,
      metadata, // Already serialized to ISO string in forecast.service.ts
    });
  } catch (error: unknown) {
    console.error("Trend data error:", error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

router.get("/by-category", withAuth(async (req, res) => {
  try {
    const period = req.query.period as string;
    const { startDate, endDate } = getPeriodDates(period);

    const breakdown = await getCategoryBreakdown(req.user.id, startDate, endDate);

    return res.json(breakdown);
  } catch (error: unknown) {
    console.error('Error in /api/analytics/by-category:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}));

router.get("/by-person", withAuth(async (req, res) => {
  try {
    const period = req.query.period as string;
    const { startDate, endDate } = getPeriodDates(period);

    const breakdown = await getPersonBreakdown(req.user.id, startDate, endDate);

    return res.json(breakdown);
  } catch (error: unknown) {
    console.error('Error in /api/analytics/by-person:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}));

router.get("/by-type", withAuth(async (req, res) => {
  try {
    const period = req.query.period as string;
    const { startDate, endDate } = getPeriodDates(period);

    const breakdown = await getTypeBreakdown(req.user.id, startDate, endDate);

    return res.json(breakdown);
  } catch (error: unknown) {
    console.error('Error in /api/analytics/by-type:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
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
  } catch (error: unknown) {
    console.error('Error in /api/analytics/unsorted:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}));

export default router;

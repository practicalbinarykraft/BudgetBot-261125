/**
 * Сервис расчёта данных для графика Financial Trend
 * 
 * Для джуна: Этот файл считает что показывать на графике
 * - Берёт транзакции из базы
 * - Группирует по дням
 * - Делает income/expense накопительными (плавные линии вместо импульсов)
 * - Получает прогноз от AI
 */

import { storage } from "../storage";
import { generateForecast } from "./forecast.service";
import { makeCumulative } from "../lib/charts/cumulative";
import { 
  calculateHistoricalData, 
  makeCumulativeFromBase,
  type TrendDataPoint 
} from "../lib/charts/historical-data-helpers";
import {
  getRecurringIncomeForDate,
  getRecurringExpenseForDate,
  getPlannedIncomeForDate,
  getPlannedExpenseForDate,
  getDailyBudgetTotal,
} from "./forecast-filters.service";

export type { TrendDataPoint };

export interface TrendWithMetadata {
  trendData: TrendDataPoint[];
  metadata: {
    usedAI: boolean;
    fromCache: boolean;
    cacheExpiresAt: string | null; // ISO string for JSON serialization
  };
}

/**
 * Параметры расчёта тренда
 */
export interface TrendCalculationParams {
  userId: number;
  historyDays: number;
  forecastDays: number;
  anthropicApiKey?: string;
  useAI?: boolean;
  includeRecurringIncome?: boolean;
  includeRecurringExpense?: boolean;
  includePlannedIncome?: boolean;
  includePlannedExpenses?: boolean;
  includeBudgetLimits?: boolean;
}

/**
 * Главная функция расчёта тренда
 * 
 * Что делает:
 * 1. Берёт транзакции из БД
 * 2. Считает исторические данные по дням
 * 3. Делает income/expense накопительными
 * 4. Получает прогноз от AI
 * 5. Делает прогноз накопительным (продолжая от последнего исторического значения)
 */
export async function calculateTrend(
  params: TrendCalculationParams
): Promise<TrendWithMetadata> {
  const { 
    userId, 
    historyDays, 
    forecastDays, 
    anthropicApiKey,
    useAI = false,
    includeRecurringIncome = true,
    includeRecurringExpense = true,
    includePlannedIncome = true,
    includePlannedExpenses = true,
    includeBudgetLimits = false,
  } = params;

  // ШАГ 1: Получить данные из базы
  const transactions = await storage.getTransactionsByUserId(userId);
  const wallets = await storage.getWalletsByUserId(userId);
  
  // Защита от NaN: нормализовать балансы перед суммированием
  const currentCapital = wallets.reduce(
    (sum, w) => sum + Number(w.balanceUsd ?? 0),
    0
  );

  // ШАГ 2: Рассчитать исторические данные
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const historyStart = new Date(today);
  historyStart.setDate(today.getDate() - historyDays);
  const historyStartStr = historyStart.toISOString().split('T')[0];
  
  const historicalData = calculateHistoricalData(transactions, historyDays);

  // ШАГ 3: Сделать income/expense накопительными (плавные линии!)
  const historicalCumulative = makeCumulative(historicalData);

  // ШАГ 3.5: Рассчитать capital с учётом баланса кошельков
  // Capital на начало периода = текущий баланс - (доход после начала - расход после начала)
  const transactionsAfterPeriodStart = transactions.filter(t => t.date >= historyStartStr);
  const incomeAfterStart = transactionsAfterPeriodStart
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amountUsd as unknown as string), 0);
  const expenseAfterStart = transactionsAfterPeriodStart
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amountUsd as unknown as string), 0);
  
  const capitalAtPeriodStart = currentCapital - incomeAfterStart + expenseAfterStart;
  
  // Capital для каждого дня = начальный капитал + cumulative income - cumulative expense
  historicalCumulative.forEach(point => {
    point.capital = capitalAtPeriodStart + point.income - point.expense;
  });

  // ШАГ 4: Получить прогноз от AI (если есть API ключ)
  const { forecastData, metadata } = await generateAndProcessForecast({
    userId,
    anthropicApiKey,
    useAI,
    forecastDays,
    currentCapital,
    capitalAtPeriodStart,
    historicalCumulative,
    includeRecurringIncome,
    includeRecurringExpense,
    includePlannedIncome,
    includePlannedExpenses,
    includeBudgetLimits,
  });

  // ШАГ 5: Объединить историю + прогноз и вернуть с metadata
  return {
    trendData: [...historicalCumulative, ...forecastData],
    metadata,
  };
}

/**
 * Генерация и обработка прогноза
 * Возвращает forecast data + metadata (usedAI, fromCache, cacheExpiresAt)
 */
async function generateAndProcessForecast(params: {
  userId: number;
  anthropicApiKey?: string;
  useAI?: boolean;
  forecastDays: number;
  currentCapital: number;
  capitalAtPeriodStart: number;
  historicalCumulative: TrendDataPoint[];
  includeRecurringIncome: boolean;
  includeRecurringExpense: boolean;
  includePlannedIncome: boolean;
  includePlannedExpenses: boolean;
  includeBudgetLimits: boolean;
}): Promise<{
  forecastData: TrendDataPoint[];
  metadata: {
    usedAI: boolean;
    fromCache: boolean;
    cacheExpiresAt: string | null; // ISO string for JSON serialization
  };
}> {
  const {
    userId,
    anthropicApiKey,
    useAI = false,
    forecastDays,
    currentCapital,
    capitalAtPeriodStart,
    historicalCumulative,
    includeRecurringIncome,
    includeRecurringExpense,
    includePlannedIncome,
    includePlannedExpenses,
    includeBudgetLimits,
  } = params;

  if (forecastDays === 0) {
    return {
      forecastData: [],
      metadata: {
        usedAI: false,
        fromCache: false,
        cacheExpiresAt: null, // string | null
      },
    };
  }

  try {
    const result = await generateForecast(
      userId,
      anthropicApiKey || '',
      forecastDays,
      currentCapital,
      useAI,
      // Передаем фильтры для правильного cache key
      {
        includeRecurringIncome,
        includeRecurringExpense,
        includePlannedIncome,
        includePlannedExpenses,
        includeBudgetLimits,
      }
    );

    // Apply filters to forecast data (recurring, planned, budget limits)
    // Capital is calculated immediately after filters to avoid stale data
    const forecastDataWithFilters = await Promise.all(
      result.forecast.map(async (f, index) => {
        const date = new Date(f.date);
        let income = f.predictedIncome;
        let expense = f.predictedExpense;
        
        // Apply filters if enabled
        if (includeRecurringIncome) {
          const recurringIncome = await getRecurringIncomeForDate(userId, date);
          income += recurringIncome;
        }
        
        if (includeRecurringExpense) {
          const recurringExpense = await getRecurringExpenseForDate(userId, date);
          expense += recurringExpense;
        }
        
        if (includePlannedIncome) {
          const plannedIncome = await getPlannedIncomeForDate(userId, date);
          income += plannedIncome;
        }
        
        if (includePlannedExpenses) {
          const plannedExpense = await getPlannedExpenseForDate(userId, date);
          expense += plannedExpense;
        }
        
        if (includeBudgetLimits) {
          const budgetTotal = await getDailyBudgetTotal(userId, date);
          expense += budgetTotal;
        }
        
        return {
          date: f.date,
          income,
          expense,
          capital: 0, // Will be recalculated below in running sum
          isToday: false,
          isForecast: true,
        };
      })
    );
    
    // Convert to cumulative format and recalculate capital
    // makeCumulativeFromBase takes DAILY deltas and converts to CUMULATIVE totals
    // Example: daily=[{income:10}, {income:15}] + base=100 → cumulative=[{income:110}, {income:125}]
    // Capital is simply: baseCapital + cumulativeIncome - cumulativeExpense
    // This ensures capital reflects ALL filters (recurring, planned, budget)
    let forecastData = forecastDataWithFilters;

    if (historicalCumulative.length > 0) {
      const lastHistorical = historicalCumulative[historicalCumulative.length - 1];
      forecastData = makeCumulativeFromBase(
        forecastData,
        lastHistorical.income,
        lastHistorical.expense
      );
      // Capital = base capital + cumulative income - cumulative expense
      // Note: makeCumulativeFromBase already added lastHistorical income/expense to each point
      // So we need to calculate capital from capitalAtPeriodStart, NOT lastHistorical.capital
      forecastData.forEach((point: TrendDataPoint) => {
        point.capital = capitalAtPeriodStart + point.income - point.expense;
      });
    } else {
      forecastData = makeCumulativeFromBase(forecastData, 0, 0);
      forecastData.forEach((point: TrendDataPoint) => {
        point.capital = currentCapital + point.income - point.expense;
      });
    }

    return {
      forecastData,
      metadata: result.metadata,
    };
  } catch (error: any) {
    console.error("Forecast generation failed:", error.message);
    return {
      forecastData: [],
      metadata: {
        usedAI: false,
        fromCache: false,
        cacheExpiresAt: null, // string | null
      },
    };
  }
}


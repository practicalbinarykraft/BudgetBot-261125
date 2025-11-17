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

export type { TrendDataPoint };

/**
 * Параметры расчёта тренда
 */
export interface TrendCalculationParams {
  userId: number;
  historyDays: number;
  forecastDays: number;
  anthropicApiKey?: string;
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
): Promise<TrendDataPoint[]> {
  const { userId, historyDays, forecastDays, anthropicApiKey } = params;

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
  const forecastData = await generateAndProcessForecast({
    userId,
    anthropicApiKey,
    forecastDays,
    currentCapital,
    capitalAtPeriodStart,
    historicalCumulative,
  });

  // ШАГ 5: Объединить историю + прогноз
  return [...historicalCumulative, ...forecastData];
}

/**
 * Генерация и обработка прогноза
 */
async function generateAndProcessForecast(params: {
  userId: number;
  anthropicApiKey?: string;
  forecastDays: number;
  currentCapital: number;
  capitalAtPeriodStart: number;
  historicalCumulative: TrendDataPoint[];
}): Promise<TrendDataPoint[]> {
  const {
    userId,
    anthropicApiKey,
    forecastDays,
    currentCapital,
    capitalAtPeriodStart,
    historicalCumulative,
  } = params;

  if (!anthropicApiKey || forecastDays === 0) {
    return [];
  }

  try {
    const forecast = await generateForecast(
      userId,
      anthropicApiKey,
      forecastDays,
      currentCapital
    );

    let forecastData = forecast.map(f => ({
      date: f.date,
      income: f.predictedIncome,
      expense: f.predictedExpense,
      capital: f.predictedCapital,
      isToday: false,
      isForecast: true,
    }));

    if (historicalCumulative.length > 0) {
      const lastHistorical = historicalCumulative[historicalCumulative.length - 1];
      forecastData = makeCumulativeFromBase(
        forecastData,
        lastHistorical.income,
        lastHistorical.expense
      );
      forecastData.forEach(point => {
        point.capital = capitalAtPeriodStart + point.income - point.expense;
      });
    } else {
      forecastData = makeCumulativeFromBase(forecastData, 0, 0);
      forecastData.forEach(point => {
        point.capital = currentCapital + point.income - point.expense;
      });
    }

    return forecastData;
  } catch (error: any) {
    console.error("Forecast generation failed:", error.message);
    return [];
  }
}


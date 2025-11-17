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
import { generateDateRange } from "../lib/charts/chart-formatters";
import { makeCumulative } from "../lib/charts/cumulative";
import type { Transaction } from "@shared/schema";

/**
 * Точка данных для графика
 */
export interface TrendDataPoint {
  date: string;
  income: number;     // Накопительный доход (cumulative)
  expense: number;    // Накопительный расход (cumulative)
  capital: number;    // Капитал (доход - расход)
  isToday: boolean;   // Сегодняшняя дата (для вертикальной линии)
  isForecast: boolean; // Прогноз или история
}

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
  
  const historicalData = calculateHistoricalData(
    transactions,
    historyDays,
    currentCapital
  );

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
  let forecastData: TrendDataPoint[] = [];
  
  if (anthropicApiKey && forecastDays > 0) {
    try {
      const forecast = await generateForecast(
        userId,
        anthropicApiKey,
        forecastDays,
        currentCapital
      );

      // ШАГ 5: Преобразовать прогноз в формат графика
      forecastData = forecast.map(f => ({
        date: f.date,
        income: f.predictedIncome,    // Пока дневные значения
        expense: f.predictedExpense,  // Пока дневные значения
        capital: f.predictedCapital,
        isToday: false,
        isForecast: true,
      }));

      // ШАГ 6: Сделать прогноз накопительным и рассчитать capital
      
      if (historicalCumulative.length > 0) {
        // Есть история: продолжаем от последней исторической точки
        const lastHistorical = historicalCumulative[historicalCumulative.length - 1];
        
        // Income/Expense продолжаются накопительно
        forecastData = makeCumulativeFromBase(
          forecastData,
          lastHistorical.income,
          lastHistorical.expense
        );

        // Capital = начальный капитал + cumulative income - cumulative expense
        forecastData.forEach(point => {
          point.capital = capitalAtPeriodStart + point.income - point.expense;
        });
      } else {
        // Нет истории: начинаем с текущего баланса кошельков
        forecastData = makeCumulativeFromBase(forecastData, 0, 0);

        // Capital = текущий баланс + cumulative income - cumulative expense
        forecastData.forEach(point => {
          point.capital = currentCapital + point.income - point.expense;
        });
      }

    } catch (error: any) {
      console.error("Forecast generation failed:", error.message);
      // Продолжаем без прогноза
    }
  }

  // ШАГ 7: Объединить историю + прогноз
  return [...historicalCumulative, ...forecastData];
}

/**
 * Рассчитать исторические данные
 * 
 * Для джуна: Берём транзакции и группируем по дням
 * Каждый день считаем доход и расход (пока НЕ накопительные)
 */
function calculateHistoricalData(
  transactions: Transaction[],
  historyDays: number,
  currentCapital: number
): TrendDataPoint[] {
  // Определить диапазон дат
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const historyStart = new Date(today);
  historyStart.setDate(today.getDate() - historyDays);
  const historyStartStr = historyStart.toISOString().split('T')[0];

  // ВАЖНО: Фильтруем транзакции только за нужный период!
  // Иначе будем обрабатывать ВСЕ транзакции пользователя (медленно!)
  const filteredTransactions = transactions.filter(t => 
    t.date >= historyStartStr && t.date <= todayStr
  );

  // ВАЖНО: Если нет транзакций в filtered range - вернуть пустой массив!
  // Это позволит forecast branch правильно обработать пустую историю
  if (filteredTransactions.length === 0) {
    return [];
  }

  // Генерировать массив дат
  const dateRange = generateDateRange(historyStart, today);
  const historicalData: TrendDataPoint[] = [];

  // Для каждого дня считаем доход/расход
  for (const dateStr of dateRange) {
    const dayTransactions = filteredTransactions.filter(t => t.date === dateStr);
    
    const dayIncome = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amountUsd as unknown as string), 0);
    
    const dayExpense = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amountUsd as unknown as string), 0);

    historicalData.push({
      date: dateStr,
      income: dayIncome,      // ДНЕВНОЕ значение (позже станет накопительным)
      expense: dayExpense,    // ДНЕВНОЕ значение (позже станет накопительным)
      capital: 0,             // Будет рассчитан позже на основе накопительных
      isToday: dateStr === todayStr,
      isForecast: false,
    });
  }

  return historicalData;
}

/**
 * Сделать массив накопительным, начиная с базовых значений
 * 
 * Для джуна: Как одометр который уже показывает 1000 км,
 * и мы продолжаем отсчёт дальше
 */
function makeCumulativeFromBase<T extends { income: number; expense: number }>(
  dataPoints: T[],
  baseIncome: number,
  baseExpense: number
): T[] {
  let cumulativeIncome = baseIncome;
  let cumulativeExpense = baseExpense;

  return dataPoints.map((point) => {
    cumulativeIncome += point.income || 0;
    cumulativeExpense += point.expense || 0;

    return {
      ...point,
      income: cumulativeIncome,
      expense: cumulativeExpense,
    };
  });
}

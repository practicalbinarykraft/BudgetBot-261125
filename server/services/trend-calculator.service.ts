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
import { generateForecast } from "./forecast";
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
  getAssetIncomeForDate,
  getLiabilityExpenseForDate,
} from "./forecast-filters.service";
import { assetsRepository } from "../repositories/assets.repository";
import { assetValueCalculator } from './asset-value-calculator.service';
import { liabilityCalculator } from './liability-calculator.service';

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
  includeAssetIncome?: boolean;
  includeLiabilityExpense?: boolean;
  includeAssetValue?: boolean;
  includeLiabilityValue?: boolean;
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
    includeAssetIncome = true,
    includeLiabilityExpense = true,
    includeAssetValue = true,
    includeLiabilityValue = true,
  } = params;

  // ШАГ 1: Получить данные из базы
  const { transactions } = await storage.getTransactionsByUserId(userId);
  const { wallets } = await storage.getWalletsByUserId(userId);
  const assetsRaw = await assetsRepository.findByUserId(userId);

  // Распаковать структуру {asset, category} в плоский массив
  const assets = assetsRaw.map(item => item.asset);

  // Защита от NaN: нормализовать балансы перед суммированием
  const currentWalletsBalance = wallets.reduce(
    (sum, w) => sum + Number(w.balanceUsd ?? 0),
    0
  );
  
  // Рассчитать чистую стоимость активов (assets - liabilities)
  // Используем Number() вместо parseFloat для безопасного приведения типов
  const currentAssetsValue = assets
    .filter(a => a.type === 'asset')
    .reduce((sum, a) => sum + Number(a.currentValue ?? 0), 0);
    
  const currentLiabilitiesValue = assets
    .filter(a => a.type === 'liability')
    .reduce((sum, a) => sum + Number(a.currentValue ?? 0), 0);
    
  // Рассчитать чистую стоимость активов с учётом фильтров
  let currentAssetsNet = 0;
  if (includeAssetValue) {
    currentAssetsNet += currentAssetsValue;
  }
  if (includeLiabilityValue) {
    currentAssetsNet -= currentLiabilitiesValue;
  }
  
  // Полный капитал = кошельки + активы (опционально) - пассивы (опционально)
  const currentCapital = currentWalletsBalance + currentAssetsNet;

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
  // Вычислить баланс кошельков на начало периода (до любых транзакций в периоде)
  // walletsAtStart = currentWalletsBalance - (cumulative income до сегодня - cumulative expense до сегодня)
  let walletsBalanceAtPeriodStart: number;
  
  if (historicalCumulative.length > 0) {
    const lastPoint = historicalCumulative[historicalCumulative.length - 1];
    // Вычесть кумулятивную разницу (доход - расход) от текущего баланса
    walletsBalanceAtPeriodStart = currentWalletsBalance - (lastPoint.income - lastPoint.expense);
  } else {
    // Если нет исторических данных, используем текущий баланс
    walletsBalanceAtPeriodStart = currentWalletsBalance;
  }
  
  // Capital для каждого дня = баланс кошельков на начало периода + cumulative income - cumulative expense + assetsNet
  // AssetsNet теперь ДИНАМИЧЕН - рассчитывается для каждой даты с учётом роста/падения/платежей
  historicalCumulative.forEach(point => {
    const pointDate = new Date(point.date);
    let totalAssetsValue = 0;
    let totalLiabilitiesValue = 0;
    
    // Рассчитать стоимость каждого актива/обязательства на эту дату
    for (const item of assetsRaw) {
      const asset = item.asset;
      
      if (asset.type === 'asset' && includeAssetValue) {
        // Актив (квартира, машина) - растёт или падает
        const value = assetValueCalculator.calculateValueAtDate(asset, pointDate);
        totalAssetsValue += value;
      } else if (asset.type === 'liability' && includeLiabilityValue) {
        // Обязательство (кредит) - уменьшается с платежами
        const value = liabilityCalculator.calculateValueAtDate(asset, pointDate);
        totalLiabilitiesValue += value; // Уже отрицательное!
      }
    }
    
    // Чистая стоимость = активы + обязательства (обязательства отрицательные)
    point.assetsNet = totalAssetsValue + totalLiabilitiesValue;
    point.capital = walletsBalanceAtPeriodStart + point.income - point.expense + point.assetsNet;
  });

  // ШАГ 4: Получить прогноз от AI (если есть API ключ)
  const { forecastData, metadata } = await generateAndProcessForecast({
    userId,
    anthropicApiKey,
    useAI,
    forecastDays,
    currentWalletsBalance,
    walletsBalanceAtPeriodStart,
    currentAssetsNet,
    assetsRaw,
    historicalCumulative,
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
  currentWalletsBalance: number;
  walletsBalanceAtPeriodStart: number;
  currentAssetsNet: number;
  assetsRaw: Array<{ asset: any; category: any }>;
  historicalCumulative: TrendDataPoint[];
  includeRecurringIncome: boolean;
  includeRecurringExpense: boolean;
  includePlannedIncome: boolean;
  includePlannedExpenses: boolean;
  includeBudgetLimits: boolean;
  includeAssetIncome: boolean;
  includeLiabilityExpense: boolean;
  includeAssetValue: boolean;
  includeLiabilityValue: boolean;
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
    currentWalletsBalance,
    walletsBalanceAtPeriodStart,
    currentAssetsNet,
    assetsRaw,
    historicalCumulative,
    includeRecurringIncome,
    includeRecurringExpense,
    includePlannedIncome,
    includePlannedExpenses,
    includeBudgetLimits,
    includeAssetIncome,
    includeLiabilityExpense,
    includeAssetValue,
    includeLiabilityValue,
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
    // For AI forecast, we need total capital (wallets + assetsNet)
    const totalCapital = currentWalletsBalance + currentAssetsNet;
    
    const result = await generateForecast(
      userId,
      anthropicApiKey || '',
      forecastDays,
      totalCapital,
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
        
        if (includeAssetIncome) {
          const assetIncome = await getAssetIncomeForDate(userId, date);
          income += assetIncome;
        }
        
        if (includeLiabilityExpense) {
          const liabilityExpense = await getLiabilityExpenseForDate(userId, date);
          expense += liabilityExpense;
        }
        
        return {
          date: f.date,
          income,
          expense,
          capital: 0, // Will be recalculated below in running sum
          assetsNet: 0, // Will be set after forecast
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
      // Capital for forecast must continue from last historical wallet balance
      // baseWalletsForForecast = wallets balance at end of last historical point
      const baseWalletsForForecast = walletsBalanceAtPeriodStart + lastHistorical.income - lastHistorical.expense;
      
      // Since makeCumulativeFromBase adds lastHistorical to each forecast point,
      // we compute delta from lastHistorical and add to baseWalletsForForecast
      const lastHistoricalDate = new Date(lastHistorical.date);
      
      forecastData.forEach((point: TrendDataPoint) => {
        // Рассчитать реальное количество месяцев от последней исторической точки
        const pointDate = new Date(point.date);
        const milliseconds = pointDate.getTime() - lastHistoricalDate.getTime();
        const days = milliseconds / (1000 * 60 * 60 * 24);
        const monthsAhead = days / 30.44; // Среднее количество дней в месяце
        
        let totalAssetsValue = 0;
        let totalLiabilitiesValue = 0;
        
        // Спрогнозировать стоимость каждого актива/обязательства
        for (const item of assetsRaw) {
          const asset = item.asset;
          
          if (asset.type === 'asset' && includeAssetValue) {
            const projectedValue = assetValueCalculator.projectValue(asset, monthsAhead);
            totalAssetsValue += projectedValue;
          } else if (asset.type === 'liability' && includeLiabilityValue) {
            const projectedValue = liabilityCalculator.projectValue(asset, monthsAhead);
            totalLiabilitiesValue += projectedValue; // Уже отрицательное!
          }
        }
        
        point.assetsNet = totalAssetsValue + totalLiabilitiesValue;
        const walletsDelta = (point.income - lastHistorical.income) - (point.expense - lastHistorical.expense);
        point.capital = baseWalletsForForecast + walletsDelta + point.assetsNet;
      });
    } else {
      forecastData = makeCumulativeFromBase(forecastData, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      forecastData.forEach((point: TrendDataPoint) => {
        // Рассчитать реальное количество месяцев от сегодня до даты прогноза
        const pointDate = new Date(point.date);
        const milliseconds = pointDate.getTime() - today.getTime();
        const days = milliseconds / (1000 * 60 * 60 * 24);
        const monthsAhead = days / 30.44; // Среднее количество дней в месяце
        
        let totalAssetsValue = 0;
        let totalLiabilitiesValue = 0;
        
        // Спрогнозировать стоимость каждого актива/обязательства
        for (const item of assetsRaw) {
          const asset = item.asset;
          
          if (asset.type === 'asset' && includeAssetValue) {
            const projectedValue = assetValueCalculator.projectValue(asset, monthsAhead);
            totalAssetsValue += projectedValue;
          } else if (asset.type === 'liability' && includeLiabilityValue) {
            const projectedValue = liabilityCalculator.projectValue(asset, monthsAhead);
            totalLiabilitiesValue += projectedValue; // Уже отрицательное!
          }
        }
        
        point.assetsNet = totalAssetsValue + totalLiabilitiesValue;
        point.capital = currentWalletsBalance + point.income - point.expense + point.assetsNet;
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


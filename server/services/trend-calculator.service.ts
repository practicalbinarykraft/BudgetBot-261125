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
    //
    // OPTIMIZATION: Process filters in batches to avoid DB timeout
    // For now, use simple cumulative approach for recurring payments
    let forecastDataWithFilters: Array<{
      date: string;
      income: number;
      expense: number;
      capital: number;
      assetsNet: number;
      isToday: boolean;
      isForecast: boolean;
    }>;

    try {
      // Pre-fetch recurring data once instead of per-day queries
      const recurringData = await storage.getRecurringByUserId(userId);
      const activeRecurring = recurringData.recurring.filter(r => r.isActive);

      // Pre-fetch planned transactions
      const plannedData = await storage.getPlannedByUserId(userId);
      const activePlanned = plannedData.filter(p => p.status === 'planned');

      // Pre-fetch budgets for later per-day calculation
      let budgetsData: Array<{ limitAmount: string; period: string; startDate: string | null }> = [];
      if (includeBudgetLimits) {
        const { budgets } = await storage.getBudgetsByUserId(userId);
        budgetsData = budgets.map(b => ({
          limitAmount: b.limitAmount as unknown as string,
          period: b.period,
          startDate: b.startDate,
        }));
      }

      forecastDataWithFilters = result.forecast.map((f) => {
        const date = new Date(f.date);
        let income = f.predictedIncome;
        let expense = f.predictedExpense;

        // Apply budget limits (daily equivalent, respecting startDate)
        if (includeBudgetLimits && budgetsData.length > 0) {
          for (const b of budgetsData) {
            // Check if budget has started
            if (b.startDate) {
              const startDate = new Date(b.startDate);
              if (date < startDate) continue; // Skip budgets that haven't started
            }

            const limit = parseFloat(b.limitAmount) || 0;
            switch (b.period) {
              case 'day':
                expense += limit;
                break;
              case 'week':
                expense += limit / 7;
                break;
              case 'month':
                expense += limit / 30;
                break;
              case 'year':
                expense += limit / 365;
                break;
              default:
                expense += limit / 30;
            }
          }
        }

        // Apply recurring income/expense from pre-fetched data
        if (includeRecurringIncome || includeRecurringExpense) {
          for (const recurring of activeRecurring) {
            const amount = parseFloat(recurring.amount) || 0;
            const isIncome = recurring.type === 'income';

            // Simple monthly recurrence check
            // Note: nextDate is stored as 'YYYY-MM-DD' string, parse day directly
            if (recurring.frequency === 'monthly') {
              const dayOfMonth = date.getUTCDate();
              // Extract day from nextDate string (format: "YYYY-MM-DD")
              const recurringDay = parseInt(recurring.nextDate.split('-')[2], 10);
              if (dayOfMonth === recurringDay) {
                if (isIncome && includeRecurringIncome) income += amount;
                if (!isIncome && includeRecurringExpense) expense += amount;
              }
            } else if (recurring.frequency === 'weekly') {
              const dayOfWeek = date.getUTCDay();
              // Get recurring day of week from nextDate
              const nextDateParts = recurring.nextDate.split('-');
              const nextDateObj = new Date(Date.UTC(
                parseInt(nextDateParts[0], 10),
                parseInt(nextDateParts[1], 10) - 1,
                parseInt(nextDateParts[2], 10)
              ));
              const recurringDayOfWeek = nextDateObj.getUTCDay();
              if (dayOfWeek === recurringDayOfWeek) {
                if (isIncome && includeRecurringIncome) income += amount;
                if (!isIncome && includeRecurringExpense) expense += amount;
              }
            } else if (recurring.frequency === 'daily') {
              if (isIncome && includeRecurringIncome) income += amount;
              if (!isIncome && includeRecurringExpense) expense += amount;
            }
          }
        }

        // Apply planned transactions from pre-fetched data
        if (includePlannedIncome || includePlannedExpenses) {
          for (const planned of activePlanned) {
            const targetDate = new Date(planned.targetDate);
            if (targetDate.toISOString().split('T')[0] === f.date) {
              const amount = parseFloat(planned.amount) || 0;
              const isIncome = planned.type === 'income';
              if (isIncome && includePlannedIncome) income += amount;
              if (!isIncome && includePlannedExpenses) expense += amount;
            }
          }
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
      });
    } catch (filterError) {
      console.warn('[Forecast] Filter application failed, using base forecast:', filterError);
      // Fallback: use base forecast without filters
      forecastDataWithFilters = result.forecast.map((f) => ({
        date: f.date,
        income: f.predictedIncome,
        expense: f.predictedExpense,
        capital: 0,
        assetsNet: 0,
        isToday: false,
        isForecast: true,
      }));
    }
    
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
        // Рассчитать стоимость активов напрямую для даты прогноза
        // Используем тот же метод calculateValueAtDate что и для истории - это обеспечивает непрерывность
        const pointDate = new Date(point.date);

        let totalAssetsValue = 0;
        let totalLiabilitiesValue = 0;

        // Рассчитать стоимость каждого актива/обязательства на дату прогноза
        for (const item of assetsRaw) {
          const asset = item.asset;

          if (asset.type === 'asset' && includeAssetValue) {
            // Используем тот же метод что и для истории
            const value = assetValueCalculator.calculateValueAtDate(asset, pointDate);
            totalAssetsValue += value;
          } else if (asset.type === 'liability' && includeLiabilityValue) {
            // Используем тот же метод что и для истории
            const value = liabilityCalculator.calculateValueAtDate(asset, pointDate);
            totalLiabilitiesValue += value; // Уже отрицательное!
          }
        }

        point.assetsNet = totalAssetsValue + totalLiabilitiesValue;
        const walletsDelta = (point.income - lastHistorical.income) - (point.expense - lastHistorical.expense);
        point.capital = baseWalletsForForecast + walletsDelta + point.assetsNet;
      });
    } else {
      forecastData = makeCumulativeFromBase(forecastData, 0, 0);

      forecastData.forEach((point: TrendDataPoint) => {
        // Рассчитать стоимость активов напрямую для даты прогноза
        const pointDate = new Date(point.date);

        let totalAssetsValue = 0;
        let totalLiabilitiesValue = 0;

        // Рассчитать стоимость каждого актива/обязательства на дату прогноза
        for (const item of assetsRaw) {
          const asset = item.asset;

          if (asset.type === 'asset' && includeAssetValue) {
            const value = assetValueCalculator.calculateValueAtDate(asset, pointDate);
            totalAssetsValue += value;
          } else if (asset.type === 'liability' && includeLiabilityValue) {
            const value = liabilityCalculator.calculateValueAtDate(asset, pointDate);
            totalLiabilitiesValue += value; // Уже отрицательное!
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
  } catch (error: unknown) {
    console.error("Forecast generation failed:", error instanceof Error ? error.message : String(error));
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


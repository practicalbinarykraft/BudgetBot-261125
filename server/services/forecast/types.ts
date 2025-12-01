/**
 * Forecast Service Types and Interfaces
 *
 * Type definitions for financial forecasting
 * Junior-Friendly: <40 lines, focused on type definitions
 */

export interface ForecastDataPoint {
  date: string;
  predictedIncome: number;
  predictedExpense: number;
  predictedCapital: number;
}

export interface ForecastResult {
  forecast: ForecastDataPoint[];
  metadata: {
    usedAI: boolean;
    fromCache: boolean;
    cacheExpiresAt: string | null; // ISO string for JSON serialization
  };
}

export interface ForecastFilters {
  includeRecurringIncome?: boolean;
  includeRecurringExpense?: boolean;
  includePlannedIncome?: boolean;
  includePlannedExpenses?: boolean;
  includeBudgetLimits?: boolean;
}

export interface HistoricalStats {
  avgDailyIncome: number;
  avgDailyExpense: number;
  totalIncome: number;
  totalExpense: number;
  incomeCount: number;
  expenseCount: number;
}

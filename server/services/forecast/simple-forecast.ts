/**
 * Simple Forecast Generator
 *
 * Fallback forecast generation without AI
 * Returns base forecast with zero income/expense for filter application
 * Junior-Friendly: <70 lines, focused on simple linear forecast
 */

import type { ForecastDataPoint } from "./types";

/**
 * Generate simple linear forecast without AI
 *
 * Returns BASE forecast with ZERO income/expense
 * Filters (recurring, planned, budget, assets) are applied separately in trend-calculator
 *
 * FIX: Previously used avgIncome/avgExpense as base, which caused income to grow
 * even when all filters were disabled. Now returns 0 for both, and filters
 * add their contributions on top of zero baseline.
 *
 * @param daysAhead Number of days to forecast
 * @param avgIncome Average daily income (not used - kept for compatibility)
 * @param avgExpense Average daily expense (not used - kept for compatibility)
 * @param currentCapital Current total capital/net worth
 * @param hasRecurringIncome Whether user has recurring income (not used - kept for compatibility)
 * @returns Array of forecast data points
 */
export function generateSimpleForecast(
  daysAhead: number,
  avgIncome: number,
  avgExpense: number,
  currentCapital: number,
  hasRecurringIncome: boolean
): ForecastDataPoint[] {
  const forecast: ForecastDataPoint[] = [];
  let runningCapital = currentCapital;

  const today = new Date();

  for (let i = 1; i <= daysAhead; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i);
    const dateStr = forecastDate.toISOString().split('T')[0];

    // BASE forecast is ZERO for both income and expense
    // Filters will add recurring/planned/budget/asset components
    // This ensures: No filters = flat lines (no growth)
    const dailyIncome = 0;
    const dailyExpense = 0;
    runningCapital = runningCapital + dailyIncome - dailyExpense;

    forecast.push({
      date: dateStr,
      predictedIncome: dailyIncome,
      predictedExpense: dailyExpense,
      predictedCapital: runningCapital,
    });
  }

  return forecast;
}

/**
 * Build forecast from cached AI data
 *
 * IMPORTANT: Recalculates capital from currentCapital using cached income/expense
 * to ensure continuity with historical data regardless of base capital changes.
 *
 * Why not use cached capital directly:
 * - If user makes transactions after caching, currentCapital changes
 * - If user makes historical transactions, capitalAtPeriodStart changes
 * - Simple offset doesn't account for these changes → discontinuity
 *
 * Solution: Recalculate capital from currentCapital as running sum of income - expense
 * Note: May deviate slightly from AI's capital if AI used non-linear patterns,
 * but ensures smooth continuity with historical data.
 *
 * @param cached Cached AI forecast data
 * @param currentCapital Current total capital/net worth
 * @returns Array of forecast data points
 */
export function buildForecastFromCache(
  cached: {
    dailyIncome: number[];
    dailyExpense: number[];
    dailyCapital: number[]; // Not used, kept for reference
    baseCapital: number; // Not used
    expiresAt: Date;
  },
  currentCapital: number
): ForecastDataPoint[] {
  const forecast: ForecastDataPoint[] = [];
  const today = new Date();
  let runningCapital = currentCapital; // Start from current capital

  for (let i = 0; i < cached.dailyIncome.length; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i + 1);
    const dateStr = forecastDate.toISOString().split('T')[0];

    const income = cached.dailyIncome[i] || 0;
    const expense = cached.dailyExpense[i] || 0;
    runningCapital = runningCapital + income - expense; // Recalculate capital

    forecast.push({
      date: dateStr,
      predictedIncome: income,
      predictedExpense: expense,
      predictedCapital: runningCapital,
    });
  }

  return forecast;
}

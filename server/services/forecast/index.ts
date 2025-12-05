/**
 * Forecast Service - Main Entry Point
 *
 * Orchestrates AI and simple forecasting with fallback logic
 * Junior-Friendly: <120 lines, focused on coordination
 */

import { storage } from "../../storage";
import type { ForecastResult, ForecastFilters } from "./types";
import { getHistoricalTransactions, calculateHistoricalStats } from "./utils";
import { generateSimpleForecast } from "./simple-forecast";
import { generateAIForecast } from "./ai-forecast";

/**
 * Generate financial forecast
 *
 * Main entry point for forecast generation
 * Handles AI forecast with fallback to simple forecast
 *
 * @param userId User ID
 * @param apiKey User's Anthropic API key (BYOK)
 * @param daysAhead Number of days to forecast
 * @param currentCapital Current total capital/net worth
 * @param useAI Whether to use AI forecast (opt-in, default: false)
 * @param filters Forecast filters (for cache key)
 * @returns Forecast result with metadata
 */
export async function generateForecast(
  userId: number,
  apiKey: string,
  daysAhead: number,
  currentCapital: number,
  useAI: boolean = false,
  filters?: ForecastFilters
): Promise<ForecastResult> {
  // Get historical data (last 90 days)
  const historicalDays = 90;
  const historicalTransactions = await getHistoricalTransactions(userId, historicalDays);

  // Get recurring payments
  const { recurring: recurringPayments } = await storage.getRecurringByUserId(userId);
  const activeRecurring = recurringPayments.filter(r => r.isActive);

  // Calculate historical averages
  const stats = calculateHistoricalStats(historicalTransactions);

  // If useAI=false or no API key, use simple forecast immediately
  if (!useAI || !apiKey) {
    const reason = !useAI ? 'AI forecast not requested (opt-in)' : 'No API key provided';
    console.log(`[Forecast] ${reason}, using simple linear forecast`);

    // Check if user has any recurring income sources
    const hasRecurringIncome = activeRecurring.some(r => r.type === 'income');

    const forecast = generateSimpleForecast(
      daysAhead,
      stats.avgDailyIncome,
      stats.avgDailyExpense,
      currentCapital,
      hasRecurringIncome
    );
    return {
      forecast,
      metadata: {
        usedAI: false,
        fromCache: false,
        cacheExpiresAt: null,
      },
    };
  }

  // Try AI forecast with timeout and error handling
  try {
    return await generateAIForecast(
      userId,
      apiKey,
      daysAhead,
      currentCapital,
      stats,
      activeRecurring,
      filters || {},
      historicalDays
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : '';
    const isTimeout = errorName === 'AbortError' || errorMessage?.includes('timeout');
    if (isTimeout) {
      console.warn('[Forecast] AI request timed out after 30s, using simple forecast');
    } else {
      console.error('[Forecast] AI forecast failed:', errorMessage);
    }

    // Fallback to simple linear forecast
    const hasRecurringIncome = activeRecurring.some(r => r.type === 'income');
    const forecast = generateSimpleForecast(
      daysAhead,
      stats.avgDailyIncome,
      stats.avgDailyExpense,
      currentCapital,
      hasRecurringIncome
    );
    return {
      forecast,
      metadata: {
        usedAI: false,
        fromCache: false,
        cacheExpiresAt: null,
      },
    };
  }
}

// Re-export types for convenience
export type { ForecastDataPoint, ForecastResult, ForecastFilters } from "./types";

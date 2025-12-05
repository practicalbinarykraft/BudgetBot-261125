/**
 * Currency Update Service
 *
 * Automatically fetches latest exchange rates from external API
 * and updates the in-memory cache used by currency-service.ts
 *
 * Features:
 * - Fetches from ExchangeRate-API (free, 1500 requests/month)
 * - Updates every 24 hours via cron job
 * - Fallback to static rates if API fails
 * - Graceful error handling
 */

import axios from 'axios';
import logger from '../lib/logger';
import { db } from '../db';
import { exchangeRateHistory } from '@shared/schema';

// Exchange rates cache (shared with currency-service.ts)
let latestRates: Record<string, number> = {
  USD: 1,
  RUB: 92.5,
  IDR: 15750,
  KRW: 1320,
  EUR: 0.92,
  CNY: 7.24,
};

let lastUpdated: Date = new Date();
let isApiAvailable: boolean = false;

/**
 * Fetch latest exchange rates from API
 * Free API: https://www.exchangerate-api.com/
 * No API key needed for basic usage (1500 requests/month)
 */
export async function fetchLatestRates(): Promise<boolean> {
  try {
    logger.info('Fetching latest exchange rates from API...');

    // Use free API endpoint (no key needed, but limited to 1500/month)
    const response = await axios.get(
      'https://api.exchangerate-api.com/v4/latest/USD',
      { timeout: 10000 }
    );

    if (response.status === 200 && response.data?.rates) {
      const rates = response.data.rates;

      // Update rates (all rates are relative to USD = 1)
      latestRates = {
        USD: 1,
        RUB: rates.RUB || latestRates.RUB,
        IDR: rates.IDR || latestRates.IDR,
        KRW: rates.KRW || latestRates.KRW,
        EUR: rates.EUR || latestRates.EUR,
        CNY: rates.CNY || latestRates.CNY,
      };

      lastUpdated = new Date();
      isApiAvailable = true;

      // Save to history table
      try {
        const historyEntries = Object.entries(latestRates).map(([currencyCode, rate]) => ({
          currencyCode,
          rate: rate.toString(),
          source: 'api',
        }));

        await db.insert(exchangeRateHistory).values(historyEntries);

        logger.info('✅ Exchange rates updated and saved to history', {
          rates: latestRates,
          timestamp: lastUpdated.toISOString(),
        });
      } catch (historyError: unknown) {
        // Don't fail the whole update if history save fails
        logger.error('Failed to save rate history', {
          error: historyError instanceof Error ? historyError.message : String(historyError),
        });
      }

      return true;
    }

    throw new Error('Invalid API response');
  } catch (error: unknown) {
    isApiAvailable = false;

    logger.error('❌ Failed to fetch exchange rates', {
      error: error instanceof Error ? error.message : String(error),
      fallback: 'Using static rates',
    });

    // Continue using static fallback rates
    return false;
  }
}

/**
 * Get current exchange rates
 */
export function getCurrentRates(): Record<string, number> {
  return { ...latestRates };
}

/**
 * Get last update timestamp
 */
export function getLastUpdated(): Date {
  return lastUpdated;
}

/**
 * Check if API is available
 */
export function isLiveRatesAvailable(): boolean {
  return isApiAvailable;
}

/**
 * Get rate info for API response
 */
export function getRateInfo() {
  return {
    rates: getCurrentRates(),
    lastUpdated: lastUpdated.toISOString(),
    source: isApiAvailable ? 'live_api' : 'static_fallback',
    nextUpdate: isApiAvailable
      ? new Date(lastUpdated.getTime() + 24 * 60 * 60 * 1000).toISOString()
      : 'unavailable',
  };
}

/**
 * Initialize service on startup
 */
export async function initCurrencyUpdates(): Promise<void> {
  logger.info('Initializing currency update service...');

  // Fetch rates immediately on startup
  await fetchLatestRates();

  logger.info('Currency update service initialized', {
    apiAvailable: isApiAvailable,
    lastUpdated: lastUpdated.toISOString(),
  });
}

/**
 * Get exchange rate history for a currency
 */
export async function getRateHistory(params: {
  currencyCode: string;
  days?: number;
  limit?: number;
}) {
  const { currencyCode, days = 30, limit = 100 } = params;

  try {
    const { desc, and, eq, gte } = await import('drizzle-orm');

    // Calculate date cutoff
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const history = await db
      .select()
      .from(exchangeRateHistory)
      .where(
        and(
          eq(exchangeRateHistory.currencyCode, currencyCode),
          gte(exchangeRateHistory.createdAt, cutoffDate)
        )
      )
      .orderBy(desc(exchangeRateHistory.createdAt))
      .limit(limit);

    return history;
  } catch (error: unknown) {
    logger.error('Failed to fetch rate history', {
      error: error instanceof Error ? error.message : String(error),
      currencyCode,
    });
    return [];
  }
}

/**
 * Get all supported currencies history
 */
export async function getAllRatesHistory(params: {
  days?: number;
  limit?: number;
}) {
  const { days = 30, limit = 100 } = params;

  try {
    const { desc, gte } = await import('drizzle-orm');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const history = await db
      .select()
      .from(exchangeRateHistory)
      .where(gte(exchangeRateHistory.createdAt, cutoffDate))
      .orderBy(desc(exchangeRateHistory.createdAt))
      .limit(limit);

    return history;
  } catch (error: unknown) {
    logger.error('Failed to fetch all rates history', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

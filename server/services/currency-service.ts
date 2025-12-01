// Multi-currency conversion service with caching
// In production, this would use a real-time currency API like exchangerate-api.com

import { db } from '../db';
import { settings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { cache } from '../lib/redis';
import { getCurrentRates } from './currency-update.service';

// Static exchange rates (fallback values if API fails)
// Format: "X units of currency = 1 USD"
const EXCHANGE_RATES_FALLBACK: Record<string, number> = {
  USD: 1,
  RUB: 92.5,   // 1 USD = 92.5 RUB (fallback)
  IDR: 15750,  // 1 USD = 15,750 IDR (fallback)
  KRW: 1320,   // 1 USD = 1,320 KRW (fallback)
  EUR: 0.92,   // 1 USD = 0.92 EUR (fallback)
  CNY: 7.24,   // 1 USD = 7.24 CNY (fallback)
};

// Get current rates (live if available, fallback if not)
function getBaseRates(): Record<string, number> {
  try {
    const liveRates = getCurrentRates();
    return liveRates;
  } catch {
    return EXCHANGE_RATES_FALLBACK;
  }
}

// In-memory cache for user-specific exchange rates
interface UserRateCache {
  userId: number;
  rates: Record<string, number>;
  timestamp: number;
}

const userRateCache = new Map<number, UserRateCache>();
const USER_CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Invalidate cache for a specific user (call when settings are updated)
 */
export async function invalidateUserRateCache(userId: number): Promise<void> {
  // Invalidate both in-memory and Redis cache
  userRateCache.delete(userId);
  await cache.del(`exchange-rates:user:${userId}`);
}

/**
 * Get exchange rates for a user (custom rates > static fallback)
 */
export async function getUserExchangeRates(userId: number): Promise<Record<string, number>> {
  const cacheKey = `exchange-rates:user:${userId}`;

  // Try Redis cache first
  const cachedRates = await cache.get<Record<string, number>>(cacheKey);
  if (cachedRates) {
    return cachedRates;
  }

  // Check in-memory cache (fallback)
  const cached = userRateCache.get(userId);
  if (cached && Date.now() - cached.timestamp < USER_CACHE_TTL) {
    return cached.rates;
  }

  // Fetch user settings from database
  const [userSettings] = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, userId))
    .limit(1);

  // Start with live rates (or fallback)
  const rates: Record<string, number> = { ...getBaseRates() };

  if (userSettings) {
    // Override with custom rates if set
    if (userSettings.exchangeRateRUB) {
      rates.RUB = parseFloat(userSettings.exchangeRateRUB as unknown as string);
    }
    if (userSettings.exchangeRateIDR) {
      rates.IDR = parseFloat(userSettings.exchangeRateIDR as unknown as string);
    }
    if (userSettings.exchangeRateKRW) {
      rates.KRW = parseFloat(userSettings.exchangeRateKRW as unknown as string);
    }
    if (userSettings.exchangeRateEUR) {
      rates.EUR = parseFloat(userSettings.exchangeRateEUR as unknown as string);
    }
    if (userSettings.exchangeRateCNY) {
      rates.CNY = parseFloat(userSettings.exchangeRateCNY as unknown as string);
    }
  }

  // Update both caches (Redis: 1 hour, in-memory: 1 hour)
  await cache.set(cacheKey, rates, USER_CACHE_TTL);
  userRateCache.set(userId, {
    userId,
    rates,
    timestamp: Date.now(),
  });

  return rates;
}

/**
 * Convert amount to USD
 * @param rates - Optional custom rates, defaults to static EXCHANGE_RATES
 */
export function convertToUSD(amount: number, currency: string, rates?: Record<string, number>): number {
  const exchangeRates = rates || getBaseRates();
  const rate = exchangeRates[currency] || 1;
  return amount / rate;
}

export function convertFromUSD(amount: number, currency: string, rates?: Record<string, number>): number {
  const exchangeRates = rates || getBaseRates();
  const rate = exchangeRates[currency] || 1;
  return amount * rate;
}

export function getSupportedCurrencies(): string[] {
  return Object.keys(getBaseRates());
}

export function getExchangeRate(currency: string, rates?: Record<string, number>): number {
  const exchangeRates = rates || getBaseRates();
  return exchangeRates[currency] || 1;
}

export interface ExchangeRateInfo {
  rates: Record<string, number>;
  lastUpdated: string;
  source: string;
}

export async function getExchangeRateInfo(userId?: number): Promise<ExchangeRateInfo> {
  // Import rate info from update service
  const { getRateInfo } = await import('./currency-update.service');

  if (userId) {
    const rates = await getUserExchangeRates(userId);
    const cached = userRateCache.get(userId);
    return {
      rates,
      lastUpdated: cached ? new Date(cached.timestamp).toISOString() : new Date().toISOString(),
      source: cached ? "user_cache" : "user_settings",
    };
  }

  // Return live rates with update info
  return getRateInfo();
}

// Helper to get conversion with rate info
export function convertWithRate(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates?: Record<string, number>
): {
  amount: number;
  rate: number;
} {
  if (fromCurrency === toCurrency) {
    return { amount, rate: 1 };
  }
  
  // Convert to USD first, then to target currency
  const usdAmount = convertToUSD(amount, fromCurrency, rates);
  const finalAmount = toCurrency === "USD" ? usdAmount : convertFromUSD(usdAmount, toCurrency, rates);
  
  // Calculate the actual rate used
  const rate = fromCurrency === "USD" 
    ? getExchangeRate(toCurrency, rates)
    : toCurrency === "USD"
      ? 1 / getExchangeRate(fromCurrency, rates)
      : getExchangeRate(toCurrency, rates) / getExchangeRate(fromCurrency, rates);
  
  return {
    amount: finalAmount,
    rate,
  };
}

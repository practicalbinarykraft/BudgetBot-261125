// Multi-currency conversion service with caching
// In production, this would use a real-time currency API like exchangerate-api.com

import { db } from '../db';
import { settings } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Static exchange rates (fallback values)
// Format: "X units of currency = 1 USD"
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  RUB: 92.5,   // 1 USD = 92.5 RUB (fallback)
  IDR: 15750,  // 1 USD = 15,750 IDR (fallback)
  KRW: 1320,   // 1 USD = 1,320 KRW (fallback)
  EUR: 0.92,   // 1 USD = 0.92 EUR (fallback)
  CNY: 7.24,   // 1 USD = 7.24 CNY (fallback)
};

// In-memory cache for user-specific exchange rates
interface UserRateCache {
  userId: number;
  rates: Record<string, number>;
  timestamp: number;
}

const userRateCache = new Map<number, UserRateCache>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Invalidate cache for a specific user (call when settings are updated)
 */
export function invalidateUserRateCache(userId: number): void {
  userRateCache.delete(userId);
}

/**
 * Get exchange rates for a user (custom rates > static fallback)
 */
export async function getUserExchangeRates(userId: number): Promise<Record<string, number>> {
  // Check cache first
  const cached = userRateCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.rates;
  }

  // Fetch user settings
  const [userSettings] = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, userId))
    .limit(1);

  const rates: Record<string, number> = { ...EXCHANGE_RATES };

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

  // Update cache
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
  const exchangeRates = rates || EXCHANGE_RATES;
  const rate = exchangeRates[currency] || 1;
  return amount / rate;
}

export function convertFromUSD(amount: number, currency: string, rates?: Record<string, number>): number {
  const exchangeRates = rates || EXCHANGE_RATES;
  const rate = exchangeRates[currency] || 1;
  return amount * rate;
}

export function getSupportedCurrencies(): string[] {
  return Object.keys(EXCHANGE_RATES);
}

export function getExchangeRate(currency: string, rates?: Record<string, number>): number {
  const exchangeRates = rates || EXCHANGE_RATES;
  return exchangeRates[currency] || 1;
}

export interface ExchangeRateInfo {
  rates: Record<string, number>;
  lastUpdated: string;
  source: string;
}

export async function getExchangeRateInfo(userId?: number): Promise<ExchangeRateInfo> {
  if (userId) {
    const rates = await getUserExchangeRates(userId);
    const cached = userRateCache.get(userId);
    return {
      rates,
      lastUpdated: cached ? new Date(cached.timestamp).toISOString() : new Date().toISOString(),
      source: cached ? "user_cache" : "user_settings",
    };
  }
  
  // Return static rates
  return {
    rates: { ...EXCHANGE_RATES },
    lastUpdated: new Date().toISOString(),
    source: "static",
  };
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

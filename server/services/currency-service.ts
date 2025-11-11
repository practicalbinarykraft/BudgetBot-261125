// Multi-currency conversion service with caching
// In production, this would use a real-time currency API like exchangerate-api.com

// Static exchange rates (fallback values)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  RUB: 92.5,  // 1 USD = 92.5 RUB
  IDR: 15750, // 1 USD = 15,750 IDR
};

// In-memory cache for exchange rates
interface RateCache {
  rates: Record<string, number>;
  timestamp: number;
}

let rateCache: RateCache | null = null;
const CACHE_TTL = 3600000; // 1 hour in milliseconds

export function convertToUSD(amount: number, currency: string): number {
  const rate = EXCHANGE_RATES[currency] || 1;
  return amount / rate;
}

export function convertFromUSD(amount: number, currency: string): number {
  const rate = EXCHANGE_RATES[currency] || 1;
  return amount * rate;
}

export function getSupportedCurrencies(): string[] {
  return Object.keys(EXCHANGE_RATES);
}

export function getExchangeRate(currency: string): number {
  // Check cache first
  if (rateCache && Date.now() - rateCache.timestamp < CACHE_TTL) {
    return rateCache.rates[currency] || EXCHANGE_RATES[currency] || 1;
  }
  
  // Return fallback rate
  return EXCHANGE_RATES[currency] || 1;
}

export interface ExchangeRateInfo {
  rates: Record<string, number>;
  lastUpdated: string;
  source: string;
}

export async function getExchangeRateInfo(): Promise<ExchangeRateInfo> {
  // Check cache
  if (rateCache && Date.now() - rateCache.timestamp < CACHE_TTL) {
    return {
      rates: rateCache.rates,
      lastUpdated: new Date(rateCache.timestamp).toISOString(),
      source: "cache",
    };
  }
  
  // In production, fetch from API here
  // For now, use static rates
  const rates = { ...EXCHANGE_RATES };
  
  // Update cache
  rateCache = {
    rates,
    timestamp: Date.now(),
  };
  
  return {
    rates,
    lastUpdated: new Date(rateCache.timestamp).toISOString(),
    source: "static",
  };
}

// Helper to get conversion with rate info
export function convertWithRate(amount: number, fromCurrency: string, toCurrency: string): {
  amount: number;
  rate: number;
} {
  if (fromCurrency === toCurrency) {
    return { amount, rate: 1 };
  }
  
  // Convert to USD first, then to target currency
  const usdAmount = convertToUSD(amount, fromCurrency);
  const finalAmount = toCurrency === "USD" ? usdAmount : convertFromUSD(usdAmount, toCurrency);
  
  // Calculate the actual rate used
  const rate = fromCurrency === "USD" 
    ? getExchangeRate(toCurrency)
    : toCurrency === "USD"
      ? 1 / getExchangeRate(fromCurrency)
      : getExchangeRate(toCurrency) / getExchangeRate(fromCurrency);
  
  return {
    amount: finalAmount,
    rate,
  };
}

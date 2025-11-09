// Simple currency conversion service
// In production, this would use a real-time currency API like exchangerate-api.com

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  RUB: 92.5,
  IDR: 15750,
};

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
  return EXCHANGE_RATES[currency] || 1;
}

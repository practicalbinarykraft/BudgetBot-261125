import type { Transaction } from "@shared/schema";

export interface CurrencyDisplay {
  mainAmount: string;
  mainSymbol: string;
  convertedAmount?: string;
  showConversion: boolean;
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    RUB: "₽",
    IDR: "Rp",
    KRW: "₩",
    EUR: "€",
    CNY: "¥",
  };
  return symbols[currency] || currency;
}

/**
 * Convert USD amount to target currency using exchange rate
 * @param usdAmount - Amount in USD
 * @param targetCurrency - Target currency code
 * @param exchangeRate - Exchange rate (how many units of target currency = 1 USD)
 */
export function convertFromUSD(usdAmount: number, targetCurrency: string, exchangeRate: number): number {
  if (targetCurrency === 'USD') return usdAmount;
  return usdAmount * exchangeRate;
}

function isValidAmount(value: string | null | undefined): boolean {
  if (value == null) return false;
  const trimmed = String(value).trim();
  if (trimmed === '') return false;
  const num = Number(trimmed);
  return Number.isFinite(num);
}

export function formatTransactionAmount(transaction: Transaction): CurrencyDisplay {
  const hasValidOriginal = isValidAmount(transaction.originalAmount) && transaction.originalCurrency;
  const hasValidUsd = isValidAmount(transaction.amountUsd);
  
  if (hasValidOriginal && transaction.originalAmount && transaction.originalCurrency) {
    const mainAmt = Math.abs(Number(transaction.originalAmount));
    const symbol = getCurrencySymbol(transaction.originalCurrency);
    
    if (hasValidUsd && transaction.amountUsd) {
      const convertedAmt = Math.abs(Number(transaction.amountUsd));
      return {
        mainAmount: mainAmt.toFixed(2),
        mainSymbol: symbol,
        convertedAmount: convertedAmt.toFixed(2),
        showConversion: true,
      };
    }
    
    return {
      mainAmount: mainAmt.toFixed(2),
      mainSymbol: symbol,
      showConversion: false,
    };
  }
  
  if (hasValidUsd && transaction.amountUsd) {
    const usdAmt = Math.abs(Number(transaction.amountUsd));
    return {
      mainAmount: usdAmt.toFixed(2),
      mainSymbol: "$",
      showConversion: false,
    };
  }
  
  return {
    mainAmount: "0.00",
    mainSymbol: "$",
    showConversion: false,
  };
}

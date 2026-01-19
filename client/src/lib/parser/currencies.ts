/**
 * Currency Patterns
 *
 * Detects currency from text.
 * Supports 20+ currencies with symbols and words.
 */

import { CurrencyPattern } from './types';

// All supported currencies
export const CURRENCY_PATTERNS: CurrencyPattern[] = [
  // RUB - Russian Ruble
  { pattern: /руб(?:л[яией]+)?\.?/i, currency: 'RUB' },
  { pattern: /₽/i, currency: 'RUB' },
  { pattern: /р\.?(?:\s|$)/i, currency: 'RUB' },
  { pattern: /rub/i, currency: 'RUB' },

  // USD - US Dollar
  { pattern: /(?:долл?(?:ар(?:ов|а)?)?|бакс(?:ов|а)?)/i, currency: 'USD' },
  { pattern: /\$/, currency: 'USD' },
  { pattern: /usd/i, currency: 'USD' },
  { pattern: /американских/i, currency: 'USD' },

  // EUR - Euro
  { pattern: /евро?/i, currency: 'EUR' },
  { pattern: /€/, currency: 'EUR' },
  { pattern: /eur/i, currency: 'EUR' },

  // IDR - Indonesian Rupiah
  { pattern: /рупи[йя]/i, currency: 'IDR' },
  { pattern: /idr/i, currency: 'IDR' },
  { pattern: /индонезийских/i, currency: 'IDR' },

  // CNY - Chinese Yuan
  { pattern: /юан[яией]?/i, currency: 'CNY' },
  { pattern: /cny|rmb/i, currency: 'CNY' },
  { pattern: /¥/, currency: 'CNY' },
  { pattern: /китайских/i, currency: 'CNY' },

  // KRW - South Korean Won
  { pattern: /вон(?:ов|а)?/i, currency: 'KRW' },
  { pattern: /krw/i, currency: 'KRW' },
  { pattern: /₩/, currency: 'KRW' },
  { pattern: /корейских/i, currency: 'KRW' },

  // KZT - Kazakhstani Tenge
  { pattern: /тенге/i, currency: 'KZT' },
  { pattern: /kzt/i, currency: 'KZT' },
  { pattern: /₸/i, currency: 'KZT' },

  // UAH - Ukrainian Hryvnia
  { pattern: /гривн[аыуеі]?/i, currency: 'UAH' },
  { pattern: /грн\.?/i, currency: 'UAH' },
  { pattern: /uah/i, currency: 'UAH' },
  { pattern: /₴/i, currency: 'UAH' },

  // BYN - Belarusian Ruble
  { pattern: /белорусских/i, currency: 'BYN' },
  { pattern: /byn|byr/i, currency: 'BYN' },

  // GEL - Georgian Lari
  { pattern: /лари/i, currency: 'GEL' },
  { pattern: /gel/i, currency: 'GEL' },
  { pattern: /₾/i, currency: 'GEL' },

  // THB - Thai Baht
  { pattern: /бат(?:ов|а)?/i, currency: 'THB' },
  { pattern: /thb/i, currency: 'THB' },
  { pattern: /฿/i, currency: 'THB' },

  // VND - Vietnamese Dong
  { pattern: /донг(?:ов|а)?/i, currency: 'VND' },
  { pattern: /vnd/i, currency: 'VND' },
  { pattern: /₫/i, currency: 'VND' },

  // TRY - Turkish Lira
  { pattern: /лир[аыуе]?/i, currency: 'TRY' },
  { pattern: /try|tl/i, currency: 'TRY' },
  { pattern: /₺/i, currency: 'TRY' },

  // AED - UAE Dirham
  { pattern: /дирхам(?:ов|а)?/i, currency: 'AED' },
  { pattern: /aed/i, currency: 'AED' },

  // GBP - British Pound
  { pattern: /фунт(?:ов|а)?(?:\s*стерлинг)?/i, currency: 'GBP' },
  { pattern: /gbp/i, currency: 'GBP' },
  { pattern: /£/, currency: 'GBP' },

  // JPY - Japanese Yen
  { pattern: /йен[аыуе]?/i, currency: 'JPY' },
  { pattern: /иен[аыуе]?/i, currency: 'JPY' },
  { pattern: /jpy/i, currency: 'JPY' },

  // PLN - Polish Zloty
  { pattern: /злот(?:ых|ый|ого)?/i, currency: 'PLN' },
  { pattern: /pln/i, currency: 'PLN' },
  { pattern: /zł/i, currency: 'PLN' },

  // CZK - Czech Koruna
  { pattern: /крон(?:ы|а)?/i, currency: 'CZK' },
  { pattern: /czk/i, currency: 'CZK' },
  { pattern: /Kč/i, currency: 'CZK' },

  // INR - Indian Rupee
  { pattern: /индийских/i, currency: 'INR' },
  { pattern: /inr/i, currency: 'INR' },
  { pattern: /₹/i, currency: 'INR' },

  // SGD - Singapore Dollar
  { pattern: /сингапурских/i, currency: 'SGD' },
  { pattern: /sgd/i, currency: 'SGD' },

  // ARS - Argentine Peso
  { pattern: /песо/i, currency: 'ARS' },
  { pattern: /ars/i, currency: 'ARS' },

  // BRL - Brazilian Real
  { pattern: /реал(?:ов|а)?/i, currency: 'BRL' },
  { pattern: /brl/i, currency: 'BRL' },
  { pattern: /R\$/i, currency: 'BRL' },
];

/**
 * Extract currency from text
 * Returns { currency, cleanedText } or null
 */
export function extractCurrency(text: string): { currency: string; cleanedText: string } | null {
  for (const { pattern, currency } of CURRENCY_PATTERNS) {
    if (pattern.test(text)) {
      return {
        currency,
        cleanedText: text.replace(pattern, ' '),
      };
    }
  }
  return null;
}

/**
 * Guess currency by amount (context-based)
 * Large amounts are likely RUB, IDR, KRW
 */
export function guessCurrencyByAmount(amount: number, text: string): string | null {
  if (amount >= 100000) {
    if (/индонези|бали|джакарта|рупи/i.test(text)) return 'IDR';
    if (/коре|сеул|вон/i.test(text)) return 'KRW';
    return 'RUB'; // Default for Russian context
  }
  if (amount >= 10000) {
    return 'RUB';
  }
  return null; // Ambiguous
}

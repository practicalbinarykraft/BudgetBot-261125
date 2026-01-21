/**
 * Transaction Text Parser
 *
 * Main module that orchestrates parsing.
 * Combines all submodules for complete text analysis.
 *
 * Examples:
 * - "шашлык 500 руб" → { amount: 500, currency: "RUB", description: "шашлык" }
 * - "coffee $5" → { amount: 5, currency: "USD", description: "coffee" }
 * - "триста рублей на кофе" → { amount: 300, currency: "RUB", description: "кофе" }
 */

import { ParsedTransaction } from './types';
import { findWordNumber } from './number-words';
import { extractCurrency, guessCurrencyByAmount } from './currencies';
import { findCategory } from './categories';
import { parseDate } from './dates';
import { findCategoryFuzzy } from './fuzzy';

// Re-export types
export type { ParsedTransaction } from './types';

// Income keywords
const INCOME_KEYWORDS = /получил[аи]?|зарплат[ау]|доход|премия|бонус|вернули|income|salary|received|earned|bonus|refund|кэшбэк|кешбек|cashback|возврат|скинули|зачислили|пришло|поступило/i;

/**
 * Extract numeric amount from text
 */
function extractAmount(text: string): { amount: number; cleanedText: string } | null {
  let workingText = text;

  // Remove percentages (not amounts)
  workingText = workingText.replace(/\d+\s*%/g, ' ');

  // Range: "от 500 до 1000" - take first number
  const rangeMatch = workingText.match(/от\s+(\d[\d\s,.]*)\s+до\s+(\d[\d\s,.]*)/i);
  if (rangeMatch) {
    const num = parseFloat(rangeMatch[1].replace(/\s/g, '').replace(',', '.'));
    return { amount: num, cleanedText: workingText.replace(rangeMatch[0], ' ') };
  }

  // Multiple amounts with "+" or "и/and"
  const multiPattern = /(\d[\d\s,.]*)\s*(?:\+|плюс|и|and)\s*(\d[\d\s,.]*)/gi;
  let multiMatch;
  let totalSum = 0;
  let hasMulti = false;
  let searchText = workingText;

  while ((multiMatch = multiPattern.exec(searchText)) !== null) {
    const n1 = parseFloat(multiMatch[1].replace(/\s/g, '').replace(',', '.'));
    const n2 = parseFloat(multiMatch[2].replace(/\s/g, '').replace(',', '.'));
    if (!isNaN(n1) && !isNaN(n2)) {
      totalSum = hasMulti ? totalSum + n2 : n1 + n2;
      hasMulti = true;
      workingText = workingText.replace(multiMatch[0], ' ');
    }
  }
  if (hasMulti && totalSum > 0) {
    return { amount: totalSum, cleanedText: workingText };
  }

  // Multiplier suffixes: 5к, 5тыс, 5m
  const multipliers = [
    { pattern: /(\d+(?:[.,]\d+)?)\s*(?:к|k)\b/gi, mult: 1000 },
    { pattern: /(\d+(?:[.,]\d+)?)\s*(?:тыс|тыщ)/gi, mult: 1000 },
    { pattern: /(\d+(?:[.,]\d+)?)\s*(?:млн|m|мл)\b/gi, mult: 1e6 },
    { pattern: /(\d+(?:[.,]\d+)?)\s*(?:млрд|b)\b/gi, mult: 1e9 },
  ];

  for (const { pattern, mult } of multipliers) {
    const match = workingText.match(pattern);
    if (match) {
      const numMatch = match[0].match(/(\d+(?:[.,]\d+)?)/);
      if (numMatch) {
        const amount = parseFloat(numMatch[1].replace(',', '.')) * mult;
        return { amount, cleanedText: workingText.replace(match[0], ' ') };
      }
    }
  }

  // Standard numeric patterns
  const patterns = [
    /(\d{1,3}(?:[\s,]\d{3})+)(?:[.,]\d{1,2})?/g,  // 5 000 or 5,000
    /(\d+)[.,](\d{1,2})(?!\d)/g,                    // 5.00 or 5,50
    /(\d+)/g,                                        // Simple number
  ];

  for (const pattern of patterns) {
    const matches = workingText.match(pattern);
    if (matches?.length) {
      let str = matches[0].replace(/\s/g, '').replace(',', '.');
      const parsed = parseFloat(str);
      if (!isNaN(parsed) && parsed > 0) {
        return { amount: parsed, cleanedText: workingText.replace(matches[0], ' ') };
      }
    }
  }

  // Word numbers: "триста", "five hundred"
  const wordNum = findWordNumber(workingText);
  if (wordNum && wordNum.value > 0) {
    const before = workingText.substring(0, wordNum.startIndex);
    const after = workingText.substring(wordNum.startIndex + wordNum.matchedText.length);
    return { amount: wordNum.value, cleanedText: before + ' ' + after };
  }

  return null;
}

/**
 * Clean up description text
 */
function cleanDescription(text: string, original: string): string {
  let desc = text
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[,.\s]+|[,.\s]+$/g, '')
    .replace(/\b(на|за|в|для|от)\s*$/i, '');

  if (!desc) desc = original;
  if (desc.length > 0) {
    desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  }
  return desc;
}

/**
 * Parse transaction text
 */
export function parseTransactionText(text: string): ParsedTransaction {
  const original = text.trim();
  let working = original;

  let amount: number | null = null;
  let currency: string | null = null;
  let type: 'income' | 'expense' = 'expense';
  let category: string | null = null;
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let date: string | null = null;

  // 1. Detect income/expense
  if (INCOME_KEYWORDS.test(working)) type = 'income';

  // 2. Extract date
  const parsedDate = parseDate(working);
  if (parsedDate) {
    date = parsedDate.date;
    working = working.replace(new RegExp(parsedDate.matchedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), ' ');
  }

  // 3. Extract currency
  const currencyResult = extractCurrency(working);
  if (currencyResult) {
    currency = currencyResult.currency;
    working = currencyResult.cleanedText;
  }

  // 4. Extract amount
  const amountResult = extractAmount(working);
  if (amountResult) {
    amount = amountResult.amount;
    working = amountResult.cleanedText;
  }

  // 5. Clean description
  const description = cleanDescription(working, original);

  // 6. Detect category (exact match)
  category = findCategory(original);

  // 7. Fuzzy matching fallback
  if (!category) category = findCategoryFuzzy(original);

  // 8. Guess currency by amount
  if (amount && !currency) {
    currency = guessCurrencyByAmount(amount, original);
  }

  // 9. Calculate confidence
  if (amount && amount > 0) {
    if (currency && category) confidence = 'high';
    else if (currency || category) confidence = 'medium';
    else confidence = 'medium';
  }

  return { amount, currency, description, type, category, confidence, date };
}

/**
 * Check if parsing was successful (has amount)
 */
export function isParseSuccessful(parsed: ParsedTransaction): boolean {
  return parsed.amount !== null && parsed.amount > 0;
}

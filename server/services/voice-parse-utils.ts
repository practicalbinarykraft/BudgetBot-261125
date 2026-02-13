/**
 * Deterministic utilities for voice transcription parsing.
 * These run BEFORE/AFTER the LLM and override its output when confident.
 */

interface CurrencyPattern {
  code: string;
  patterns: RegExp[];
}

const CURRENCY_RULES: CurrencyPattern[] = [
  { code: 'RUB', patterns: [/рубл/i, /руб\.?(?:\s|$)/i, /₽/] },
  { code: 'USD', patterns: [/доллар/i, /бакс/i, /\$/] },
  { code: 'EUR', patterns: [/евро/i, /€/] },
  { code: 'IDR', patterns: [/рупи[йя]/i, /\bidr\b/i, /\brp\.?\s/i, /\bribu\b/i] },
  { code: 'KRW', patterns: [/вон(?:\s|$|а|ов)/i, /₩/, /\bkrw\b/i] },
  { code: 'CNY', patterns: [/юан/i, /¥/, /\bcny\b/i] },
];

/**
 * Detect currency from transcription text using regex rules.
 * Returns currency code or null if nothing found.
 */
export function detectCurrencyFromText(text: string): string | null {
  for (const rule of CURRENCY_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        return rule.code;
      }
    }
  }
  return null;
}

/**
 * Extract amount from text using regex.
 * Handles: "500", "1 000", "50.5", "1,500", etc.
 */
export function extractAmountFromText(text: string): number | null {
  // Match number patterns: "500", "1 000", "50.5", "1,500.00"
  const match = text.match(/(\d[\d\s.,]*\d|\d+)/);
  if (!match) return null;
  const cleaned = match[1].replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Clean description by removing amount, currency words, and extra whitespace.
 * "Шашлык 500 рублей" → "Шашлык"
 * "coffee 5 dollars" → "coffee"
 */
export function cleanDescription(text: string): string {
  let cleaned = text;
  // Remove numbers (with optional spaces/dots/commas inside)
  cleaned = cleaned.replace(/\d[\d\s.,]*\d|\d+/g, '');
  // Remove currency words
  cleaned = cleaned.replace(/рубл\S*/gi, '');
  cleaned = cleaned.replace(/руб\.?/gi, '');
  cleaned = cleaned.replace(/доллар\S*/gi, '');
  cleaned = cleaned.replace(/dollars?/gi, '');
  cleaned = cleaned.replace(/бакс\S*/gi, '');
  cleaned = cleaned.replace(/евро/gi, '');
  cleaned = cleaned.replace(/рупи\S*/gi, '');
  cleaned = cleaned.replace(/юан\S*/gi, '');
  cleaned = cleaned.replace(/вон\S*/gi, '');
  cleaned = cleaned.replace(/ribu/gi, '');
  cleaned = cleaned.replace(/[₽$€¥₩]/g, '');
  cleaned = cleaned.replace(/\b(usd|eur|idr|rub|krw|cny|rp)\b/gi, '');
  // Remove "за" preposition (Cyrillic \b doesn't work, use lookaround with spaces/edges)
  cleaned = cleaned.replace(/(?:^|\s)за(?:\s|$)/gi, ' ');
  // Collapse whitespace and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

/**
 * Detect transaction type from text keywords.
 */
export function detectTypeFromText(text: string): 'income' | 'expense' {
  const incomeKeywords = /получил|зарплата|доход|income|salary|received|earned|перевод от|пришли|начислен/i;
  return incomeKeywords.test(text) ? 'income' : 'expense';
}

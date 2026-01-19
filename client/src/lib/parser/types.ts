/**
 * Types for Transaction Parser
 *
 * Single file with all interfaces used across parser modules.
 */

/**
 * Result of parsing transaction text
 */
export interface ParsedTransaction {
  amount: number | null;
  currency: string | null;
  description: string;
  type: 'income' | 'expense';
  category: string | null;
  confidence: 'high' | 'medium' | 'low';
  date: string | null; // ISO date string (YYYY-MM-DD) or null
}

/**
 * Pattern for matching currency in text
 */
export interface CurrencyPattern {
  pattern: RegExp;
  currency: string;
}

/**
 * Pattern for matching category in text
 */
export interface CategoryPattern {
  pattern: RegExp;
  category: string;
}

/**
 * Keyword for fuzzy matching
 */
export interface FuzzyKeyword {
  word: string;
  category: string;
}

/**
 * Result of parsing word number
 */
export interface WordNumberResult {
  value: number;
  matchedText: string;
}

/**
 * Result of finding word number with position
 */
export interface WordNumberMatch extends WordNumberResult {
  startIndex: number;
}

/**
 * Result of parsing date
 */
export interface DateParseResult {
  date: string; // ISO format
  matchedText: string;
}

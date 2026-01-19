/**
 * Fuzzy Matching
 *
 * Finds categories even with typos.
 * Uses Levenshtein distance algorithm.
 */

import { FuzzyKeyword } from './types';

// Keywords for fuzzy matching (most common words)
const FUZZY_KEYWORDS: FuzzyKeyword[] = [
  // Food & Dining
  { word: 'кофе', category: 'Food & Dining' },
  { word: 'кафе', category: 'Food & Dining' },
  { word: 'обед', category: 'Food & Dining' },
  { word: 'ужин', category: 'Food & Dining' },
  { word: 'завтрак', category: 'Food & Dining' },
  { word: 'ресторан', category: 'Food & Dining' },
  { word: 'пицца', category: 'Food & Dining' },
  { word: 'бургер', category: 'Food & Dining' },
  { word: 'шашлык', category: 'Food & Dining' },
  { word: 'шаурма', category: 'Food & Dining' },
  { word: 'суши', category: 'Food & Dining' },
  { word: 'макдональдс', category: 'Food & Dining' },
  { word: 'старбакс', category: 'Food & Dining' },

  // Transport
  { word: 'такси', category: 'Transport' },
  { word: 'метро', category: 'Transport' },
  { word: 'автобус', category: 'Transport' },
  { word: 'бензин', category: 'Transport' },
  { word: 'заправка', category: 'Transport' },
  { word: 'парковка', category: 'Transport' },
  { word: 'каршеринг', category: 'Transport' },
  { word: 'самокат', category: 'Transport' },

  // Groceries
  { word: 'продукты', category: 'Groceries' },
  { word: 'магазин', category: 'Groceries' },
  { word: 'пятёрочка', category: 'Groceries' },
  { word: 'пятерочка', category: 'Groceries' },
  { word: 'магнит', category: 'Groceries' },
  { word: 'перекрёсток', category: 'Groceries' },
  { word: 'перекресток', category: 'Groceries' },
  { word: 'вкусвилл', category: 'Groceries' },

  // Entertainment
  { word: 'кино', category: 'Entertainment' },
  { word: 'фильм', category: 'Entertainment' },
  { word: 'концерт', category: 'Entertainment' },
  { word: 'театр', category: 'Entertainment' },
  { word: 'нетфликс', category: 'Entertainment' },
  { word: 'спотифай', category: 'Entertainment' },

  // Shopping
  { word: 'одежда', category: 'Shopping' },
  { word: 'обувь', category: 'Shopping' },
  { word: 'вайлдберриз', category: 'Shopping' },
  { word: 'озон', category: 'Shopping' },

  // Health
  { word: 'аптека', category: 'Health' },
  { word: 'лекарства', category: 'Health' },
  { word: 'врач', category: 'Health' },
  { word: 'стоматолог', category: 'Health' },
  { word: 'фитнес', category: 'Health' },
  { word: 'спортзал', category: 'Health' },

  // Bills
  { word: 'интернет', category: 'Bills & Utilities' },
  { word: 'телефон', category: 'Bills & Utilities' },
  { word: 'аренда', category: 'Bills & Utilities' },
  { word: 'коммуналка', category: 'Bills & Utilities' },
];

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // replace
          matrix[i][j - 1] + 1,     // insert
          matrix[i - 1][j] + 1      // delete
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if word is similar to target (with typos allowed)
 */
function isSimilar(word: string, target: string, threshold = 2): boolean {
  // Short words - exact match only
  if (target.length <= 3) {
    return word.toLowerCase() === target.toLowerCase();
  }

  const distance = levenshtein(word.toLowerCase(), target.toLowerCase());
  const maxDistance = Math.min(threshold, Math.floor(target.length / 3));

  return distance <= maxDistance;
}

/**
 * Find category using fuzzy matching
 */
export function findCategoryFuzzy(text: string): string | null {
  const words = text.toLowerCase().split(/\s+/);

  for (const word of words) {
    if (word.length < 3) continue;

    for (const { word: keyword, category } of FUZZY_KEYWORDS) {
      if (isSimilar(word, keyword)) {
        return category;
      }
    }
  }

  return null;
}

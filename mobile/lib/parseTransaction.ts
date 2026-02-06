/**
 * Local parser for voice-recognized text → transaction fields.
 *
 * Parses natural language like:
 *   "spent 15 dollars on lunch"
 *   "потратил 500 на такси"
 *   "earned 3000 salary"
 *   "received 200 from client"
 *   "coffee 4.50"
 *   "lunch 12"
 *
 * No server needed — runs entirely on-device.
 */

export interface ParsedVoiceTransaction {
  amount: string | null;
  description: string;
  type: 'income' | 'expense';
}

// Keywords indicating expense
const EXPENSE_KEYWORDS = [
  // English
  'spent', 'paid', 'bought', 'cost', 'purchase', 'expense',
  'pay', 'spend', 'buy', 'shopping',
  // Russian
  'потратил', 'потратила', 'заплатил', 'заплатила', 'купил', 'купила',
  'оплатил', 'оплатила', 'расход', 'трата',
];

// Keywords indicating income
const INCOME_KEYWORDS = [
  // English
  'earned', 'received', 'got', 'income', 'salary', 'wage',
  'earn', 'receive', 'refund', 'payment received',
  // Russian
  'получил', 'получила', 'заработал', 'заработала', 'зарплата',
  'доход', 'возврат', 'перевод',
];

// Prepositions / connector words to strip from the description
const NOISE_WORDS = [
  'on', 'for', 'at', 'the', 'a', 'an', 'to', 'of', 'my',
  'на', 'за', 'в', 'для', 'по', 'к', 'из',
  'dollars', 'dollar', 'bucks', 'рублей', 'рубля', 'рубль',
];

/**
 * Parse a raw voice transcript into transaction fields.
 * Strategy:
 *   1. Find the first number → that's the amount
 *   2. Check type keywords before the number → income or expense
 *   3. Everything else (after number, cleaned up) → description
 *   4. Default to expense if ambiguous
 */
export function parseTransactionFromText(raw: string): ParsedVoiceTransaction {
  const text = raw.trim();
  if (!text) {
    return { amount: null, description: '', type: 'expense' };
  }

  // 1. Extract amount — match numbers like 15, 4.50, 1500, 1,200.50
  const amountMatch = text.match(
    /(?:^|\s)\$?([\d]{1,3}(?:[,\s]?\d{3})*(?:\.\d{1,2})?)/,
  );
  let amount: string | null = null;
  let amountIndex = -1;
  let amountLength = 0;

  if (amountMatch && amountMatch[1]) {
    amount = amountMatch[1].replace(/[,\s]/g, '');
    amountIndex = amountMatch.index ?? 0;
    amountLength = amountMatch[0].length;
  }

  // 2. Determine type from keywords
  const lowerText = text.toLowerCase();
  let type: 'income' | 'expense' = 'expense'; // default

  for (const kw of INCOME_KEYWORDS) {
    if (lowerText.includes(kw)) {
      type = 'income';
      break;
    }
  }
  // Expense keywords override income only if income wasn't found first
  if (type === 'expense') {
    for (const kw of EXPENSE_KEYWORDS) {
      if (lowerText.includes(kw)) {
        type = 'expense';
        break;
      }
    }
  }

  // 3. Build description from remaining text
  let description = text;

  // Remove amount from the string
  if (amountIndex >= 0) {
    description =
      text.slice(0, amountIndex) + text.slice(amountIndex + amountLength);
  }

  // Remove $ sign
  description = description.replace(/\$/g, '');

  // Remove type keywords
  const allKeywords = [...EXPENSE_KEYWORDS, ...INCOME_KEYWORDS];
  for (const kw of allKeywords) {
    const re = new RegExp(`\\b${kw}\\b`, 'gi');
    description = description.replace(re, '');
  }

  // Remove noise words at the start
  const words = description.split(/\s+/).filter(Boolean);
  const cleaned: string[] = [];
  let started = false;
  for (const word of words) {
    if (!started && NOISE_WORDS.includes(word.toLowerCase())) {
      continue; // skip leading noise
    }
    started = true;
    cleaned.push(word);
  }

  // Also remove trailing noise
  while (
    cleaned.length > 0 &&
    NOISE_WORDS.includes(cleaned[cleaned.length - 1].toLowerCase())
  ) {
    cleaned.pop();
  }

  description = cleaned.join(' ').trim();

  // Capitalize first letter
  if (description.length > 0) {
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  return { amount, description, type };
}

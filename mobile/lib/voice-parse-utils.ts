/**
 * Client-side deterministic parsing for voice transcriptions.
 * Overrides server response when regex finds currency/amount in text.
 * Works instantly — no server deploy needed.
 */

interface CurrencyPattern {
  code: string;
  patterns: RegExp[];
}

const CURRENCY_RULES: CurrencyPattern[] = [
  { code: 'RUB', patterns: [/рубл/i, /руб\.?(?:\s|$)/i, /₽/] },
  { code: 'USD', patterns: [/доллар/i, /бакс/i, /dollars?/i, /\$/] },
  { code: 'EUR', patterns: [/евро/i, /€/] },
  { code: 'IDR', patterns: [/рупи[йя]/i, /\bidr\b/i, /\brp\.?\s/i, /\bribu\b/i] },
  { code: 'KRW', patterns: [/вон(?:\s|$|а|ов)/i, /₩/, /\bkrw\b/i] },
  { code: 'CNY', patterns: [/юан/i, /¥/, /\bcny\b/i] },
];

export function detectCurrency(text: string): string | null {
  for (const rule of CURRENCY_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) return rule.code;
    }
  }
  return null;
}

export function extractAmount(text: string): string | null {
  const match = text.match(/(\d[\d\s.,]*\d|\d+)/);
  if (!match) return null;
  return match[1].replace(/\s/g, '').replace(',', '.');
}

export function cleanDescription(text: string): string {
  let s = text;
  s = s.replace(/\d[\d\s.,]*\d|\d+/g, '');
  s = s.replace(/рубл\S*/gi, '');
  s = s.replace(/руб\.?/gi, '');
  s = s.replace(/доллар\S*/gi, '');
  s = s.replace(/dollars?/gi, '');
  s = s.replace(/бакс\S*/gi, '');
  s = s.replace(/евро/gi, '');
  s = s.replace(/рупи\S*/gi, '');
  s = s.replace(/юан\S*/gi, '');
  s = s.replace(/вон\S*/gi, '');
  s = s.replace(/ribu/gi, '');
  s = s.replace(/[₽$€¥₩]/g, '');
  s = s.replace(/\b(usd|eur|idr|rub|krw|cny|rp)\b/gi, '');
  s = s.replace(/(?:^|\s)за(?:\s|$)/gi, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * Fix server response using client-side regex.
 * Overrides currency, amount, description when regex is confident.
 */
export function fixVoiceParsedResult(serverParsed: {
  amount: string;
  currency: string;
  description: string;
  category?: string;
  type: 'income' | 'expense';
}, transcription: string): {
  amount: string;
  currency: string;
  description: string;
  category?: string;
  type: 'income' | 'expense';
} {
  const currency = detectCurrency(transcription) || serverParsed.currency;
  const amount = extractAmount(transcription) || serverParsed.amount;
  const cleaned = cleanDescription(transcription);
  const description = cleaned || serverParsed.description;

  // Detect income
  const incomeRe = /получил|зарплата|доход|income|salary|received|earned/i;
  const type = incomeRe.test(transcription) ? 'income' : serverParsed.type;

  // Client-side category detection by keywords (fallback when server returns nothing)
  const category = serverParsed.category || detectCategory(transcription);

  return { amount, currency, description, category, type };
}

/**
 * Keyword-based category detector.
 * Maps common Russian/English words to category names that match user's categories.
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Food & Drinks': [
    'еда', 'еду', 'обед', 'ужин', 'завтрак', 'кофе', 'чай', 'пицца', 'суши',
    'шашлык', 'шаурм', 'бургер', 'хлеб', 'молок', 'мяс', 'рыб', 'фрукт',
    'овощ', 'продукт', 'магазин', 'супермаркет', 'пиво', 'вино', 'вод',
    'сок', 'десерт', 'торт', 'мороженое', 'снек', 'перекус', 'ланч',
    'food', 'coffee', 'lunch', 'dinner', 'breakfast', 'pizza', 'grocery',
    'groceries', 'snack', 'drink', 'beer', 'wine', 'tea', 'meal',
    'nasi', 'goreng', 'mie', 'bakso', 'sate', 'доставк', 'delivery',
    'ресторан', 'кафе', 'столов', 'бар', 'restaurant', 'cafe',
  ],
  'Transport': [
    'такси', 'uber', 'яндекс', 'метро', 'автобус', 'трамвай', 'поезд',
    'электричк', 'бензин', 'заправк', 'парковк', 'каршеринг', 'самокат',
    'taxi', 'bus', 'train', 'metro', 'fuel', 'gas', 'parking', 'grab',
    'gojek', 'bolt',
  ],
  'Entertainment': [
    'кино', 'фильм', 'театр', 'концерт', 'игр', 'подписк', 'netflix',
    'spotify', 'youtube', 'cinema', 'movie', 'game', 'subscription',
    'развлечен', 'entertainment',
  ],
  'Health': [
    'аптек', 'лекарств', 'врач', 'доктор', 'клиник', 'больниц', 'стоматолог',
    'зуб', 'анализ', 'pharmacy', 'doctor', 'medicine', 'hospital', 'health',
  ],
  'Shopping': [
    'одежд', 'обувь', 'футболк', 'джинс', 'куртк', 'платье', 'костюм',
    'сумк', 'рюкзак', 'clothes', 'shoes', 'shirt', 'pants', 'shopping',
  ],
  'Housing': [
    'аренд', 'квартир', 'квартплат', 'коммуналк', 'электричеств', 'интернет',
    'связь', 'телефон', 'rent', 'utilities', 'electricity', 'internet', 'wifi',
  ],
};

export function detectCategory(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return category;
    }
  }
  return undefined;
}

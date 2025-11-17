import { CATEGORY_KEYWORDS, DEFAULT_CATEGORY_EXPENSE } from './config';
import type { ParsedReceiptItem } from '../services/ocr/receipt-parser.service';

export interface ParsedTransaction {
  amount: number;
  currency: 'USD' | 'RUB' | 'IDR';
  description: string;
  category: string;
  type: 'expense' | 'income';
  items?: ParsedReceiptItem[];  // Receipt items from OCR
}

const CURRENCY_SYMBOLS: Record<string, 'USD' | 'RUB' | 'IDR'> = {
  '$': 'USD',
  '₽': 'RUB',
  'руб': 'RUB',
  'rub': 'RUB',
  '₹': 'IDR',
  'idr': 'IDR',
  'rp': 'IDR',
};

const INCOME_KEYWORDS = [
  'зарплата', 'salary', 'доход', 'income', 'получил', 'received',
  'заработал', 'earned', 'фриланс', 'freelance', 'bonus', 'бонус',
  'возврат', 'refund', '+', 'плюс'
];

export function parseTransactionText(text: string): ParsedTransaction | null {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const cleaned = text.trim().toLowerCase();
  
  let amount: number | null = null;
  let currency: 'USD' | 'RUB' | 'IDR' = 'USD';
  let description = '';

  const amountMatch = cleaned.match(/(\d+(?:[.,]\d+)?)\s*([₽₹$]|руб|rub|idr|rp)?/);
  
  if (!amountMatch) {
    return null;
  }

  const amountStr = amountMatch[1].replace(',', '.');
  amount = parseFloat(amountStr);

  if (isNaN(amount) || amount <= 0) {
    return null;
  }

  const currencySymbol = amountMatch[2];
  if (currencySymbol && CURRENCY_SYMBOLS[currencySymbol]) {
    currency = CURRENCY_SYMBOLS[currencySymbol];
  } else if (cleaned.includes('₽') || cleaned.includes('руб')) {
    currency = 'RUB';
  } else if (cleaned.includes('₹') || cleaned.includes('idr') || cleaned.includes('rp')) {
    currency = 'IDR';
  }

  description = cleaned
    .replace(amountMatch[0], '')
    .replace(/[₽₹$]/g, '')
    .replace(/\b(руб|rub|idr|rp)\b/g, '')
    .trim();

  if (!description) {
    description = 'expense';
  }

  const isIncome = INCOME_KEYWORDS.some(keyword => description.includes(keyword));
  const type: 'expense' | 'income' = isIncome ? 'income' : 'expense';

  const category = detectCategory(description, type);

  return {
    amount,
    currency,
    description: description.charAt(0).toUpperCase() + description.slice(1),
    category,
    type
  };
}

function detectCategory(description: string, type: 'expense' | 'income'): string {
  const lowerDesc = description.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return type === 'income' ? 'Salary' : DEFAULT_CATEGORY_EXPENSE;
}

export function formatCurrency(amount: number, currency: 'USD' | 'RUB' | 'IDR'): string {
  const symbols: Record<string, string> = {
    USD: '$',
    RUB: '₽',
    IDR: '₹'
  };

  return `${symbols[currency]}${amount.toFixed(2)}`;
}

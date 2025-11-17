import Anthropic from '@anthropic-ai/sdk';
import { ParsedTransaction } from './parser';
import { DEFAULT_CATEGORY_EXPENSE, CATEGORY_KEYWORDS } from './config';
import { storage } from '../storage';
import { parseReceiptWithItems } from '../services/ocr/receipt-parser.service';
import type { ParsedReceiptItem } from '../services/ocr/receipt-parser.service';

export interface ReceiptData {
  amount: number;
  currency: 'USD' | 'RUB' | 'IDR';
  merchantName?: string;
  description?: string;
  date?: string;
  items?: ParsedReceiptItem[];
}

/**
 * Распознать чек через Claude Vision API (BYOK - использует API ключ пользователя)
 * Теперь с извлечением товаров!
 * 
 * @param userId - ID пользователя (для загрузки API ключа из Settings)
 * @param imageBase64 - Изображение чека в base64
 * @param mimeType - MIME тип изображения
 * @returns Распознанные данные с товарами или null
 */
export async function processReceiptImage(
  userId: number,
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<(ParsedTransaction & { items?: ParsedReceiptItem[] }) | null> {
  try {
    console.log('1️⃣ Starting OCR process for user:', userId);
    
    // 1. Загрузить настройки пользователя
    const settings = await storage.getSettingsByUserId(userId);
    const apiKey = settings?.anthropicApiKey;

    if (!apiKey) {
      console.error('❌ OCR failed: User has no Anthropic API key in Settings');
      return null;
    }
    console.log('2️⃣ API key found ✅');
    console.log('3️⃣ Image size:', imageBase64.length, 'bytes');

    // 2. Использовать новый сервис с извлечением товаров
    console.log('4️⃣ Calling parseReceiptWithItems...');
    const validMimeType = mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
    const parsedReceipt = await parseReceiptWithItems(imageBase64, apiKey, validMimeType);

    if (!parsedReceipt) {
      console.error('❌ Failed to parse receipt with items');
      return null;
    }

    console.log('5️⃣ Parsed result:', {
      merchant: parsedReceipt.merchant,
      total: parsedReceipt.total,
      itemsCount: parsedReceipt.items?.length || 0,
      date: parsedReceipt.date
    });

    // 3. Конвертировать валюту (если нужно)
    const currency = mapCurrency(parsedReceipt.merchant);
    console.log('6️⃣ Currency detected:', currency);

    // 4. Определить категорию
    const category = detectCategory(parsedReceipt.merchant);
    console.log('7️⃣ Category detected:', category);

    // 5. Вернуть результат с товарами
    const result = {
      amount: parsedReceipt.total,
      currency,
      description: parsedReceipt.merchant,
      category,
      type: 'expense' as const,
      items: parsedReceipt.items || []
    };
    
    console.log('✅ OCR completed successfully!');
    return result;

  } catch (error) {
    console.error('❌ OCR Error Details:', {
      userId,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      imageSize: imageBase64.length
    });
    return null;
  }
}

/**
 * Определить валюту по названию магазина (по умолчанию IDR для Индонезии)
 */
function mapCurrency(merchantName: string): 'USD' | 'RUB' | 'IDR' {
  const lower = merchantName.toLowerCase();
  
  // Индонезийские магазины
  if (lower.includes('pepito') || lower.includes('indomaret') || lower.includes('alfamart')) {
    return 'IDR';
  }
  
  // По умолчанию IDR (т.к. пользователь в Индонезии)
  return 'IDR';
}

/**
 * Промпт для Claude
 */
function buildOCRPrompt(): string {
  return `Extract receipt information and return JSON:

{
  "amount": 295008,
  "currency": "IDR",
  "merchantName": "PEPITO MARKET",
  "description": "groceries"
}

Rules:
- amount: total after tax (number only, no commas)
- currency: IDR for "Rp", USD for "$", RUB for "₽"
- merchantName: store name from top of receipt
- description: type of purchase (groceries/coffee/dinner)

Return ONLY JSON, no markdown.`;
}

/**
 * Распарсить JSON из ответа Claude
 */
function parseReceiptJSON(text: string): ReceiptData | null {
  try {
    // Удалить markdown если есть
    const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
    
    // Найти JSON
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error('No JSON found in response');
      return null;
    }

    // Распарсить
    const data = JSON.parse(match[0]);

    // Валидация amount
    if (!data.amount || data.amount <= 0) {
      console.error('Invalid amount:', data.amount);
      return null;
    }

    // Валидация и нормализация currency
    const validCurrencies: Array<'USD' | 'RUB' | 'IDR'> = ['USD', 'RUB', 'IDR'];
    const currency = data.currency?.toUpperCase();
    if (!currency || !validCurrencies.includes(currency as any)) {
      console.warn('Invalid or missing currency, defaulting to USD');
      data.currency = 'USD';
    } else {
      data.currency = currency;
    }

    return data;
  } catch (error) {
    console.error('JSON parse error:', error);
    return null;
  }
}

/**
 * Определить категорию по названию магазина
 */
function detectCategory(text?: string): string {
  if (!text) return DEFAULT_CATEGORY_EXPENSE;

  const lower = text.toLowerCase();

  // Известные магазины (используем категории из CATEGORY_KEYWORDS)
  const stores: Record<string, string> = {
    'pepito': 'Food & Drinks',
    'indomaret': 'Food & Drinks',
    'alfamart': 'Food & Drinks',
    'starbucks': 'Food & Drinks',
    'kfc': 'Food & Drinks',
    'mcdonald': 'Food & Drinks',
    'grab': 'Transport',
    'gojek': 'Transport',
    'tokopedia': 'Shopping',
    'shopee': 'Shopping',
  };

  // Проверить известные магазины
  for (const [name, category] of Object.entries(stores)) {
    if (lower.includes(name)) {
      return category;
    }
  }

  // Проверить по ключевым словам
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return DEFAULT_CATEGORY_EXPENSE;
}

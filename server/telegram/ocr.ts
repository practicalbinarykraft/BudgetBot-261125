import Anthropic from '@anthropic-ai/sdk';
import { ParsedTransaction } from './parser';
import { DEFAULT_CATEGORY_EXPENSE, CATEGORY_KEYWORDS } from './config';
import { storage } from '../storage';

export interface ReceiptData {
  amount: number;
  currency: 'USD' | 'RUB' | 'IDR';
  merchantName?: string;
  description?: string;
  date?: string;
}

/**
 * Распознать чек через Claude Vision API (BYOK - использует API ключ пользователя)
 * 
 * @param userId - ID пользователя (для загрузки API ключа из Settings)
 * @param imageBase64 - Изображение чека в base64
 * @param mimeType - MIME тип изображения
 * @returns Распознанные данные или null
 */
export async function processReceiptImage(
  userId: number,
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<ParsedTransaction | null> {
  try {
    // 1. Загрузить настройки пользователя
    const settings = await storage.getSettingsByUserId(userId);
    const apiKey = settings?.anthropicApiKey;

    if (!apiKey) {
      console.error('OCR failed: User has no Anthropic API key in Settings');
      return null;
    }

    // 2. Создать Anthropic client с пользовательским ключом
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // 3. Отправить изображение в Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as any,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: buildOCRPrompt(),
            },
          ],
        },
      ],
    });

    // 4. Получить текст ответа
    const content = response.content[0];
    if (content.type !== 'text') {
      return null;
    }

    // 5. Распарсить JSON
    const receiptData = parseReceiptJSON(content.text);
    if (!receiptData) {
      return null;
    }

    // 6. Определить категорию
    const category = detectCategory(receiptData.merchantName || receiptData.description);

    // 7. Вернуть результат
    return {
      amount: receiptData.amount,
      currency: receiptData.currency,
      description: receiptData.merchantName || receiptData.description || 'Receipt',
      category,
      type: 'expense',
    };

  } catch (error) {
    console.error('OCR error:', error);
    return null;
  }
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

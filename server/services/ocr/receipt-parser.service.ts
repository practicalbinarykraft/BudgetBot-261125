import Anthropic from '@anthropic-ai/sdk';

/**
 * Сервис для парсинга чеков с извлечением списка товаров
 * 
 * Ответственность:
 * - OCR чеков через Claude API
 * - Извлечение структурированных данных (товары, цены, магазин)
 * - Нормализация названий товаров для сравнения
 * 
 * Junior-friendly: <150 строк, понятная логика
 */

export interface ParsedReceiptItem {
  name: string;
  normalizedName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface ParsedReceipt {
  total: number;
  merchant: string;
  date: string;
  items: ParsedReceiptItem[];
}

/**
 * Нормализовать название товара для сравнения цен
 * 
 * Пример:
 * "Orange Juice 1L" → "orange juice"
 * "Молоко 2.5%" → "молоко"
 */
function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[0-9]+\s*(ml|l|kg|g|pcs|шт|л|кг|г)/gi, '') // убрать размеры/объемы
    .replace(/[^a-zа-яё\s]/g, '') // только буквы и пробелы
    .replace(/\s+/g, ' ') // множественные пробелы в один
    .trim();
}

/**
 * Парсить чек с извлечением товаров через Claude API
 * 
 * @param imageBase64 - Base64 строка изображения чека (без префикса data:image/...)
 * @param apiKey - Anthropic API ключ пользователя
 * @param mimeType - MIME тип изображения (image/jpeg, image/png, image/webp, image/gif)
 * @returns Структурированные данные чека с нормализованными товарами
 * @throws Error если Claude не смог распарсить чек или вернул невалидный JSON
 */
export async function parseReceiptWithItems(
  imageBase64: string,
  apiKey: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
): Promise<ParsedReceipt> {
  
  const anthropic = new Anthropic({ apiKey });
  
  const prompt = `
Parse this receipt image and extract structured data.

Return ONLY valid JSON in this exact format (no explanations, no markdown):
{
  "total": 180000,
  "merchant": "Moris Grocier",
  "date": "2025-11-17",
  "items": [
    {
      "name": "Orange Juice 1L",
      "quantity": 2,
      "pricePerUnit": 32000,
      "totalPrice": 64000
    },
    {
      "name": "Bread White",
      "quantity": 1,
      "pricePerUnit": 25000,
      "totalPrice": 25000
    }
  ]
}

Required fields:
1. total - final receipt total (number)
2. merchant - store/merchant name (string)
3. date - purchase date in YYYY-MM-DD format (string)
4. items - array of purchased items with:
   - name: item description from receipt (string)
   - quantity: number of units (default 1 if not specified)
   - pricePerUnit: price for one unit (number)
   - totalPrice: total price for this item (number)

Rules:
- All prices in original currency (keep as shown on receipt)
- If quantity not specified, use 1
- Calculate: pricePerUnit = totalPrice / quantity
- Extract ALL items from receipt
- Return ONLY valid JSON, no other text
  `.trim();
  
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mimeType,
            data: imageBase64
          }
        },
        {
          type: "text",
          text: prompt
        }
      ]
    }]
  });
  
  // Извлечь текст из ответа Claude (собрать все text блоки)
  if (!response.content || response.content.length === 0) {
    throw new Error('Claude returned empty response. Receipt may be unreadable or blocked by safety filters.');
  }
  
  const textParts = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text);
  
  if (textParts.length === 0) {
    throw new Error('Claude did not return any text content. Receipt parsing failed.');
  }
  
  const text = textParts.join('\n');
  
  // Парсить JSON с обработкой ошибок
  let parsed: ParsedReceipt;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `Failed to parse Claude response as JSON. Response: ${text.substring(0, 200)}...`
    );
  }
  
  // Валидация обязательных полей
  if (!parsed.items || !Array.isArray(parsed.items)) {
    throw new Error('Invalid receipt format: missing or invalid items array');
  }
  
  // Нормализовать названия товаров для будущего сравнения цен
  parsed.items = parsed.items.map(item => ({
    ...item,
    normalizedName: normalizeItemName(item.name)
  }));
  
  return parsed;
}

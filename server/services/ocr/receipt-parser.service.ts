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
  currency?: string; // Per-item currency (for mixed-currency receipts)
}

export interface ParsedReceipt {
  total: number;
  merchant: string;
  date: string;
  currency?: string; // Currency code from receipt (USD, IDR, RUB, etc.)
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

export type ImageInput = {
  base64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
};

/**
 * Парсить чек с извлечением товаров через Claude API
 * Поддерживает одно или несколько изображений (длинный чек на нескольких фото)
 */
export async function parseReceiptWithItems(
  images: string | string[] | ImageInput[],
  apiKey: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
): Promise<ParsedReceipt> {

  const anthropic = new Anthropic({ apiKey });

  // Нормализуем вход в массив ImageInput
  const imageList: ImageInput[] = Array.isArray(images)
    ? images.map(img => typeof img === 'string' ? { base64: img, mimeType } : img)
    : [{ base64: images, mimeType }];

  const isMulti = imageList.length > 1;

  const prompt = `
Parse this receipt ${isMulti ? '(split across multiple photos — combine all items into ONE result)' : 'image'} and extract structured data.

Return ONLY valid JSON in this exact format (no explanations, no markdown):
{
  "total": 180000,
  "currency": "IDR",
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
2. currency - 3-letter currency code (USD, IDR, RUB, EUR, etc.) - detect from receipt symbols or context
3. merchant - store/merchant name (string)
4. date - purchase date in YYYY-MM-DD format (string)
5. items - array of purchased items with:
   - name: item description from receipt (string)
   - quantity: number of units (default 1 if not specified)
   - pricePerUnit: price for one unit (number)
   - totalPrice: total price for this item (number)

Rules:
- All prices in original currency (keep as shown on receipt)
- Detect currency from symbols: $ → USD, Rp → IDR, ₽ → RUB, € → EUR
- If currency symbol unclear, infer from merchant location/name
- If quantity not specified, use 1
- Calculate: pricePerUnit = totalPrice / quantity
- Extract ALL items from receipt${isMulti ? ' across ALL photos' : ''}
- ${isMulti ? 'Deduplicate items if same item appears on overlapping photos' : ''}
- Return ONLY valid JSON, no other text
  `.trim();

  // Собираем content: все изображения + текст промпта
  const content: Anthropic.MessageCreateParams['messages'][0]['content'] = [
    ...imageList.map(img => ({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: img.mimeType,
        data: img.base64,
      },
    })),
    { type: "text" as const, text: prompt },
  ];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4000,
    messages: [{ role: "user", content }],
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
  
  let text = textParts.join('\n');
  
  // Извлечь JSON из markdown блока (если есть)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    text = jsonMatch[1].trim();
  }
  
  // Парсить JSON с обработкой ошибок
  let parsed: ParsedReceipt;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    console.error('OCR Parse Error:', {
      error: error instanceof Error ? error.message : String(error),
      responseStart: text.substring(0, 300)
    });
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

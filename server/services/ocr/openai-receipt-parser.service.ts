import OpenAI from 'openai';
import { logError } from '../../lib/logger';
import type { ParsedReceipt, ImageInput } from './receipt-parser.service';

/**
 * Parse receipt using OpenAI GPT-4o vision API
 * Same interface and return type as Anthropic version (receipt-parser.service.ts)
 */
export async function parseReceiptWithOpenAI(
  images: string[] | ImageInput[],
  apiKey: string,
  mimeType: string
): Promise<ParsedReceipt> {
  const openai = new OpenAI({ apiKey });

  const imageList: ImageInput[] = images.map(img =>
    typeof img === 'string'
      ? { base64: img, mimeType: mimeType as ImageInput['mimeType'] }
      : img
  );

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

  const imageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = imageList.map(img => ({
    type: 'image_url' as const,
    image_url: {
      url: `data:${img.mimeType};base64,${img.base64}`,
    },
  }));

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: [
          ...imageContent,
          { type: 'text', text: prompt },
        ],
      },
    ],
  });

  const text = response.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('OpenAI returned empty response. Receipt may be unreadable.');
  }

  // Extract JSON from markdown block if present
  let jsonText = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim();
  }

  let parsed: ParsedReceipt;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    logError('OpenAI OCR Parse Error', error instanceof Error ? error : undefined, {
      responseStart: jsonText.substring(0, 300),
    });
    throw new Error(
      `Failed to parse OpenAI response as JSON. Response: ${jsonText.substring(0, 200)}...`
    );
  }

  if (!parsed.items || !Array.isArray(parsed.items)) {
    throw new Error('Invalid receipt format: missing or invalid items array');
  }

  // Normalize item names (same logic as Anthropic parser)
  parsed.items = parsed.items.map(item => ({
    ...item,
    normalizedName: item.name
      .toLowerCase()
      .replace(/[0-9]+\s*(ml|l|kg|g|pcs|шт|л|кг|г)/gi, '')
      .replace(/[^a-zа-яё\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
  }));

  return parsed;
}

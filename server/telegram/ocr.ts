import Anthropic from '@anthropic-ai/sdk';
import { ParsedTransaction } from './parser';
import { DEFAULT_CATEGORY_EXPENSE, CATEGORY_KEYWORDS } from './config';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface ReceiptData {
  amount: number;
  currency: 'USD' | 'RUB' | 'IDR';
  description: string;
  merchantName?: string;
  date?: string;
  items?: string[];
}

export async function processReceiptImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<ParsedTransaction | null> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Extract the following information from this receipt:
1. Total amount (number only, no currency symbols)
2. Currency (USD, RUB, or IDR - if unclear, use USD)
3. Merchant/store name
4. Brief description of purchase (1-3 words)

Respond ONLY with a JSON object in this exact format:
{
  "amount": 123.45,
  "currency": "USD",
  "merchantName": "Store Name",
  "description": "groceries"
}

If you cannot extract the information clearly, return null.`,
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return null;
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const receiptData: ReceiptData = JSON.parse(jsonMatch[0]);

    if (!receiptData.amount || receiptData.amount <= 0) {
      return null;
    }

    const category = detectCategoryFromMerchant(
      receiptData.merchantName || receiptData.description
    );

    return {
      amount: receiptData.amount,
      currency: receiptData.currency || 'USD',
      description: receiptData.merchantName || receiptData.description || 'Receipt',
      category,
      type: 'expense',
    };
  } catch (error) {
    console.error('OCR processing error:', error);
    return null;
  }
}

function detectCategoryFromMerchant(text: string): string {
  if (!text) {
    return DEFAULT_CATEGORY_EXPENSE;
  }

  const lowerText = text.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return DEFAULT_CATEGORY_EXPENSE;
}

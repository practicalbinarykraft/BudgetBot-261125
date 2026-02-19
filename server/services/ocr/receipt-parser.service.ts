import Anthropic from '@anthropic-ai/sdk';
import { buildReceiptPrompt } from './ocr-prompt';
import { parseLlmResponse } from './parse-llm-response';
import type { ParsedReceipt, ParsedReceiptItem, ImageInput } from './ocr-provider.types';

// Re-export types for backward compatibility
export type { ParsedReceipt, ParsedReceiptItem, ImageInput };

/**
 * Parse receipt with item extraction via Claude API.
 * Supports single or multiple images (for long receipts split across photos).
 */
export async function parseReceiptWithItems(
  images: string | string[] | ImageInput[],
  apiKey: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
): Promise<ParsedReceipt> {

  const anthropic = new Anthropic({ apiKey });

  const imageList: ImageInput[] = Array.isArray(images)
    ? images.map(img => typeof img === 'string' ? { base64: img, mimeType } : img)
    : [{ base64: images, mimeType }];

  const isMulti = imageList.length > 1;
  const prompt = buildReceiptPrompt(isMulti);

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
  return parseLlmResponse(text, 'Claude');
}

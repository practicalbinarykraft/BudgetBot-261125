import Anthropic from '@anthropic-ai/sdk';
import { buildReceiptPrompt } from './ocr-prompt';
import { parseLlmResponse } from './parse-llm-response';
import { classifyProviderError } from './ocr-errors';
import type { OcrProvider, ImageInput, ParsedReceipt } from './ocr-provider.types';

/**
 * Anthropic Claude Vision OCR provider.
 * Uses Claude Sonnet for best receipt parsing quality.
 */
export const anthropicOcrProvider: OcrProvider = {
  name: 'anthropic',
  billingProvider: 'anthropic',

  isAvailable(): boolean {
    try {
      require.resolve('@anthropic-ai/sdk');
      return true;
    } catch {
      return false;
    }
  },

  async parseReceipt(
    images: ImageInput[],
    apiKey: string,
  ): Promise<ParsedReceipt> {
    try {
      const anthropic = new Anthropic({ apiKey });
      const isMulti = images.length > 1;
      const prompt = buildReceiptPrompt(isMulti);

      const content: Anthropic.MessageCreateParams['messages'][0]['content'] = [
        ...images.map(img => ({
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: img.mimeType,
            data: img.base64,
          },
        })),
        { type: 'text' as const, text: prompt },
      ];

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        messages: [{ role: 'user', content }],
      });

      if (!response.content || response.content.length === 0) {
        throw new Error('Claude returned empty response. Receipt may be unreadable.');
      }

      const textParts = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text);

      if (textParts.length === 0) {
        throw new Error('Claude did not return any text content. Receipt parsing failed.');
      }

      return parseLlmResponse(textParts.join('\n'), 'Claude');
    } catch (error) {
      if (error instanceof Error && error.name === 'OcrError') throw error;
      throw classifyProviderError(error);
    }
  },
};

import OpenAI from 'openai';
import { buildReceiptPrompt } from './ocr-prompt';
import { parseLlmResponse } from './parse-llm-response';
import { classifyProviderError } from './ocr-errors';
import type { OcrProvider, ImageInput, ParsedReceipt } from './ocr-provider.types';

/**
 * OpenAI GPT-4o Vision OCR provider.
 * Used as fallback when Anthropic is unavailable.
 */
export const openaiOcrProvider: OcrProvider = {
  name: 'openai',
  billingProvider: 'openai',

  isAvailable(): boolean {
    // If this module loaded, the SDK import at line 1 succeeded.
    // require.resolve() doesn't work in ESM bundles (esbuild --format=esm).
    return true;
  },

  async parseReceipt(
    images: ImageInput[],
    apiKey: string,
  ): Promise<ParsedReceipt> {
    try {
      const openai = new OpenAI({ apiKey });
      const isMulti = images.length > 1;
      const prompt = buildReceiptPrompt(isMulti);

      const imageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = images.map(img => ({
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

      const text = response.choices?.[0]?.message?.content ?? '';
      return parseLlmResponse(text, 'OpenAI');
    } catch (error) {
      if (error instanceof Error && error.name === 'OcrError') throw error;
      throw classifyProviderError(error);
    }
  },
};

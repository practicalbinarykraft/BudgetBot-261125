import OpenAI from 'openai';
import { buildReceiptPrompt } from './ocr-prompt';
import { parseLlmResponse } from './parse-llm-response';
import type { ParsedReceipt, ImageInput } from './ocr-provider.types';

/**
 * Parse receipt using OpenAI GPT-4o vision API.
 * Same interface and return type as Anthropic version.
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
  const prompt = buildReceiptPrompt(isMulti);

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

  const text = response.choices?.[0]?.message?.content ?? '';
  return parseLlmResponse(text, 'OpenAI');
}

import { parseReceiptWithItems, type ParsedReceipt, type ImageInput } from './receipt-parser.service';
import { parseReceiptWithOpenAI } from './openai-receipt-parser.service';
import { logWarning } from '../../lib/logger';

/**
 * Check if error indicates provider is unavailable (billing, rate limit, outage)
 * — these errors should trigger fallback to another provider.
 * Non-retryable errors (bad receipt, parse failure) should NOT trigger fallback.
 */
export function isProviderUnavailableError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  return (
    lower.includes('credit balance') ||
    lower.includes('insufficient') ||
    lower.includes('rate limit') ||
    lower.includes('429') ||
    lower.includes('503') ||
    lower.includes('502') ||
    lower.includes('overloaded')
  );
}

/**
 * Parse receipt with automatic fallback: Anthropic → OpenAI
 */
export async function parseReceiptWithFallback(
  images: string[] | ImageInput[],
  anthropicKey: string,
  openaiKey: string,
  mimeType: string
): Promise<{ receipt: ParsedReceipt; provider: 'anthropic' | 'openai' }> {
  try {
    const receipt = await parseReceiptWithItems(images, anthropicKey, mimeType);
    return { receipt, provider: 'anthropic' };
  } catch (err) {
    if (!isProviderUnavailableError(err)) {
      throw err;
    }
    logWarning(
      `Anthropic OCR failed (${err instanceof Error ? err.message : err}), falling back to OpenAI`
    );
    const receipt = await parseReceiptWithOpenAI(images, openaiKey, mimeType);
    return { receipt, provider: 'openai' };
  }
}

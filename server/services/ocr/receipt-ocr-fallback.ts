import { runOcr } from './ocr-orchestrator';
import type { ParsedReceipt, ImageInput, OcrResult } from './ocr-provider.types';

// Re-export for backward compatibility
export type { OcrResult };

/**
 * Check if error indicates provider is unavailable (billing, rate limit, outage).
 * Kept for backward compatibility — new code should use OcrError.retryable instead.
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
 * Parse receipt with automatic fallback — thin wrapper around the orchestrator.
 *
 * Backward-compatible: same signature and return shape as before.
 * New callers should use runOcr() directly for full OcrResult metadata.
 */
export async function parseReceiptWithFallback(
  images: string[] | ImageInput[],
  anthropicKey: string,
  openaiKey: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
): Promise<{ receipt: ParsedReceipt; provider: 'anthropic' | 'openai'; providersTried: string[]; fallbackReason?: string }> {

  const imageList: ImageInput[] = images.map(img =>
    typeof img === 'string'
      ? { base64: img, mimeType }
      : img
  );

  const getKeyForProvider = (name: string): string | null => {
    if (name === 'anthropic' && anthropicKey) return anthropicKey;
    if (name === 'openai' && openaiKey) return openaiKey;
    return null;
  };

  const result = await runOcr(imageList, mimeType, getKeyForProvider);

  return {
    receipt: result.receipt,
    provider: result.provider as 'anthropic' | 'openai',
    providersTried: result.providersTried,
    fallbackReason: result.fallbackReason,
  };
}

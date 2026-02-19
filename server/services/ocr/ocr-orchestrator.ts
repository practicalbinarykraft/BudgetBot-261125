import { OcrError } from './ocr-errors';
import { getProvider, getProviderOrder } from './ocr-registry';
import { logInfo, logWarning, logError } from '../../lib/logger';
import type { OcrResult, ImageInput, KeyResolver } from './ocr-provider.types';

/**
 * OCR Orchestrator — tries providers in order, falls back on retryable errors.
 *
 * - Reads provider order from OCR_PROVIDER_ORDER env var (default: anthropic,openai)
 * - Skips providers with no API key (no crash)
 * - Skips providers that are not available (SDK not installed)
 * - Falls back only on retryable OcrErrors
 * - Stops on non-retryable errors (BAD_INPUT, PARSE_FAILED)
 */
export async function runOcr(
  images: ImageInput[],
  mimeType: ImageInput['mimeType'],
  getKeyForProvider: KeyResolver,
): Promise<OcrResult> {
  const totalStart = Date.now();
  const order = getProviderOrder();
  const providersTried: string[] = [];
  let lastError: Error | undefined;
  let fallbackReason: string | undefined;

  for (const name of order) {
    const provider = getProvider(name);
    if (!provider) {
      logWarning(`OCR provider "${name}" not registered, skipping`);
      continue;
    }

    if (!provider.isAvailable()) {
      logWarning(`OCR provider "${name}" not available (SDK missing?), skipping`);
      continue;
    }

    const key = getKeyForProvider(name);
    if (!key) {
      logWarning(`No API key for OCR provider "${name}", skipping`);
      continue;
    }

    providersTried.push(name);
    const start = Date.now();

    try {
      const receipt = await provider.parseReceipt(images, key, mimeType);
      const latencyMs = Date.now() - start;

      const result: OcrResult = {
        receipt,
        provider: name,
        providersTried,
        fallbackReason,
        latencyMs,
      };

      // Structured success event
      logInfo('OCR_RUN_COMPLETED', {
        provider: name,
        providersTried,
        fallbackReason,
        latencyMs,
        totalLatencyMs: Date.now() - totalStart,
        imageCount: images.length,
      });

      return result;
    } catch (error) {
      const latencyMs = Date.now() - start;
      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof OcrError && !error.retryable) {
        logError('OCR_RUN_FAILED', error, {
          provider: name,
          errorCode: error.code,
          retryable: false,
          providersTried,
          latencyMs,
          totalLatencyMs: Date.now() - totalStart,
          imageCount: images.length,
        });
        throw error;
      }

      const reason = error instanceof OcrError
        ? `${name}: ${error.code} — ${error.message}`
        : `${name}: ${lastError.message}`;

      logWarning(`OCR: "${name}" failed (retryable), trying next provider`, {
        reason,
        latencyMs,
      });

      fallbackReason = reason;
    }
  }

  // All providers exhausted
  const totalLatencyMs = Date.now() - totalStart;

  if (providersTried.length === 0) {
    logError('OCR_RUN_FAILED', undefined, {
      reason: 'no_providers_available',
      providersTried,
      totalLatencyMs,
      imageCount: images.length,
    });
    throw new Error(
      'No OCR providers available. Check API keys and OCR_PROVIDER_ORDER env var.'
    );
  }

  logError('OCR_RUN_FAILED', lastError, {
    reason: 'all_providers_exhausted',
    providersTried,
    fallbackReason,
    totalLatencyMs,
    imageCount: images.length,
  });

  throw lastError ?? new Error('All OCR providers failed');
}

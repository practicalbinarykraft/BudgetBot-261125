import { registerProvider } from './ocr-registry';
import { anthropicOcrProvider } from './anthropic-ocr-provider';
import { openaiOcrProvider } from './openai-ocr-provider';

let registered = false;

/**
 * Register all built-in OCR providers.
 * Idempotent — safe to call multiple times, registers only once per process.
 *
 * Called from server/index.ts at startup, before routes.
 *
 * To add a new provider:
 * 1. Create <name>-ocr-provider.ts implementing OcrProvider
 * 2. Import and register it here
 * 3. Add its name to OCR_PROVIDER_ORDER env var
 */
export function registerOcrProviders(): void {
  if (registered) return;
  registered = true;

  registerProvider(anthropicOcrProvider);
  registerProvider(openaiOcrProvider);
}

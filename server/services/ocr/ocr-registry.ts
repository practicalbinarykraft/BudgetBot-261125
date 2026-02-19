import type { OcrProvider } from './ocr-provider.types';

/**
 * Registry of OCR providers.
 * Providers register themselves at startup; orchestrator looks them up by name.
 */
const providers = new Map<string, OcrProvider>();

export function registerProvider(provider: OcrProvider): void {
  providers.set(provider.name, provider);
}

export function getProvider(name: string): OcrProvider | undefined {
  return providers.get(name);
}

export function getAllProviders(): OcrProvider[] {
  return Array.from(providers.values());
}

export function getProviderNames(): string[] {
  return Array.from(providers.keys());
}

/**
 * Get provider order from environment variable.
 * Default: anthropic,openai
 */
export function getProviderOrder(): string[] {
  const envOrder = process.env.OCR_PROVIDER_ORDER;
  if (envOrder) {
    return envOrder.split(',').map(s => s.trim()).filter(Boolean);
  }
  return ['anthropic', 'openai'];
}

/** Clear registry (for testing) */
export function clearRegistry(): void {
  providers.clear();
}

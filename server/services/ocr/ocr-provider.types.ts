import type { AIProvider } from '../../types/billing';

/**
 * Image input for OCR providers
 */
export type ImageInput = {
  base64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
};

/**
 * Parsed receipt item (individual product line)
 */
export interface ParsedReceiptItem {
  name: string;
  normalizedName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  currency?: string;
}

/**
 * Parsed receipt (complete result from any OCR provider)
 */
export interface ParsedReceipt {
  total: number;
  merchant: string;
  date: string;
  currency?: string;
  items: ParsedReceiptItem[];
}

/**
 * Every OCR provider implements this interface.
 * Adding a new provider = implement this + register in registry.
 */
export interface OcrProvider {
  /** Unique name: 'anthropic', 'openai', etc. */
  name: string;

  /** Which AI provider to charge credits for */
  billingProvider: AIProvider;

  /** Is the provider's SDK installed and usable? MUST NOT throw. */
  isAvailable(): boolean;

  /** Parse receipt images into structured data */
  parseReceipt(
    images: ImageInput[],
    apiKey: string,
    mimeType: ImageInput['mimeType']
  ): Promise<ParsedReceipt>;
}

/**
 * Orchestrator output — includes metadata about the OCR attempt
 */
export interface OcrResult {
  receipt: ParsedReceipt;
  provider: string;
  providersTried: string[];
  fallbackReason?: string;
  latencyMs: number;
}

/**
 * Callback that the route handler passes to the orchestrator
 * to resolve API keys per provider name.
 * Returns null if no key available (provider will be skipped).
 */
export type KeyResolver = (providerName: string) => string | null;

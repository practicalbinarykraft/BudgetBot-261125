/**
 * Typed OCR errors for fallback decisions.
 *
 * retryable = true  → orchestrator tries the next provider
 * retryable = false → orchestrator stops (same image = same fail everywhere)
 */

export type OcrErrorCode =
  | 'RATE_LIMITED'
  | 'PROVIDER_DOWN'
  | 'BILLING_DISABLED'
  | 'INVALID_KEY'
  | 'BAD_INPUT'
  | 'PARSE_FAILED';

export class OcrError extends Error {
  readonly code: OcrErrorCode;
  readonly retryable: boolean;

  constructor(message: string, code: OcrErrorCode) {
    super(message);
    this.name = 'OcrError';
    this.code = code;
    this.retryable = shouldFallback(code);
  }
}

/**
 * Determine if an error code should trigger fallback to the next provider.
 * Provider-side issues → retry. Input/parse issues → stop.
 */
export function shouldFallback(code: OcrErrorCode): boolean {
  switch (code) {
    case 'RATE_LIMITED':
    case 'PROVIDER_DOWN':
    case 'BILLING_DISABLED':
    case 'INVALID_KEY':
      return true;
    case 'BAD_INPUT':
    case 'PARSE_FAILED':
      return false;
  }
}

/**
 * Classify a raw provider error into an OcrError.
 * Used by provider adapters to wrap SDK errors.
 */
export function classifyProviderError(error: unknown): OcrError {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  if (lower.includes('credit balance') || lower.includes('insufficient') || lower.includes('billing')) {
    return new OcrError(msg, 'BILLING_DISABLED');
  }
  if (lower.includes('rate limit') || lower.includes('429')) {
    return new OcrError(msg, 'RATE_LIMITED');
  }
  if (lower.includes('503') || lower.includes('502') || lower.includes('overloaded')) {
    return new OcrError(msg, 'PROVIDER_DOWN');
  }
  if (lower.includes('invalid') && lower.includes('key') || lower.includes('authentication') || lower.includes('401')) {
    return new OcrError(msg, 'INVALID_KEY');
  }
  if (lower.includes('failed to parse') || lower.includes('invalid receipt format') || lower.includes('empty response')) {
    return new OcrError(msg, 'PARSE_FAILED');
  }

  // Default: treat unknown errors as provider down (retryable)
  return new OcrError(msg, 'PROVIDER_DOWN');
}

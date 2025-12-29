/**
 * API Error Handler
 * Provides retry logic and error formatting for external API calls
 */

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  delayMs: 1000,
  shouldRetry: isRetryableError,
};

/**
 * Check if error is a network/transient error that can be retried
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('503') ||
      message.includes('502')
    );
  }
  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === opts.maxRetries;
      const shouldRetry = opts.shouldRetry(error);

      if (isLastAttempt || !shouldRetry) {
        throw error;
      }

      // Exponential backoff
      const delay = opts.delayMs * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Format error for user-friendly display
 */
export function formatApiError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return 'Too many requests. Please try again later.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
      return 'Network error. Please check your connection.';
    }
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      return 'Invalid API key. Please check your settings.';
    }
    return error.message;
  }
  return 'An unexpected error occurred.';
}

/**
 * Wrap async function with timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
}

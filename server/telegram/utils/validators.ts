/**
 * Input Validators
 * Validate user input before processing
 */

/**
 * Validate verification code format
 * Must be exactly 6 alphanumeric characters
 */
export function isValidVerifyCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }
  // Exactly 6 alphanumeric characters
  return /^[A-Za-z0-9]{6}$/.test(code.trim());
}

/**
 * Validate amount is a reasonable number
 * Must be positive and less than 1 billion
 */
export function isValidAmount(amount: number): boolean {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return false;
  }
  return amount > 0 && amount < 1_000_000_000;
}

/**
 * List of supported currencies
 */
export const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'RUB', 'IDR', 'THB',
  'GBP', 'JPY', 'KRW', 'CNY', 'INR',
  'AUD', 'CAD', 'CHF', 'SGD', 'MYR',
  'PHP', 'VND', 'BRL', 'MXN', 'TRY'
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

/**
 * Validate currency code
 */
export function isValidCurrency(currency: string): currency is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(currency.toUpperCase() as SupportedCurrency);
}

/**
 * Sanitize description text
 * Remove dangerous characters while keeping emoji and basic punctuation
 */
export function sanitizeDescription(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // Remove control characters except newlines
    .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '')
    // Remove HTML-like tags
    .replace(/<[^>]*>/g, '')
    // Limit length
    .substring(0, 500)
    .trim();
}

/**
 * Validate Telegram chat ID
 */
export function isValidChatId(chatId: unknown): chatId is number {
  return typeof chatId === 'number' &&
         Number.isInteger(chatId) &&
         chatId !== 0;
}

/**
 * Validate transaction ID
 */
export function isValidTransactionId(id: unknown): id is number {
  return typeof id === 'number' &&
         Number.isInteger(id) &&
         id > 0;
}

/**
 * Validate date string (YYYY-MM-DD format)
 */
export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Validate that items array is not too large
 */
export function isValidItemsCount(items: unknown[]): boolean {
  return Array.isArray(items) && items.length <= 100;
}

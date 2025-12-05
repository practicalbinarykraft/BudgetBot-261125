/**
 * Input Sanitization Utilities
 *
 * Protects against XSS and injection attacks.
 * Junior-Friendly: ~40 lines, pure utility functions
 *
 * Usage:
 *   const clean = sanitizeString(userInput);
 *   const cleanObj = sanitizeObject(req.body);
 */

import validator from 'validator';

/**
 * Sanitize a string to prevent XSS attacks
 * Escapes HTML entities: < > " ' & /
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  return validator.escape(input.trim());
}

/**
 * Sanitize string but preserve some formatting
 * Only escapes dangerous characters, keeps newlines
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  // Escape HTML but keep newlines
  return validator.escape(input).replace(/&#x2F;/g, '/');
}

/**
 * Recursively sanitize all string values in an object
 * Useful for sanitizing req.body
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };

  for (const key in result) {
    const value = result[key];

    if (typeof value === 'string') {
      (result as Record<string, unknown>)[key] = sanitizeString(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = value.map(item =>
        typeof item === 'string' ? sanitizeString(item) : item
      );
    }
  }

  return result;
}

/**
 * Check if string contains potential SQL injection patterns
 * Returns true if suspicious
 */
export function hasSqlInjection(input: string): boolean {
  if (typeof input !== 'string') return false;

  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i,
    /(--|#|\/\*)/,
    /(\bOR\b\s+\d+\s*=\s*\d+)/i,
    /(\bAND\b\s+\d+\s*=\s*\d+)/i,
  ];

  return patterns.some(pattern => pattern.test(input));
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string | null {
  if (!validator.isEmail(email)) {
    return null;
  }
  return validator.normalizeEmail(email) || null;
}

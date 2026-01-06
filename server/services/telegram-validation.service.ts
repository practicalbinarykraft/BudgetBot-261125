/**
 * Telegram Validation Service
 *
 * Shared utilities for validating Telegram initData and auth data
 * Junior-Friendly: ~100 lines, single responsibility
 */

import crypto from 'crypto';

/**
 * Maximum age of initData in seconds (24 hours)
 * Prevents replay attacks using old but valid initData
 */
const MAX_INIT_DATA_AGE_SECONDS = 24 * 60 * 60; // 24 hours

/**
 * Validate Telegram Mini App initData signature
 * 
 * @param initData - Raw initData string from Telegram WebApp
 * @param botToken - Telegram bot token
 * @returns Object with validation result and parsed data
 * 
 * @example
 * ```typescript
 * const result = validateInitData(initData, botToken);
 * if (!result.isValid) {
 *   return res.status(401).json({ error: result.error });
 * }
 * const telegramUser = result.user;
 * ```
 */
export function validateInitData(
  initData: string,
  botToken: string
): {
  isValid: boolean;
  error?: string;
  user?: {
    id: number;
    first_name: string;
    username?: string;
    photo_url?: string;
  };
  authDate?: number;
} {
  try {
    // STEP 1: Parse initData
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) {
      return { isValid: false, error: 'Missing hash in initData' };
    }

    // STEP 2: Get auth_date for freshness check
    const authDateStr = urlParams.get('auth_date');
    if (!authDateStr) {
      return { isValid: false, error: 'Missing auth_date in initData' };
    }

    const authDate = parseInt(authDateStr, 10);
    if (isNaN(authDate)) {
      return { isValid: false, error: 'Invalid auth_date format' };
    }

    // STEP 3: Check freshness (prevent replay attacks)
    const now = Math.floor(Date.now() / 1000);
    const age = now - authDate;

    if (age < 0) {
      return { isValid: false, error: 'auth_date is in the future' };
    }

    if (age > MAX_INIT_DATA_AGE_SECONDS) {
      return {
        isValid: false,
        error: `initData is too old (${Math.floor(age / 3600)} hours, max 24 hours)`,
      };
    }

    // STEP 4: Verify signature
    urlParams.delete('hash');
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (hash !== expectedHash) {
      return { isValid: false, error: 'Invalid initData signature' };
    }

    // STEP 5: Parse user data
    const userJson = urlParams.get('user');
    if (!userJson) {
      return { isValid: false, error: 'User data not found in initData' };
    }

    const telegramUser = JSON.parse(userJson);
    const telegramId = telegramUser.id;

    if (!telegramId) {
      return { isValid: false, error: 'Telegram user ID not found' };
    }

    return {
      isValid: true,
      user: {
        id: telegramId,
        first_name: telegramUser.first_name || '',
        username: telegramUser.username,
        photo_url: telegramUser.photo_url,
      },
      authDate,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid initData format',
    };
  }
}


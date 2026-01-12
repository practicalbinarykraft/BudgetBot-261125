/**
 * Shared Telegram Types
 *
 * Common TypeScript types for Telegram integration
 * Used across frontend and backend
 */

/**
 * Telegram user data from Login Widget or Mini App
 */
export interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
  language_code?: string;
}


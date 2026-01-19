/**
 * Client-side Environment Variables Validation
 *
 * Validates Vite environment variables at build/runtime.
 * Only VITE_ prefixed variables are exposed to the client.
 *
 * @see https://vitejs.dev/guide/env-and-mode.html
 */

import { z } from 'zod';

/**
 * Client environment variable schema
 *
 * Note: Vite only exposes variables prefixed with VITE_
 */
const envSchema = z.object({
  // ===== Vite Built-in =====
  MODE: z.enum(['development', 'production', 'test'])
    .describe('Vite mode'),

  DEV: z.boolean()
    .describe('Is development mode'),

  PROD: z.boolean()
    .describe('Is production mode'),

  // ===== Optional Client Config =====
  VITE_API_URL: z.string()
    .url()
    .optional()
    .describe('API base URL (optional, defaults to same origin)'),

  VITE_SENTRY_DSN: z.string()
    .url()
    .optional()
    .describe('Sentry DSN for client-side error tracking (optional)'),

  VITE_ENABLE_ANALYTICS: z.string()
    .transform(val => val === 'true')
    .optional()
    .describe('Enable analytics (optional)'),

  VITE_TELEGRAM_BOT_USERNAME: z.string()
    .optional()
    .describe('Telegram bot username for Login Widget (without @)'),
});

/**
 * Validated client environment variables
 *
 * Use this instead of import.meta.env for type safety.
 *
 * @example
 * import { env } from './lib/env';
 *
 * console.log(env.MODE); // Type-safe
 * console.log(env.VITE_API_URL); // Optional, validated
 */
export const env = (() => {
  try {
    // Parse and validate
    const parsed = envSchema.parse(import.meta.env);

    // Log in development only
    if (parsed.DEV) {
      console.log('✅ Client environment variables validated');
      console.log('📋 Client config:', {
        MODE: parsed.MODE,
        API_URL: parsed.VITE_API_URL || '(same origin)',
        SENTRY: parsed.VITE_SENTRY_DSN ? 'enabled' : 'disabled',
        ANALYTICS: parsed.VITE_ENABLE_ANALYTICS ? 'enabled' : 'disabled',
        TELEGRAM_BOT: parsed.VITE_TELEGRAM_BOT_USERNAME || '(not set)',
      });
    }

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Client environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });

      // Don't crash in production, use defaults
      if (import.meta.env.PROD) {
        console.warn('⚠️  Using default values in production');
        return {
          MODE: 'production' as const,
          DEV: false,
          PROD: true,
        };
      }

      throw error;
    }

    throw error;
  }
})();

/**
 * Type of validated environment variables
 */
export type ClientEnv = z.infer<typeof envSchema>;

/**
 * Check if running in production
 */
export const isProduction = env.PROD;

/**
 * Check if running in development
 */
export const isDevelopment = env.DEV;

/**
 * Get API base URL
 */
export const getApiUrl = (): string => {
  return env.VITE_API_URL || '';
};

/**
 * Feature flags
 */
export const features = {
  sentry: !!env.VITE_SENTRY_DSN,
  analytics: !!env.VITE_ENABLE_ANALYTICS,
};

/**
 * Get Telegram bot username for Login Widget
 * Falls back to 'BudgetBuddyAIBot' if not configured
 */
export const getTelegramBotUsername = (): string => {
  return env.VITE_TELEGRAM_BOT_USERNAME || 'BudgetBuddyAIBot';
};

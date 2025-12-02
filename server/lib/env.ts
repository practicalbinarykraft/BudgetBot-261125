/**
 * Environment Variables Validation
 *
 * Validates all environment variables on application startup using Zod.
 * Prevents production issues from missing or invalid configuration.
 *
 * Benefits:
 * - Type-safe environment variables
 * - Early error detection (at startup, not runtime)
 * - Clear error messages
 * - Documentation of required config
 */

import { z } from 'zod';

/**
 * Environment variable schema
 *
 * All variables are validated when the module is imported.
 * Application will crash on startup if validation fails.
 */
const envSchema = z.object({
  // ===== Node Environment =====
  NODE_ENV: z.enum(['development', 'production', 'test'])
    .default('development')
    .describe('Node environment'),

  // ===== Server Configuration =====
  PORT: z.string()
    .default('5000')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0 && val < 65536, 'Port must be between 1 and 65535')
    .describe('Server port'),

  // ===== Database (REQUIRED) =====
  DATABASE_URL: z.string()
    .url('DATABASE_URL must be a valid PostgreSQL URL')
    .startsWith('postgres', 'DATABASE_URL must be a PostgreSQL connection string')
    .describe('PostgreSQL connection string (required)'),

  // ===== Security (REQUIRED) =====
  SESSION_SECRET: z.string()
    .min(32, 'SESSION_SECRET must be at least 32 characters for security')
    .describe('Session secret for cookie signing (generate with: openssl rand -base64 32)'),

  ENCRYPTION_KEY: z.string()
    .length(44, 'ENCRYPTION_KEY must be exactly 44 characters (32 bytes in base64)')
    .refine(
      (val) => {
        try {
          const decoded = Buffer.from(val, 'base64');
          return decoded.length === 32;
        } catch {
          return false;
        }
      },
      'ENCRYPTION_KEY must be valid base64 encoding of 32 bytes'
    )
    .describe('Encryption key for API keys (generate with: openssl rand -base64 32)'),

  // ===== Telegram Bot (Optional) =====
  TELEGRAM_BOT_TOKEN: z.string()
    .optional()
    .describe('Telegram bot token (optional, for Telegram integration)'),

  // ===== Frontend URL (Optional, needed for webhooks) =====
  FRONTEND_URL: z.string()
    .url()
    .optional()
    .describe('Frontend URL for webhooks (e.g., https://your-app.com)'),

  // ===== Redis (Optional, for caching) =====
  REDIS_URL: z.string()
    .url()
    .optional()
    .describe('Redis connection URL (optional, for caching)'),

  // ===== Monitoring (Optional) =====
  SENTRY_DSN: z.string()
    .url()
    .optional()
    .describe('Sentry DSN for error tracking (optional)'),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'trace'])
    .default('info')
    .describe('Logging level'),

  // ===== Cookie Security (Optional) =====
  // Set to "false" for HTTP-only deployments (e.g., VPS without HTTPS)
  SECURE_COOKIES: z.string()
    .optional()
    .transform(val => val !== 'false') // Default true unless explicitly "false"
    .describe('Set to "false" for HTTP-only deployments'),
});

/**
 * Validated and typed environment variables
 *
 * Use this instead of process.env for type safety and validation.
 *
 * @example
 * import { env } from './lib/env';
 *
 * console.log(env.DATABASE_URL); // Type-safe, validated
 * console.log(env.PORT);         // Automatically converted to number
 */
export const env = (() => {
  try {
    // Parse and validate environment variables
    const parsed = envSchema.parse(process.env);

    // Log successful validation
    console.log('✅ Environment variables validated successfully');

    // Log configuration (without sensitive data)
    console.log('📋 Configuration:');
    console.log(`   NODE_ENV: ${parsed.NODE_ENV}`);
    console.log(`   PORT: ${parsed.PORT}`);
    console.log(`   DATABASE_URL: ${parsed.DATABASE_URL.substring(0, 20)}...`);
    console.log(`   SESSION_SECRET: ${'*'.repeat(10)} (${parsed.SESSION_SECRET.length} chars)`);
    console.log(`   ENCRYPTION_KEY: ${'*'.repeat(10)} (${parsed.ENCRYPTION_KEY.length} chars)`);
    console.log(`   TELEGRAM_BOT_TOKEN: ${parsed.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Not set'}`);
    console.log(`   REDIS_URL: ${parsed.REDIS_URL ? '✅ Set' : '❌ Not set'}`);
    console.log(`   SENTRY_DSN: ${parsed.SENTRY_DSN ? '✅ Set' : '❌ Not set'}`);
    console.log(`   SECURE_COOKIES: ${parsed.SECURE_COOKIES ? '✅ Enabled' : '❌ Disabled (HTTP mode)'}`);

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('\n❌ Environment variable validation failed!\n');
      console.error('Missing or invalid environment variables:\n');

      // Format error messages nicely
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        console.error(`  ❌ ${path}: ${err.message}`);
      });

      console.error('\n📝 Required environment variables:');
      console.error('   DATABASE_URL     - PostgreSQL connection string');
      console.error('   SESSION_SECRET   - Generate with: openssl rand -base64 32');
      console.error('   ENCRYPTION_KEY   - Generate with: openssl rand -base64 32');

      console.error('\n💡 Optional environment variables:');
      console.error('   TELEGRAM_BOT_TOKEN - For Telegram bot integration');
      console.error('   FRONTEND_URL       - For webhooks (e.g., https://your-app.com)');
      console.error('   REDIS_URL          - For caching');
      console.error('   SENTRY_DSN         - For error tracking');

      console.error('\n📄 See .env.example for reference\n');

      // Exit process with error code
      process.exit(1);
    }

    // Re-throw unexpected errors
    throw error;
  }
})();

/**
 * Type of validated environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Check if running in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if running in test mode
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Get database connection pool size based on environment
 */
export const getPoolSize = (): number => {
  if (isProduction) return 20;
  if (isTest) return 5;
  return 10; // development
};

/**
 * Validate specific features are configured
 */
export const features = {
  telegram: !!env.TELEGRAM_BOT_TOKEN,
  redis: !!env.REDIS_URL,
  sentry: !!env.SENTRY_DSN,
};

/**
 * Log feature flags
 */
console.log('🎚️  Feature Flags:');
console.log(`   Telegram Bot: ${features.telegram ? '✅ Enabled' : '❌ Disabled'}`);
console.log(`   Redis Cache:  ${features.redis ? '✅ Enabled' : '❌ Disabled'}`);
console.log(`   Sentry:       ${features.sentry ? '✅ Enabled' : '❌ Disabled'}`);
console.log('');

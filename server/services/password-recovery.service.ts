/**
 * Password Recovery Service
 *
 * Handles password recovery via Telegram (priority) or Email (fallback)
 * Junior-Friendly: ~150 lines, clear functions with STEP-by-STEP comments
 *
 * Flow:
 * 1. User requests recovery → generate 6-digit code
 * 2. Send code via Telegram (if linked) or Email (if available)
 * 3. User enters code → verify and return reset token
 * 4. User sets new password using token
 */

import { db } from '../db';
import { users, passwordRecoveryCodes, User } from '@shared/schema';
import { eq, and, gt, sql } from 'drizzle-orm';
import { getTelegramBot } from '../telegram/bot';
import { getUserLanguageByTelegramId } from '../telegram/language';
import { t } from '@shared/i18n';
import { logError, logInfo } from '../lib/logger';
import { env } from '../lib/env';
import crypto from 'crypto';

// ========================================
// CONSTANTS
// ========================================

const CODE_LENGTH = 6;
const CODE_EXPIRY_MINUTES = 15;
const RESET_TOKEN_EXPIRY_HOURS = 1;

// ========================================
// TYPES
// ========================================

export interface RecoveryRequestResult {
  success: boolean;
  method: 'telegram' | 'email' | 'none';
  error?: string;
}

export interface VerifyCodeResult {
  success: boolean;
  resetToken?: string;
  error?: string;
}

// ========================================
// STEP 1: Generate 6-digit recovery code
// ========================================

/**
 * Generate a random 6-digit code
 */
function generateRecoveryCode(): string {
  // Generate random number between 100000 and 999999
  const code = crypto.randomInt(100000, 999999).toString();
  return code;
}

// ========================================
// STEP 2: Save code to database
// ========================================

/**
 * Save recovery code to database with 15-minute expiry
 */
async function saveRecoveryCode(
  userId: number,
  code: string
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + CODE_EXPIRY_MINUTES);

  await db.insert(passwordRecoveryCodes).values({
    userId,
    code,
    expiresAt,
    used: false,
  });

  logInfo(`Recovery code generated for user ${userId}`, {
    expiresAt: expiresAt.toISOString(),
  });
}

// ========================================
// STEP 3: Send code via Telegram (priority)
// ========================================

/**
 * Send recovery code via Telegram
 * Returns true if sent successfully, false otherwise
 */
async function sendCodeViaTelegram(
  userId: number,
  code: string
): Promise<boolean> {
  try {
    const bot = getTelegramBot();
    if (!bot) {
      logError('Telegram bot not initialized', new Error('Bot not available'));
      return false;
    }

    // Get user's Telegram ID
    const [user] = await db
      .select({ telegramId: users.telegramId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.telegramId) {
      return false; // User doesn't have Telegram linked
    }

    // Get user's language
    const language = await getUserLanguageByTelegramId(user.telegramId);

    // Format message
    const message =
      `🔐 *${t('password_recovery.telegram_title', language)}*\n\n` +
      `${t('password_recovery.telegram_code', language)}: *${code}*\n\n` +
      `⏰ ${t('password_recovery.telegram_expiry', language)} (${CODE_EXPIRY_MINUTES} ${t('password_recovery.minutes', language)})\n\n` +
      `⚠️ ${t('password_recovery.telegram_warning', language)}`;

    await bot.sendMessage(user.telegramId, message, {
      parse_mode: 'Markdown',
    });

    logInfo(`Recovery code sent via Telegram to user ${userId}`);
    return true;
  } catch (error) {
    logError('Failed to send recovery code via Telegram', error as Error);
    return false;
  }
}

// ========================================
// STEP 4: Main function - request recovery
// ========================================

/**
 * Request password recovery
 * Tries Telegram first, then Email (if available)
 *
 * @param emailOrTelegramId - User's email or Telegram ID
 * @returns RecoveryRequestResult with method used
 */
export async function requestPasswordRecovery(
  emailOrTelegramId: string
): Promise<RecoveryRequestResult> {
  try {
    // STEP 1: Find user by email or telegramId
    let user: User | null = null;

    // Try email first
    if (emailOrTelegramId.includes('@')) {
      const [foundUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, emailOrTelegramId))
        .limit(1);
      user = foundUser || null;
    } else {
      // Try telegramId
      const [foundUser] = await db
        .select()
        .from(users)
        .where(eq(users.telegramId, emailOrTelegramId))
        .limit(1);
      user = foundUser || null;
    }

    if (!user) {
      return {
        success: false,
        method: 'none',
        error: 'User not found',
      };
    }

    // STEP 2: Generate code
    const code = generateRecoveryCode();

    // STEP 3: Save code to database
    await saveRecoveryCode(user.id, code);

    // STEP 4: Try to send via Telegram (priority)
    const sentViaTelegram = await sendCodeViaTelegram(user.id, code);

    if (sentViaTelegram) {
      return {
        success: true,
        method: 'telegram',
      };
    }

    // STEP 5: Email fallback (not implemented yet - MVP only Telegram)
    // TODO: Implement email sending when email service is added
    // NOTE: 'email' is kept in RecoveryRequestResult type union for future use (v2)
    if (user.email) {
      return {
        success: false,
        method: 'none',
        error: 'Email recovery not yet implemented. Please link your Telegram account.',
      };
    }

    // STEP 6: No recovery method available
    return {
      success: false,
      method: 'none',
      error: 'No recovery method available. Please link Telegram account.',
    };
  } catch (error) {
    logError('Failed to request password recovery', error as Error);
    return {
      success: false,
      method: 'none',
      error: 'Internal server error',
    };
  }
}

// ========================================
// STEP 5: Verify recovery code
// ========================================

/**
 * Verify recovery code and return reset token
 *
 * @param emailOrTelegramId - User's email or Telegram ID
 * @param code - 6-digit recovery code
 * @returns VerifyCodeResult with reset token if valid
 */
export async function verifyRecoveryCode(
  emailOrTelegramId: string,
  code: string
): Promise<VerifyCodeResult> {
  try {
    // STEP 1: Find user
    let user: User | null = null;

    if (emailOrTelegramId.includes('@')) {
      const [foundUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, emailOrTelegramId))
        .limit(1);
      user = foundUser || null;
    } else {
      const [foundUser] = await db
        .select()
        .from(users)
        .where(eq(users.telegramId, emailOrTelegramId))
        .limit(1);
      user = foundUser || null;
    }

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // STEP 2: Find valid recovery code
    const now = new Date();
    const [recoveryCode] = await db
      .select()
      .from(passwordRecoveryCodes)
      .where(
        and(
          eq(passwordRecoveryCodes.userId, user.id),
          eq(passwordRecoveryCodes.code, code),
          eq(passwordRecoveryCodes.used, false),
          gt(passwordRecoveryCodes.expiresAt, now)
        )
      )
      .limit(1);

    if (!recoveryCode) {
      return {
        success: false,
        error: 'Invalid or expired code',
      };
    }

    // STEP 3: Mark code as used
    await db
      .update(passwordRecoveryCodes)
      .set({ used: true })
      .where(eq(passwordRecoveryCodes.id, recoveryCode.id));

    // STEP 4: Generate reset token (valid for 1 hour)
    // Token format: base64(userId:timestamp:hash) for URL safety
    // HMAC signature prevents tampering
    const timestamp = Date.now();
    const secret = env.PASSWORD_RESET_SECRET;
    const tokenData = `${user.id}:${timestamp}`;
    const hash = crypto
      .createHmac('sha256', secret)
      .update(tokenData)
      .digest('hex');
    const resetToken = Buffer.from(`${tokenData}:${hash}`).toString('base64url');

    logInfo(`Recovery code verified for user ${user.id}, reset token generated`);

    return {
      success: true,
      resetToken,
    };
  } catch (error) {
    logError('Failed to verify recovery code', error as Error);
    return {
      success: false,
      error: 'Internal server error',
    };
  }
}

// ========================================
// STEP 6: Cleanup expired codes (optional)
// ========================================

/**
 * Clean up expired recovery codes
 * Can be called by a cron job
 */
export async function cleanupExpiredCodes(): Promise<number> {
  try {
    const now = new Date();
    const result = await db
      .delete(passwordRecoveryCodes)
      .where(
        and(
          sql`${passwordRecoveryCodes.expiresAt} < ${now}`,
          eq(passwordRecoveryCodes.used, true)
        )
      );

    logInfo(`Cleaned up expired recovery codes`);
    return 0; // Drizzle doesn't return count, but we log it
  } catch (error) {
    logError('Failed to cleanup expired codes', error as Error);
    return 0;
  }
}


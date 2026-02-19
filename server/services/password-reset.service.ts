/**
 * Password Reset Service
 *
 * Handles password reset using reset token
 * Junior-Friendly: ~80 lines, clear functions
 *
 * Flow:
 * 1. User verifies recovery code → gets reset token
 * 2. User submits new password with token
 * 3. Service verifies token and updates password
 */

import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { logError, logInfo } from '../lib/logger';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// ========================================
// CONSTANTS
// ========================================

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// ========================================
// TYPES
// ========================================

export interface ResetPasswordResult {
  success: boolean;
  error?: string;
}

// ========================================
// STEP 1: Verify reset token
// ========================================

/**
 * Verify reset token and extract userId
 * Returns userId if token is valid, null otherwise
 */
export function verifyResetToken(token: string): number | null {
  try {
    // Decode base64url token
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const [userIdStr, timestampStr, hash] = decoded.split(':');

    if (!userIdStr || !timestampStr || !hash) {
      return null;
    }

    const userId = parseInt(userIdStr, 10);
    const timestamp = parseInt(timestampStr, 10);

    // Check expiration (1 hour)
    const now = Date.now();
    if (now - timestamp > RESET_TOKEN_EXPIRY_MS) {
      logInfo(`Reset token expired for user ${userId}`, {
        age: now - timestamp,
        maxAge: RESET_TOKEN_EXPIRY_MS,
      });
      return null;
    }

    // Verify HMAC signature
    const secret = process.env.SESSION_SECRET || 'default-secret-change-in-production';
    const tokenData = `${userId}:${timestamp}`;
    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(tokenData)
      .digest('hex');

    const hashBuf = Buffer.from(hash, 'hex');
    const expectedBuf = Buffer.from(expectedHash, 'hex');
    if (hashBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(hashBuf, expectedBuf)) {
      logInfo(`Invalid reset token signature for user ${userId}`);
      return null;
    }

    return userId;
  } catch (error) {
    logError('Failed to verify reset token', error as Error);
    return null;
  }
}

// ========================================
// STEP 2: Reset password
// ========================================

/**
 * Reset user password using reset token
 *
 * @param token - Reset token from verifyRecoveryCode
 * @param newPassword - New password to set
 * @returns ResetPasswordResult
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ResetPasswordResult> {
  try {
    // STEP 1: Verify token
    const userId = verifyResetToken(token);
    if (!userId) {
      return {
        success: false,
        error: 'Invalid or expired reset token',
      };
    }

    // STEP 2: Validate password
    if (!newPassword || newPassword.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters',
      };
    }

    // STEP 3: Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // STEP 4: Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // STEP 5: Update password in database
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));

    logInfo(`Password reset successful for user ${userId}`);

    return {
      success: true,
    };
  } catch (error) {
    logError('Failed to reset password', error as Error);
    return {
      success: false,
      error: 'Internal server error',
    };
  }
}


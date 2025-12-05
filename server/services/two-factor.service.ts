/**
 * Two-Factor Authentication Service
 *
 * Handles TOTP (Time-based One-Time Password) generation and verification.
 * Uses otplib for TOTP operations and encryption for storing secrets.
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from '../lib/encryption';

const APP_NAME = 'BudgetBuddy';

interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  otpauthUrl: string;
}

/**
 * Generate a new 2FA secret and QR code for setup
 */
export async function generateTwoFactorSecret(
  userId: number,
  email: string
): Promise<TwoFactorSetup> {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, APP_NAME, secret);
  const qrCode = await QRCode.toDataURL(otpauthUrl);

  return {
    secret,
    qrCode,
    otpauthUrl,
  };
}

/**
 * Verify a TOTP token against a secret
 */
export function verifyToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

/**
 * Enable 2FA for a user after verifying the initial token
 */
export async function enableTwoFactor(
  userId: number,
  secret: string,
  token: string
): Promise<boolean> {
  // Verify the token first
  if (!verifyToken(token, secret)) {
    return false;
  }

  // Encrypt and store the secret
  const encryptedSecret = encrypt(secret);
  await db
    .update(users)
    .set({
      twoFactorEnabled: true,
      twoFactorSecret: encryptedSecret,
    })
    .where(eq(users.id, userId));

  return true;
}

/**
 * Disable 2FA for a user
 */
export async function disableTwoFactor(
  userId: number,
  token: string
): Promise<boolean> {
  // Get user's encrypted secret
  const [user] = await db
    .select({ twoFactorSecret: users.twoFactorSecret })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.twoFactorSecret) {
    return false;
  }

  // Verify the token
  const secret = decrypt(user.twoFactorSecret);
  if (!verifyToken(token, secret)) {
    return false;
  }

  // Disable 2FA
  await db
    .update(users)
    .set({
      twoFactorEnabled: false,
      twoFactorSecret: null,
    })
    .where(eq(users.id, userId));

  return true;
}

/**
 * Verify 2FA token during login
 */
export async function verifyTwoFactorLogin(
  userId: number,
  token: string
): Promise<boolean> {
  const [user] = await db
    .select({
      twoFactorEnabled: users.twoFactorEnabled,
      twoFactorSecret: users.twoFactorSecret,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.twoFactorEnabled || !user?.twoFactorSecret) {
    return true; // 2FA not enabled, allow login
  }

  const secret = decrypt(user.twoFactorSecret);
  return verifyToken(token, secret);
}

/**
 * Check if user has 2FA enabled
 */
export async function hasTwoFactorEnabled(userId: number): Promise<boolean> {
  const [user] = await db
    .select({ twoFactorEnabled: users.twoFactorEnabled })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user?.twoFactorEnabled ?? false;
}

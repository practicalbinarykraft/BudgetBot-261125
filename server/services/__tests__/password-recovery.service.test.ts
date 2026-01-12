/**
 * Password Recovery Service Tests
 *
 * Tests for password recovery code generation and verification
 * Junior-Friendly: ~200 lines, clear test cases
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { db, pool } from '../../db';
import { users, passwordRecoveryCodes } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { requestPasswordRecovery, verifyRecoveryCode } from '../password-recovery.service';
import { getTelegramBot } from '../../telegram/bot';
import { getUserLanguageByTelegramId } from '../../telegram/language';

// Mock dependencies
vi.mock('../../telegram/bot', () => ({
  getTelegramBot: vi.fn(),
}));

vi.mock('../../telegram/language', () => ({
  getUserLanguageByTelegramId: vi.fn(),
}));

vi.mock('../../lib/logger', () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

describe('Password Recovery Service', () => {
  let testUser: any;
  let mockBot: any;
  let dbAvailable = false;

  beforeAll(async () => {
    // Check if database is available
    try {
      await pool.query('SELECT 1');
      dbAvailable = true;
    } catch {
      dbAvailable = false;
      console.warn('Database not available, skipping integration tests');
    }
  });

  beforeEach(async () => {
    if (!dbAvailable) {
      return; // Skip if DB not available
    }
    // Create test user with Telegram linked
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    const [user] = await db.insert(users).values({
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      telegramId: '123456789',
      telegramUsername: 'testuser',
    }).returning();

    testUser = user;

    // Mock Telegram bot
    mockBot = {
      sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }),
    };
    (getTelegramBot as any).mockReturnValue(mockBot);
    (getUserLanguageByTelegramId as any).mockResolvedValue('en');
  });

  afterEach(async () => {
    if (!dbAvailable) return;
    
    // Cleanup: delete recovery codes and user
    if (testUser) {
      await db.delete(passwordRecoveryCodes).where(eq(passwordRecoveryCodes.userId, testUser.id));
      await db.delete(users).where(eq(users.id, testUser.id));
    }
  });

  describe('requestPasswordRecovery', () => {
    it.skipIf(!dbAvailable)('should generate and send code via Telegram when user has Telegram linked', async () => {
      // Act
      const result = await requestPasswordRecovery(testUser.telegramId!);

      // Assert
      expect(result.success).toBe(true);
      expect(result.method).toBe('telegram');
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        testUser.telegramId,
        expect.stringContaining('Password Recovery'),
        expect.any(Object)
      );

      // Verify code saved in database
      const codes = await db
        .select()
        .from(passwordRecoveryCodes)
        .where(eq(passwordRecoveryCodes.userId, testUser.id));

      expect(codes.length).toBe(1);
      expect(codes[0].code).toMatch(/^\d{6}$/); // 6 digits
      expect(codes[0].used).toBe(false);
    });

    it.skipIf(!dbAvailable)('should find user by email', async () => {
      // Act
      const result = await requestPasswordRecovery(testUser.email!);

      // Assert
      expect(result.success).toBe(true);
      expect(result.method).toBe('telegram');
    });

    it.skipIf(!dbAvailable)('should return error if user not found', async () => {
      // Act
      const result = await requestPasswordRecovery('nonexistent@example.com');

      // Assert
      expect(result.success).toBe(false);
      expect(result.method).toBe('none');
      expect(result.error).toBe('User not found');
    });

    it.skipIf(!dbAvailable)('should return error if no Telegram linked and no email service', async () => {
      // Create user without Telegram
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      const [userWithoutTelegram] = await db.insert(users).values({
        email: 'notelegram@example.com',
        password: hashedPassword,
        name: 'No Telegram User',
        telegramId: null,
      }).returning();

      try {
        // Act
        const result = await requestPasswordRecovery(userWithoutTelegram.email!);

        // Assert
        expect(result.success).toBe(false);
        expect(result.method).toBe('none');
        expect(result.error).toContain('No recovery method available');
      } finally {
        // Cleanup
        await db.delete(users).where(eq(users.id, userWithoutTelegram.id));
      }
    });
  });

  describe('verifyRecoveryCode', () => {
    it.skipIf(!dbAvailable)('should verify valid code and return reset token', async () => {
      // Arrange: Create recovery code
      const code = '123456';
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      await db.insert(passwordRecoveryCodes).values({
        userId: testUser.id,
        code,
        expiresAt,
        used: false,
      });

      // Act
      const result = await verifyRecoveryCode(testUser.telegramId!, code);

      // Assert
      expect(result.success).toBe(true);
      expect(result.resetToken).toBeDefined();
      expect(result.resetToken).toMatch(/^[A-Za-z0-9_-]+$/); // base64url format

      // Verify code marked as used
      const codes = await db
        .select()
        .from(passwordRecoveryCodes)
        .where(
          and(
            eq(passwordRecoveryCodes.userId, testUser.id),
            eq(passwordRecoveryCodes.code, code)
          )
        );

      expect(codes[0].used).toBe(true);
    });

    it.skipIf(!dbAvailable)('should reject expired code', async () => {
      // Arrange: Create expired code
      const code = '123456';
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() - 20); // 20 minutes ago

      await db.insert(passwordRecoveryCodes).values({
        userId: testUser.id,
        code,
        expiresAt,
        used: false,
      });

      // Act
      const result = await verifyRecoveryCode(testUser.telegramId!, code);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired code');
    });

    it.skipIf(!dbAvailable)('should reject used code', async () => {
      // Arrange: Create used code
      const code = '123456';
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      await db.insert(passwordRecoveryCodes).values({
        userId: testUser.id,
        code,
        expiresAt,
        used: true, // Already used
      });

      // Act
      const result = await verifyRecoveryCode(testUser.telegramId!, code);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired code');
    });

    it.skipIf(!dbAvailable)('should reject invalid code', async () => {
      // Act
      const result = await verifyRecoveryCode(testUser.telegramId!, '999999');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired code');
    });

    it.skipIf(!dbAvailable)('should reject code for wrong user', async () => {
      // Create another user
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      const [otherUser] = await db.insert(users).values({
        email: 'other@example.com',
        password: hashedPassword,
        name: 'Other User',
        telegramId: '987654321',
      }).returning();

      try {
        // Create code for other user
        const code = '123456';
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        await db.insert(passwordRecoveryCodes).values({
          userId: otherUser.id,
          code,
          expiresAt,
          used: false,
        });

        // Act: Try to verify with testUser's telegramId
        const result = await verifyRecoveryCode(testUser.telegramId!, code);

        // Assert: Should fail (code belongs to other user)
        expect(result.success).toBe(false);
      } finally {
        // Cleanup
        await db.delete(passwordRecoveryCodes).where(eq(passwordRecoveryCodes.userId, otherUser.id));
        await db.delete(users).where(eq(users.id, otherUser.id));
      }
    });
  });
});


/**
 * Password Reset Service Tests
 *
 * Tests for password reset using reset token
 * Junior-Friendly: ~150 lines, clear test cases
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { db, pool } from '../../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { verifyResetToken, resetPassword } from '../password-reset.service';

// Mock logger
vi.mock('../../lib/logger', () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

describe('Password Reset Service', () => {
  let testUser: any;
  const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
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
    if (!dbAvailable) return;
    
    // Cleanup перед созданием (на случай, если предыдущий тест не очистил)
    try {
      await db.delete(users).where(eq(users.email, 'test@example.com'));
      await db.delete(users).where(eq(users.telegramId, '123456789'));
      // Небольшая задержка для завершения транзакций
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch {}
    
    // Create test user
    const hashedPassword = await bcrypt.hash('oldpassword123', 10);
    const [user] = await db.insert(users).values({
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      telegramId: '123456789',
      isBlocked: false,
    }).returning();

    testUser = user;
  });

  afterEach(async () => {
    if (!dbAvailable) return;
    
    try {
      if (testUser) {
        await db.delete(users).where(eq(users.id, testUser.id));
      }
      // Дополнительный cleanup
      await db.delete(users).where(eq(users.email, 'test@example.com'));
      await db.delete(users).where(eq(users.telegramId, '123456789'));
    } catch {}
  });

  describe('verifyResetToken', () => {
    // verifyResetToken doesn't need DB - it's a pure function
    // Эти тесты не требуют testUser, поэтому они могут выполняться без создания пользователя в БД
    // Используем .skip для beforeEach, если тест не требует БД (но это сложно, поэтому просто убедимся, что cleanup работает)
    it('should verify valid token and return userId', () => {
      // Arrange: Create valid token (use fixed user ID for consistency)
      // Этот тест не требует БД, поэтому не зависит от testUser
      const expectedUserId = 999; // Fixed ID для теста без зависимости от БД
      const timestamp = Date.now();
      const secret = process.env.SESSION_SECRET || 'default-secret-change-in-production';
      const tokenData = `${expectedUserId}:${timestamp}`;
      const hash = crypto
        .createHmac('sha256', secret)
        .update(tokenData)
        .digest('hex');
      const token = Buffer.from(`${tokenData}:${hash}`).toString('base64url');

      // Act
      const userId = verifyResetToken(token);

      // Assert
      expect(userId).toBe(expectedUserId);
    });

    it('should reject expired token', () => {
      // Arrange: Create expired token (2 hours ago)
      // Этот тест не требует БД, поэтому не зависит от testUser
      const testUserId = 999; // Fixed ID для теста без зависимости от БД
      const timestamp = Date.now() - (2 * RESET_TOKEN_EXPIRY_MS);
      const secret = process.env.SESSION_SECRET || 'default-secret-change-in-production';
      const tokenData = `${testUserId}:${timestamp}`;
      const hash = crypto
        .createHmac('sha256', secret)
        .update(tokenData)
        .digest('hex');
      const token = Buffer.from(`${tokenData}:${hash}`).toString('base64url');

      // Act
      const userId = verifyResetToken(token);

      // Assert
      expect(userId).toBeNull();
    });

    it('should reject token with invalid signature', () => {
      // Arrange: Create token with wrong hash
      const testUserId = 999; // Fixed ID для теста без зависимости от БД
      const timestamp = Date.now();
      const tokenData = `${testUserId}:${timestamp}`;
      const wrongHash = 'invalid-hash';
      const token = Buffer.from(`${tokenData}:${wrongHash}`).toString('base64url');

      // Act
      const userId = verifyResetToken(token);

      // Assert
      expect(userId).toBeNull();
    });

    it('should reject malformed token', () => {
      // Act
      const userId = verifyResetToken('invalid-token-format');

      // Assert
      expect(userId).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it.skipIf(!dbAvailable)('should reset password with valid token', async () => {
      // Arrange: Create valid token
      const timestamp = Date.now();
      const secret = process.env.SESSION_SECRET || 'default-secret-change-in-production';
      const tokenData = `${testUser.id}:${timestamp}`;
      const hash = crypto
        .createHmac('sha256', secret)
        .update(tokenData)
        .digest('hex');
      const token = Buffer.from(`${tokenData}:${hash}`).toString('base64url');

      const newPassword = 'newpassword123';

      // Act
      const result = await resetPassword(token, newPassword);

      // Assert
      expect(result.success).toBe(true);

      // Verify password changed
      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, testUser.id))
        .limit(1);

      const isMatch = await bcrypt.compare(newPassword, updatedUser!.password!);
      expect(isMatch).toBe(true);
    });

    it.skipIf(!dbAvailable)('should reject weak password', async () => {
      // Arrange: Create valid token
      const timestamp = Date.now();
      const secret = process.env.SESSION_SECRET || 'default-secret-change-in-production';
      const tokenData = `${testUser.id}:${timestamp}`;
      const hash = crypto
        .createHmac('sha256', secret)
        .update(tokenData)
        .digest('hex');
      const token = Buffer.from(`${tokenData}:${hash}`).toString('base64url');

      // Act
      const result = await resetPassword(token, 'short'); // Too short

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 8 characters');
    });

    it.skipIf(!dbAvailable)('should reject invalid token', async () => {
      // Act
      const result = await resetPassword('invalid-token', 'newpassword123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid or expired');
    });

    it.skipIf(!dbAvailable)('should reject expired token', async () => {
      // Arrange: Create expired token
      const timestamp = Date.now() - (2 * RESET_TOKEN_EXPIRY_MS);
      const secret = process.env.SESSION_SECRET || 'default-secret-change-in-production';
      const tokenData = `${testUser.id}:${timestamp}`;
      const hash = crypto
        .createHmac('sha256', secret)
        .update(tokenData)
        .digest('hex');
      const token = Buffer.from(`${tokenData}:${hash}`).toString('base64url');

      // Act
      const result = await resetPassword(token, 'newpassword123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid or expired');
    });

    it.skipIf(!dbAvailable)('should return error if user not found', async () => {
      // Arrange: Create token for non-existent user
      const timestamp = Date.now();
      const secret = process.env.SESSION_SECRET || 'default-secret-change-in-production';
      const tokenData = `999999:${timestamp}`; // Non-existent user ID
      const hash = crypto
        .createHmac('sha256', secret)
        .update(tokenData)
        .digest('hex');
      const token = Buffer.from(`${tokenData}:${hash}`).toString('base64url');

      // Act
      const result = await resetPassword(token, 'newpassword123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });
});


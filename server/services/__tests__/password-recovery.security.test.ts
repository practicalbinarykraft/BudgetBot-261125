/**
 * Password Recovery Service - Security Tests
 *
 * Tests for SEC-01, SEC-02, SEC-03 security requirements
 *
 * SEC-01: Recovery code is never logged in plaintext
 * SEC-02: JWT signing (SESSION_SECRET) and password reset HMAC (PASSWORD_RESET_SECRET) use different secrets
 * SEC-03: No fallback secret strings exist in production code
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Mock all external dependencies
vi.mock('../../lib/logger', () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

vi.mock('../../db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 1, email: 'test@example.com', telegramId: '123456' }]),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue([]),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

vi.mock('../../telegram/bot', () => ({
  getTelegramBot: vi.fn().mockReturnValue(null),
}));

vi.mock('../../telegram/language', () => ({
  getUserLanguageByTelegramId: vi.fn().mockResolvedValue('en'),
}));

vi.mock('@shared/i18n', () => ({
  t: vi.fn().mockReturnValue('translated text'),
}));

vi.mock('@shared/schema', () => ({
  users: {},
  passwordRecoveryCodes: {},
  User: {},
}));

vi.mock('../../lib/env', () => ({
  env: {
    PASSWORD_RESET_SECRET: 'test-reset-secret-32-characters!!',
  },
}));

describe('Password Recovery Service - Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SEC-01: Recovery code plaintext logging', () => {
    it('should NOT log recovery code in plaintext', async () => {
      const { logInfo } = await import('../../lib/logger');
      const { db } = await import('../../db');

      // Setup: make DB insert resolve and select return user
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, email: 'test@example.com', telegramId: '123456' }]),
          }),
        }),
      } as any);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue([]),
      } as any);

      const { requestPasswordRecovery } = await import('../password-recovery.service');

      // Act: trigger the code generation and saving
      await requestPasswordRecovery('test@example.com');

      // Assert: logInfo should NEVER be called with an object containing 'code' property
      const logInfoMock = vi.mocked(logInfo);
      const callsWithCode = logInfoMock.mock.calls.filter(([_msg, context]) => {
        return context && typeof context === 'object' && 'code' in (context as object);
      });

      expect(callsWithCode).toHaveLength(0);
    });
  });

  describe('SEC-02/SEC-03: Secret separation and no fallback (recovery)', () => {
    it('should use env.PASSWORD_RESET_SECRET instead of process.env.SESSION_SECRET', async () => {
      const { db } = await import('../../db');

      const testUserId = 42;
      const testResetSecret = 'test-reset-secret-32-characters!!';

      // Setup DB mocks to simulate finding user and a valid recovery code
      vi.mocked(db.select)
        // First call: find user by email
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: testUserId, email: 'test@example.com', telegramId: '123456' }]),
            }),
          }),
        } as any)
        // Second call: find recovery code
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{
                id: 1,
                userId: testUserId,
                code: '123456',
                expiresAt: new Date(Date.now() + 900000),
                used: false,
              }]),
            }),
          }),
        } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const { verifyRecoveryCode } = await import('../password-recovery.service');

      // Act
      const result = await verifyRecoveryCode('test@example.com', '123456');

      // Assert: result should be successful
      expect(result.success).toBe(true);
      expect(result.resetToken).toBeDefined();

      // Verify the token was signed with PASSWORD_RESET_SECRET (not SESSION_SECRET)
      const token = result.resetToken!;
      const decoded = Buffer.from(token, 'base64url').toString('utf-8');
      const parts = decoded.split(':');
      const userIdStr = parts[0];
      const timestampStr = parts[1];
      const hash = parts[2];

      // Recompute HMAC using the mocked PASSWORD_RESET_SECRET
      const tokenData = `${userIdStr}:${timestampStr}`;
      const expectedHash = crypto
        .createHmac('sha256', testResetSecret)
        .update(tokenData)
        .digest('hex');

      expect(hash).toBe(expectedHash);
    });

    it('should NOT contain fallback default-secret string in source file', () => {
      const serviceFilePath = path.resolve(
        __dirname,
        '../password-recovery.service.ts'
      );
      const content = fs.readFileSync(serviceFilePath, 'utf-8');

      expect(content).not.toContain('default-secret-change-in-production');
    });
  });
});

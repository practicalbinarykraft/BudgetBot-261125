/**
 * Password Reset Service - Security Tests
 *
 * Tests for SEC-02, SEC-03 security requirements
 *
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
          limit: vi.fn().mockResolvedValue([{ id: 1, email: 'test@example.com' }]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

vi.mock('@shared/schema', () => ({
  users: {},
}));

vi.mock('../../lib/env', () => ({
  env: {
    PASSWORD_RESET_SECRET: 'test-reset-secret-32-characters!!',
  },
}));

describe('Password Reset Service - Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SEC-02/SEC-03: Secret separation and no fallback (reset)', () => {
    it('verifyResetToken should use env.PASSWORD_RESET_SECRET', () => {
      const testUserId = 42;
      const testResetSecret = 'test-reset-secret-32-characters!!';

      // Create a token signed with PASSWORD_RESET_SECRET
      const timestamp = Date.now();
      const tokenData = `${testUserId}:${timestamp}`;
      const hash = crypto
        .createHmac('sha256', testResetSecret)
        .update(tokenData)
        .digest('hex');
      const token = Buffer.from(`${tokenData}:${hash}`).toString('base64url');

      const { verifyResetToken } = require('../password-reset.service');

      // Act: verify the token signed with PASSWORD_RESET_SECRET
      const result = verifyResetToken(token);

      // Assert: should succeed because the service uses PASSWORD_RESET_SECRET
      // Currently uses SESSION_SECRET, so this MUST fail (RED phase)
      expect(result).toBe(testUserId);
    });

    it('should NOT contain fallback default-secret string in source file', () => {
      const serviceFilePath = path.resolve(
        __dirname,
        '../password-reset.service.ts'
      );
      const content = fs.readFileSync(serviceFilePath, 'utf-8');

      expect(content).not.toContain('default-secret-change-in-production');
    });
  });
});

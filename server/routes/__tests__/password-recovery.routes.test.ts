/**
 * Password Recovery Routes Tests
 *
 * Tests for password recovery API endpoints
 * Junior-Friendly: ~250 lines, covers all 3 endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passwordRecoveryRouter from '../password-recovery.routes';
import { requestPasswordRecovery, verifyRecoveryCode } from '../../services/password-recovery.service';
import { resetPassword } from '../../services/password-reset.service';

// Mock services (no real DB needed)
vi.mock('../../services/password-recovery.service', () => ({
  requestPasswordRecovery: vi.fn(),
  verifyRecoveryCode: vi.fn(),
}));

vi.mock('../../services/password-reset.service', () => ({
  resetPassword: vi.fn(),
}));

vi.mock('../../lib/logger', () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

// Mock rate limiter - disable in tests
vi.mock('../../middleware/rate-limit', () => ({
  authRateLimiter: (req: any, res: any, next: any) => next(),
}));

describe('Password Recovery Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    }));
    app.use('/api/auth', passwordRecoveryRouter);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/request-password-recovery', () => {
    it('should return 400 if emailOrTelegramId is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/request-password-recovery')
        .send({})
        .expect(400);

      // Assert
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should return 200 and send code via Telegram', async () => {
      // Arrange
      const telegramId = '123456789';
      (requestPasswordRecovery as any).mockResolvedValue({
        success: true,
        method: 'telegram',
      });

      // Act
      const response = await request(app)
        .post('/api/auth/request-password-recovery')
        .send({ emailOrTelegramId: telegramId })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.method).toBe('telegram');
      expect(requestPasswordRecovery).toHaveBeenCalledWith(telegramId);
    });

    it('should return 400 if recovery request fails', async () => {
      // Arrange
      (requestPasswordRecovery as any).mockResolvedValue({
        success: false,
        method: 'none',
        error: 'User not found',
      });

      // Act
      const response = await request(app)
        .post('/api/auth/request-password-recovery')
        .send({ emailOrTelegramId: 'nonexistent' })
        .expect(400);

      // Assert
      expect(response.body.error).toBe('User not found');
      expect(response.body.method).toBe('none');
    });

    it('should handle service errors', async () => {
      // Arrange
      const telegramId = '123456789';
      (requestPasswordRecovery as any).mockRejectedValue(new Error('Service error'));

      // Act
      const response = await request(app)
        .post('/api/auth/request-password-recovery')
        .send({ emailOrTelegramId: telegramId })
        .expect(500);

      // Assert
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('POST /api/auth/verify-recovery-code', () => {
    it('should return 400 if emailOrTelegramId is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/verify-recovery-code')
        .send({ code: '123456' })
        .expect(400);

      // Assert
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 if code is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/verify-recovery-code')
        .send({ emailOrTelegramId: '123456789' })
        .expect(400);

      // Assert
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 if code is not 6 digits', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/verify-recovery-code')
        .send({ emailOrTelegramId: '123456789', code: '12345' })
        .expect(400);

      // Assert
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 200 and return reset token for valid code', async () => {
      // Arrange
      const telegramId = '123456789';
      const resetToken = 'valid-reset-token';
      (verifyRecoveryCode as any).mockResolvedValue({
        success: true,
        resetToken,
      });

      // Act
      const response = await request(app)
        .post('/api/auth/verify-recovery-code')
        .send({ emailOrTelegramId: telegramId, code: '123456' })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.resetToken).toBe(resetToken);
      expect(verifyRecoveryCode).toHaveBeenCalledWith(telegramId, '123456');
    });

    it('should return 400 for invalid code', async () => {
      // Arrange
      (verifyRecoveryCode as any).mockResolvedValue({
        success: false,
        error: 'Invalid or expired code',
      });

      // Act
      const response = await request(app)
        .post('/api/auth/verify-recovery-code')
        .send({ emailOrTelegramId: '123456789', code: '999999' })
        .expect(400);

      // Assert
      expect(response.body.error).toBe('Invalid or expired code');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should return 400 if token is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ newPassword: 'newpassword123' })
        .expect(400);

      // Assert
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 if password is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid-token' })
        .expect(400);

      // Assert
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 if password is too short', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid-token', newPassword: 'short' })
        .expect(400);

      // Assert
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 200 and reset password for valid token', async () => {
      // Arrange
      (resetPassword as any).mockResolvedValue({
        success: true,
      });

      // Act
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid-token', newPassword: 'newpassword123' })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(resetPassword).toHaveBeenCalledWith('valid-token', 'newpassword123');
    });

    it('should return 400 for invalid token', async () => {
      // Arrange
      (resetPassword as any).mockResolvedValue({
        success: false,
        error: 'Invalid or expired reset token',
      });

      // Act
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalid-token', newPassword: 'newpassword123' })
        .expect(400);

      // Assert
      expect(response.body.error).toBe('Invalid or expired reset token');
    });
  });
});


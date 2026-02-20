/**
 * Mobile Auth Middleware Tests
 *
 * Junior-Friendly Guide:
 * =====================
 * Эти тесты проверяют работу JWT middleware для мобильного приложения.
 * Тесты проверяют обработку всех типов JWT ошибок: TokenExpiredError,
 * NotBeforeError, JsonWebTokenError, а также не-JWT ошибок.
 *
 * Запуск:
 *   npm test server/middleware/__tests__/mobile-auth.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Set required env before module load
process.env.SESSION_SECRET = 'test-secret-for-unit-tests';

// Mock user repository
vi.mock('../../repositories/user.repository', () => ({
  userRepository: {
    getUserById: vi.fn(),
  },
}));

// Import real jwt to get error classes and spy on verify
import jwt from 'jsonwebtoken';
import { withMobileAuth } from '../mobile-auth';

describe('withMobileAuth middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: ReturnType<typeof vi.fn>;
  let jwtVerifySpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Spy on jwt.verify — this is what verifyMobileToken calls internally
    jwtVerifySpy = vi.spyOn(jwt, 'verify');

    mockReq = {
      headers: { authorization: 'Bearer test-token' },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    jwtVerifySpy.mockRestore();
  });

  it('returns 401 with "Token expired" for TokenExpiredError (BUG-04)', async () => {
    jwtVerifySpy.mockImplementation(() => {
      throw new jwt.TokenExpiredError('jwt expired', new Date(0));
    });

    const handler = vi.fn();
    const middleware = withMobileAuth(handler);
    await middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Token expired' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 with "Token not yet valid" for NotBeforeError (BUG-04)', async () => {
    jwtVerifySpy.mockImplementation(() => {
      throw new jwt.NotBeforeError('jwt not active', new Date(Date.now() + 60000));
    });

    const handler = vi.fn();
    const middleware = withMobileAuth(handler);
    await middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Token not yet valid' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 with "Invalid token" for generic JsonWebTokenError (BUG-04)', async () => {
    // Use a plain JsonWebTokenError (not a subclass instance)
    jwtVerifySpy.mockImplementation(() => {
      throw new jwt.JsonWebTokenError('invalid signature');
    });

    const handler = vi.fn();
    const middleware = withMobileAuth(handler);
    await middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('calls next(error) for non-JWT errors', async () => {
    const dbError = new Error('db failed');
    jwtVerifySpy.mockImplementation(() => {
      throw dbError;
    });

    const handler = vi.fn();
    const middleware = withMobileAuth(handler);
    await middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(dbError);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
});

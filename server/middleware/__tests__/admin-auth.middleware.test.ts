/**
 * Admin Auth Middleware Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Эти тесты проверяют работу middleware для авторизации админов.
 * Тесты проверяют requireAdmin, requirePermission, requireRole.
 * 
 * Запуск:
 *   npm test server/middleware/__tests__/admin-auth.middleware.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  requireAdmin,
  requirePermission,
  requireRole,
  AdminRequest,
} from '../admin-auth.middleware';
import { findAdminById } from '../../services/admin-auth.service';

// Mock admin auth service
vi.mock('../../services/admin-auth.service', () => ({
  findAdminById: vi.fn(),
}));

// Mock logger
vi.mock('../../lib/logger', () => ({
  logError: vi.fn(),
}));

describe('Admin Auth Middleware', () => {
  let mockReq: Partial<AdminRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      session: {} as any,
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe('requireAdmin', () => {
    it('should call next() when admin is authenticated', async () => {
      const mockAdmin = {
        id: 1,
        email: 'admin@example.com',
        role: 'super_admin',
        permissions: ['users.read'],
        isActive: true,
      };

      (mockReq.session as any).adminId = 1;
      (findAdminById as any).mockResolvedValue(mockAdmin);

      await requireAdmin(
        mockReq as AdminRequest,
        mockRes as Response,
        mockNext
      );

      expect(findAdminById).toHaveBeenCalledWith(1);
      expect(mockReq.admin).toEqual({
        id: 1,
        email: 'admin@example.com',
        role: 'super_admin',
        permissions: ['users.read'],
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when no session', async () => {
      mockReq.session = undefined;

      await requireAdmin(
        mockReq as AdminRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized: No session',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when no adminId in session', async () => {
      (mockReq.session as any).adminId = undefined;

      await requireAdmin(
        mockReq as AdminRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Not an admin session',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when admin not found', async () => {
      (mockReq.session as any).adminId = 999;
      (findAdminById as any).mockResolvedValue(null);

      await requireAdmin(
        mockReq as AdminRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized: Admin not found',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when admin is inactive', async () => {
      const mockAdmin = {
        id: 1,
        email: 'admin@example.com',
        role: 'support',
        permissions: [],
        isActive: false,
      };

      (mockReq.session as any).adminId = 1;
      (findAdminById as any).mockResolvedValue(mockAdmin);

      await requireAdmin(
        mockReq as AdminRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Forbidden: Admin account is inactive',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    it('should call next() when admin has permission', () => {
      mockReq.admin = {
        id: 1,
        email: 'admin@example.com',
        role: 'support',
        permissions: ['users.read', 'users.write'],
      };

      const middleware = requirePermission('users.read');
      middleware(
        mockReq as AdminRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 when admin lacks permission', () => {
      mockReq.admin = {
        id: 1,
        email: 'admin@example.com',
        role: 'support',
        permissions: ['users.read'],
      };

      const middleware = requirePermission('users.write');
      middleware(
        mockReq as AdminRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Missing permission: users.write',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow super_admin to access everything', () => {
      mockReq.admin = {
        id: 1,
        email: 'admin@example.com',
        role: 'super_admin',
        permissions: [],
      };

      const middleware = requirePermission('any.permission');
      middleware(
        mockReq as AdminRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when admin not authenticated', () => {
      mockReq.admin = undefined;

      const middleware = requirePermission('users.read');
      middleware(
        mockReq as AdminRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should call next() when admin has required role', () => {
      mockReq.admin = {
        id: 1,
        email: 'admin@example.com',
        role: 'support',
        permissions: [],
      };

      const middleware = requireRole('support', 'analyst');
      middleware(
        mockReq as AdminRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 when admin lacks required role', () => {
      mockReq.admin = {
        id: 1,
        email: 'admin@example.com',
        role: 'readonly',
        permissions: [],
      };

      const middleware = requireRole('super_admin', 'support');
      middleware(
        mockReq as AdminRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Required role: super_admin or support',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when admin not authenticated', () => {
      mockReq.admin = undefined;

      const middleware = requireRole('support');
      middleware(
        mockReq as AdminRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});


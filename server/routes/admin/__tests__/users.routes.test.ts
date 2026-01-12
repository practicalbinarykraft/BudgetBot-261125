/**
 * Admin Users Routes Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для роутов управления пользователями
 * 
 * Запуск:
 *   npm test server/routes/admin/__tests__/users.routes.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import usersRouter from '../users.routes';
import {
  getUsersList,
  getUserDetails,
  getUserTransactions,
  getUserTimeline,
} from '../../../services/admin-users.service';
import { userRepository } from '../../../repositories/user.repository';
import { grantMessages } from '../../../services/credits.service';

// Mock services
vi.mock('../../../services/admin-users.service', () => ({
  getUsersList: vi.fn(),
  getUserDetails: vi.fn(),
  getUserTransactions: vi.fn(),
  getUserTimeline: vi.fn(),
}));

vi.mock('../../../repositories/user.repository', () => ({
  userRepository: {
    update: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('../../../services/credits.service', () => ({
  grantMessages: vi.fn(),
}));

vi.mock('../../../services/admin-audit-log.service', () => ({
  logAdminAction: vi.fn(),
}));

// Mock admin auth middleware
const mockAdmin = {
  id: 1,
  email: 'admin@example.com',
  role: 'super_admin',
  permissions: [],
};

vi.mock('../../../middleware/admin-auth.middleware', () => ({
  requireAdmin: (req: any, res: any, next: any) => {
    req.admin = mockAdmin;
    next();
  },
  AdminRequest: {},
}));

vi.mock('../../../lib/logger', () => ({
  logError: vi.fn(),
}));

describe('Admin Users Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    }));
    app.use('/api/admin/users', usersRouter);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/users', () => {
    it('should return users list', async () => {
      const mockUsers = {
        users: [{ id: 1, email: 'user@example.com', name: 'User' }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      (getUsersList as any).mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/admin/users')
        .expect(200);

      expect(response.body).toEqual(mockUsers);
      expect(getUsersList).toHaveBeenCalled();
    });

    it('should return 400 for invalid query params', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=invalid')
        .expect(400);

      expect(response.body.error).toBe('Invalid query parameters');
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should return user details', async () => {
      const mockUser = { id: 1, email: 'user@example.com', name: 'User' };
      (getUserDetails as any).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/admin/users/1')
        .expect(200);

      expect(response.body).toEqual(mockUser);
      expect(getUserDetails).toHaveBeenCalledWith(1);
    });

    it('should return 500 on error', async () => {
      (getUserDetails as any).mockRejectedValue(new Error('Not found'));

      const response = await request(app)
        .get('/api/admin/users/999')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/admin/users/:id/transactions', () => {
    it('should return user transactions', async () => {
      const mockTransactions = {
        transactions: [{ id: 1, amount: 100 }],
        total: 1,
      };
      (getUserTransactions as any).mockResolvedValue(mockTransactions);

      const response = await request(app)
        .get('/api/admin/users/1/transactions')
        .expect(200);

      expect(response.body).toEqual(mockTransactions);
    });
  });

  describe('GET /api/admin/users/:id/timeline', () => {
    it('should return user timeline', async () => {
      const mockTimeline = [{ type: 'signup', timestamp: new Date() }];
      (getUserTimeline as any).mockResolvedValue(mockTimeline);

      const response = await request(app)
        .get('/api/admin/users/1/timeline')
        .expect(200);

      expect(response.body).toEqual(mockTimeline);
    });
  });
});

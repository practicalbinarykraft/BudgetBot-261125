/**
 * Admin Audit Log Routes Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для роутов журнала аудита
 * 
 * Запуск:
 *   npm test server/routes/admin/__tests__/audit-log.routes.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import auditLogRouter from '../audit-log.routes';
import { getRecentAuditLogs, getUserAuditLogs } from '../../../services/audit-log.service';

// Mock services
vi.mock('../../../services/audit-log.service', () => ({
  getRecentAuditLogs: vi.fn(),
  getUserAuditLogs: vi.fn(),
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

describe('Admin Audit Log Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    }));
    app.use('/api/admin/audit-logs', auditLogRouter);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/audit-logs', () => {
    it('should return recent audit logs', async () => {
      const mockLogs = {
        logs: [{ id: 1, action: 'login', userId: 1 }],
        total: 1,
      };
      (getRecentAuditLogs as any).mockResolvedValue(mockLogs);

      const response = await request(app)
        .get('/api/admin/audit-logs')
        .expect(200);

      expect(response.body).toEqual(mockLogs);
      expect(getRecentAuditLogs).toHaveBeenCalled();
    });

    it('should return user audit logs when userId provided', async () => {
      const mockLogs = {
        logs: [{ id: 1, action: 'login', userId: 123 }],
        total: 1,
      };
      (getUserAuditLogs as any).mockResolvedValue(mockLogs);

      const response = await request(app)
        .get('/api/admin/audit-logs?userId=123')
        .expect(200);

      expect(response.body).toEqual(mockLogs);
      expect(getUserAuditLogs).toHaveBeenCalled();
    });

    it('should return 400 for invalid userId', async () => {
      const response = await request(app)
        .get('/api/admin/audit-logs?userId=invalid')
        .expect(400);

      expect(response.body.error).toBe('Invalid query parameters');
    });
  });
});

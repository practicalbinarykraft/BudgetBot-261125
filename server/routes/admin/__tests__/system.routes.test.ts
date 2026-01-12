/**
 * Admin System Routes Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для роутов системы
 * 
 * Запуск:
 *   npm test server/routes/admin/__tests__/system.routes.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import systemRouter from '../system.routes';
import { getSystemHealth } from '../../../services/admin-system-health.service';

// Mock services
vi.mock('../../../services/admin-system-health.service', () => ({
  getSystemHealth: vi.fn(),
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

describe('Admin System Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    }));
    app.use('/api/admin/system', systemRouter);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/system/health', () => {
    it('should return system health', async () => {
      const mockHealth = {
        api: {
          uptime: 86400,
          uptimePercent: 99.9,
          avgResponseTime: 120,
          errorRate: 0.1,
          requests24h: 45000,
        },
        database: {
          status: 'healthy',
          connections: 10,
          maxConnections: 100,
        },
      };
      (getSystemHealth as any).mockResolvedValue(mockHealth);

      const response = await request(app)
        .get('/api/admin/system/health')
        .expect(200);

      expect(response.body).toEqual(mockHealth);
      expect(getSystemHealth).toHaveBeenCalled();
    });

    it('should return 500 on error', async () => {
      (getSystemHealth as any).mockRejectedValue(new Error('Health check failed'));

      const response = await request(app)
        .get('/api/admin/system/health')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });
});

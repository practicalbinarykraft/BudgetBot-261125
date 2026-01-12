/**
 * Admin Broadcasts Routes Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для роутов рассылок
 * 
 * Запуск:
 *   npm test server/routes/admin/__tests__/broadcasts.routes.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import broadcastsRouter from '../broadcasts.routes';
import {
  getBroadcastsList,
  getBroadcastDetails,
  createBroadcast,
  sendBroadcast,
  getBroadcastTemplates,
} from '../../../services/admin-broadcasts.service';

// Mock services
vi.mock('../../../services/admin-broadcasts.service', () => ({
  getBroadcastsList: vi.fn(),
  getBroadcastDetails: vi.fn(),
  createBroadcast: vi.fn(),
  sendBroadcast: vi.fn(),
  getBroadcastTemplates: vi.fn(),
  createBroadcastTemplate: vi.fn(),
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

describe('Admin Broadcasts Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    }));
    app.use('/api/admin/broadcasts', broadcastsRouter);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/broadcasts', () => {
    it('should return broadcasts list', async () => {
      const mockBroadcasts = {
        broadcasts: [{ id: 1, title: 'Test' }],
        total: 1,
      };
      (getBroadcastsList as any).mockResolvedValue(mockBroadcasts);

      const response = await request(app)
        .get('/api/admin/broadcasts')
        .expect(200);

      expect(response.body).toEqual(mockBroadcasts);
    });
  });

  describe('POST /api/admin/broadcasts', () => {
    it('should create broadcast', async () => {
      const mockBroadcast = { id: 1, title: 'Test', message: 'Message' };
      (createBroadcast as any).mockResolvedValue(mockBroadcast);

      const response = await request(app)
        .post('/api/admin/broadcasts')
        .send({
          title: 'Test',
          message: 'Message',
          targetSegment: 'all',
        })
        .expect(200);

      expect(response.body).toEqual(mockBroadcast);
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/admin/broadcasts')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/admin/broadcasts/templates', () => {
    it('should return templates', async () => {
      const mockTemplates = [{ id: 1, name: 'Template' }];
      (getBroadcastTemplates as any).mockResolvedValue(mockTemplates);

      const response = await request(app)
        .get('/api/admin/broadcasts/templates')
        .expect(200);

      expect(response.body).toEqual(mockTemplates);
    });
  });
});

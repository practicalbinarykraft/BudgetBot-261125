/**
 * Admin Metrics Routes Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для роутов метрик
 * 
 * Запуск:
 *   npm test server/routes/admin/__tests__/metrics.routes.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import metricsRouter from '../metrics.routes';
import {
  getHeroMetrics,
  getGrowthMetrics,
  getRevenueMetrics,
  getCohortRetention,
  clearMetricsCache,
} from '../../../services/admin-metrics.service';

// Mock services
vi.mock('../../../services/admin-metrics.service', () => ({
  getHeroMetrics: vi.fn(),
  getGrowthMetrics: vi.fn(),
  getRevenueMetrics: vi.fn(),
  getCohortRetention: vi.fn(),
  clearMetricsCache: vi.fn(),
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

describe('Admin Metrics Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    }));
    app.use('/api/admin/metrics', metricsRouter);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/metrics/hero', () => {
    it('should return hero metrics', async () => {
      const mockMetrics = {
        totalUsers: { current: 100, activeToday: 50 },
        mrr: { current: 1000 },
      };
      (getHeroMetrics as any).mockResolvedValue(mockMetrics);

      const response = await request(app)
        .get('/api/admin/metrics/hero')
        .expect(200);

      expect(response.body).toEqual(mockMetrics);
      expect(getHeroMetrics).toHaveBeenCalled();
    });
  });

  describe('GET /api/admin/metrics/growth', () => {
    it('should return growth metrics', async () => {
      const mockMetrics = {
        userGrowth: { mau: 100, dau: 50 },
      };
      (getGrowthMetrics as any).mockResolvedValue(mockMetrics);

      const response = await request(app)
        .get('/api/admin/metrics/growth')
        .expect(200);

      expect(response.body).toEqual(mockMetrics);
    });
  });

  describe('GET /api/admin/metrics/revenue', () => {
    it('should return revenue metrics', async () => {
      const mockMetrics = {
        mrr: { total: 1000 },
      };
      (getRevenueMetrics as any).mockResolvedValue(mockMetrics);

      const response = await request(app)
        .get('/api/admin/metrics/revenue')
        .expect(200);

      expect(response.body).toEqual(mockMetrics);
    });
  });

  describe('GET /api/admin/metrics/cohort-retention', () => {
    it('should return cohort retention data', async () => {
      const mockData = [
        {
          cohortMonth: '2025-01',
          usersCount: 100,
          retention: { month0: 100, month1: 80 },
        },
      ];
      (getCohortRetention as any).mockResolvedValue(mockData);

      const response = await request(app)
        .get('/api/admin/metrics/cohort-retention')
        .expect(200);

      expect(response.body).toEqual(mockData);
    });
  });

  describe('POST /api/admin/metrics/clear-cache', () => {
    it('should clear metrics cache', async () => {
      (clearMetricsCache as any).mockReturnValue(undefined);

      const response = await request(app)
        .post('/api/admin/metrics/clear-cache')
        .expect(200);

      expect(response.body).toEqual({ success: true });
      expect(clearMetricsCache).toHaveBeenCalled();
    });
  });
});

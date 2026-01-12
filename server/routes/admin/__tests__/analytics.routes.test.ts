/**
 * Admin Analytics Routes Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для роутов аналитики админ-панели
 * 
 * Запуск:
 *   npm test server/routes/admin/__tests__/analytics.routes.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import analyticsRouter from '../analytics.routes';
import {
  getFunnelAnalysis,
  getFeatureAdoption,
  getUserSegments,
} from '../../../services/admin-analytics.service';

// Mock services
vi.mock('../../../services/admin-analytics.service', () => ({
  getFunnelAnalysis: vi.fn(),
  getFeatureAdoption: vi.fn(),
  getUserSegments: vi.fn(),
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

describe('Admin Analytics Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    }));
    app.use('/api/admin/analytics', analyticsRouter);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/analytics/funnel', () => {
    it('should return funnel analysis', async () => {
      const mockFunnel = {
        steps: [
          { step: 'signup', count: 100, conversionRate: 100, avgTimeToComplete: 0 },
          { step: 'first_transaction', count: 80, conversionRate: 80, avgTimeToComplete: 2.5 },
        ],
        totalUsers: 100,
        overallConversion: 40,
      };

      (getFunnelAnalysis as any).mockResolvedValue(mockFunnel);

      const response = await request(app)
        .get('/api/admin/analytics/funnel')
        .expect(200);

      expect(response.body).toEqual(mockFunnel);
      expect(getFunnelAnalysis).toHaveBeenCalled();
    });

    it('should return 500 on error', async () => {
      (getFunnelAnalysis as any).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/admin/analytics/funnel')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/admin/analytics/feature-adoption', () => {
    it('should return feature adoption data', async () => {
      const mockAdoption = {
        features: [
          {
            feature: 'transactions',
            usersCount: 100,
            adoptionRate: 80,
            totalUsage: 5000,
            avgUsagePerUser: 50,
          },
        ],
        totalUsers: 125,
      };

      (getFeatureAdoption as any).mockResolvedValue(mockAdoption);

      const response = await request(app)
        .get('/api/admin/analytics/feature-adoption')
        .expect(200);

      expect(response.body).toEqual(mockAdoption);
      expect(getFeatureAdoption).toHaveBeenCalled();
    });

    it('should return 500 on error', async () => {
      (getFeatureAdoption as any).mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/api/admin/analytics/feature-adoption')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/admin/analytics/user-segments', () => {
    it('should return user segments', async () => {
      const mockSegments = {
        segments: [
          {
            segment: 'new_users',
            count: 20,
            percentage: 16,
            description: 'Зарегистрировались за последние 30 дней',
          },
        ],
        totalUsers: 125,
      };

      (getUserSegments as any).mockResolvedValue(mockSegments);

      const response = await request(app)
        .get('/api/admin/analytics/user-segments')
        .expect(200);

      expect(response.body).toEqual(mockSegments);
      expect(getUserSegments).toHaveBeenCalled();
    });

    it('should return 500 on error', async () => {
      (getUserSegments as any).mockRejectedValue(new Error('Query error'));

      const response = await request(app)
        .get('/api/admin/analytics/user-segments')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });
});

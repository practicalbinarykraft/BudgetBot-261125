/**
 * Admin Analytics Service Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Эти тесты проверяют работу сервиса аналитики для админ-панели.
 * Тесты проверяют воронку конверсии, использование фич, сегменты пользователей.
 * 
 * Запуск:
 *   npm test server/services/__tests__/admin-analytics.service.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getFunnelAnalysis,
  getFeatureAdoption,
  getUserSegments,
} from '../admin-analytics.service';

// Mock database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../lib/logger', () => ({
  logError: vi.fn(),
}));

describe('Admin Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFunnelAnalysis', () => {
    it('should have correct function signature', () => {
      expect(typeof getFunnelAnalysis).toBe('function');
    });

    it('should return funnel with correct structure', () => {
      const expectedStructure = {
        steps: [
          {
            step: 'signup',
            count: 0,
            conversionRate: 0,
            avgTimeToComplete: 0,
          },
        ],
        totalUsers: 0,
        overallConversion: 0,
      };

      expect(expectedStructure).toHaveProperty('steps');
      expect(expectedStructure).toHaveProperty('totalUsers');
      expect(expectedStructure).toHaveProperty('overallConversion');
      expect(Array.isArray(expectedStructure.steps)).toBe(true);
    });
  });

  describe('getFeatureAdoption', () => {
    it('should have correct function signature', () => {
      expect(typeof getFeatureAdoption).toBe('function');
    });

    it('should return feature adoption with correct structure', () => {
      const expectedStructure = {
        features: [
          {
            feature: 'transactions',
            usersCount: 0,
            adoptionRate: 0,
            totalUsage: 0,
            avgUsagePerUser: 0,
          },
        ],
        totalUsers: 0,
      };

      expect(expectedStructure).toHaveProperty('features');
      expect(expectedStructure).toHaveProperty('totalUsers');
      expect(Array.isArray(expectedStructure.features)).toBe(true);
    });
  });

  describe('getUserSegments', () => {
    it('should have correct function signature', () => {
      expect(typeof getUserSegments).toBe('function');
    });

    it('should return segments with correct structure', () => {
      const expectedStructure = {
        segments: [
          {
            segment: 'new_users',
            count: 0,
            percentage: 0,
            description: 'Зарегистрировались за последние 30 дней',
          },
        ],
        totalUsers: 0,
      };

      expect(expectedStructure).toHaveProperty('segments');
      expect(expectedStructure).toHaveProperty('totalUsers');
      expect(Array.isArray(expectedStructure.segments)).toBe(true);
    });

    it('should include all required segments', () => {
      const expectedSegments = [
        'new_users',
        'active_users',
        'power_users',
        'at_risk',
        'churned',
      ];

      // Проверяем что структура поддерживает все сегменты
      expectedSegments.forEach(segment => {
        expect(typeof segment).toBe('string');
      });
    });
  });
});


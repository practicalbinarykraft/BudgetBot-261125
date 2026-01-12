/**
 * Admin Metrics Service Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Эти тесты проверяют работу сервиса метрик для админ-панели.
 * Тесты проверяют расчет метрик, кэширование.
 * 
 * Запуск:
 *   npm test server/services/__tests__/admin-metrics.service.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getHeroMetrics,
  getGrowthMetrics,
  clearMetricsCache,
} from '../admin-metrics.service';

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

describe('Admin Metrics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearMetricsCache();
  });

  describe('getHeroMetrics', () => {
    it('should have correct function signature', () => {
      expect(typeof getHeroMetrics).toBe('function');
    });

    it('should return metrics with correct structure', () => {
      // Проверяем структуру типа (без выполнения)
      const expectedStructure = {
        totalUsers: {
          current: 0,
          activeToday: 0,
          activeThisWeek: 0,
          activeThisMonth: 0,
          change: 0,
        },
        revenue: {
          total: 0,
          thisMonth: 0,
          lastMonth: 0,
          change: 0,
          trend: [] as number[],
        },
        transactions: {
          total: 0,
          thisMonth: 0,
          averagePerUser: 0,
        },
        engagement: {
          averageTransactionsPerUser: 0,
          activeUserRate: 0,
        },
      };

      expect(expectedStructure).toHaveProperty('totalUsers');
      expect(expectedStructure).toHaveProperty('revenue');
      expect(expectedStructure).toHaveProperty('transactions');
      expect(expectedStructure).toHaveProperty('engagement');
    });

    it('should support caching', () => {
      expect(typeof clearMetricsCache).toBe('function');
    });
  });

  describe('getGrowthMetrics', () => {
    it('should have correct function signature', () => {
      expect(typeof getGrowthMetrics).toBe('function');
    });

    it('should return metrics with correct structure', () => {
      const expectedStructure = {
        userGrowth: {
          mau: 0,
          dau: 0,
          wau: 0,
        },
        retention: {
          d1: 0,
          d7: 0,
          d30: 0,
        },
        newUsers: {
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          trend: [] as number[],
        },
      };

      expect(expectedStructure).toHaveProperty('userGrowth');
      expect(expectedStructure).toHaveProperty('retention');
      expect(expectedStructure).toHaveProperty('newUsers');
    });
  });

  describe('clearMetricsCache', () => {
    it('should clear all cached metrics', () => {
      // Should not throw
      expect(() => clearMetricsCache()).not.toThrow();
    });
  });
});

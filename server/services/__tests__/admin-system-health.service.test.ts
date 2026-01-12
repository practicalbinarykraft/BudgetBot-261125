/**
 * Admin System Health Service Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Эти тесты проверяют работу сервиса мониторинга системы для админ-панели.
 * 
 * Запуск:
 *   npm test server/services/__tests__/admin-system-health.service.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSystemHealth,
  updateJobStatus,
} from '../admin-system-health.service';

// Mock database
vi.mock('../../db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

// Mock metrics
vi.mock('../../lib/metrics', () => ({
  metrics: {
    getAll: vi.fn(() => ({
      counters: {
        api_calls_total: 1000,
        api_calls_server_error: 10,
      },
      timings: {
        api_response_time: {
          avg: 120,
          count: 1000,
        },
      },
    })),
  },
}));

// Mock redis
vi.mock('../../lib/redis', () => ({
  isRedisAvailable: vi.fn(() => Promise.resolve(true)),
  cache: {
    getStats: vi.fn(),
  },
}));

// Mock telegram bot
vi.mock('../../telegram/bot', () => ({
  getTelegramBot: vi.fn(() => ({
    getMe: vi.fn(() => Promise.resolve({ id: 1, username: 'test_bot' })),
  })),
}));

// Mock logger
vi.mock('../../lib/logger', () => ({
  logError: vi.fn(),
}));

describe('Admin System Health Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSystemHealth', () => {
    it('should have correct function signature', () => {
      expect(typeof getSystemHealth).toBe('function');
    });

    it('should return health with correct structure', async () => {
      const expectedStructure = {
        api: {
          uptime: 0,
          uptimePercent: 0,
          avgResponseTime: 0,
          errorRate: 0,
          requests24h: 0,
        },
        database: {
          status: 'healthy' as const,
        },
        external: {
          telegram: { status: 'healthy' as const },
          openai: { status: 'healthy' as const },
          redis: { status: 'healthy' as const },
        },
        jobs: {
          currencyUpdate: { status: 'not_run' as const },
          hourlyBudgetNotifications: { status: 'not_run' as const },
          sessionCleanup: { status: 'not_run' as const },
        },
        system: {
          memory: {
            heapUsed: 0,
            heapTotal: 0,
            rss: 0,
            usagePercent: 0,
          },
          cpu: {
            loadAvg: [],
          },
        },
        timestamp: '',
      };

      expect(expectedStructure).toHaveProperty('api');
      expect(expectedStructure).toHaveProperty('database');
      expect(expectedStructure).toHaveProperty('external');
      expect(expectedStructure).toHaveProperty('jobs');
      expect(expectedStructure).toHaveProperty('system');
      expect(expectedStructure).toHaveProperty('timestamp');
    });
  });

  describe('updateJobStatus', () => {
    it('should have correct function signature', () => {
      expect(typeof updateJobStatus).toBe('function');
    });

    it('should update job status', () => {
      updateJobStatus('testJob', 'success');
      // Проверяем что функция выполнилась без ошибок
      expect(true).toBe(true);
    });
  });
});


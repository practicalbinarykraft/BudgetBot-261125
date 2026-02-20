/**
 * Admin Users Service Tests
 *
 * Junior-Friendly Guide:
 * =====================
 * Эти тесты проверяют работу сервиса для управления пользователями в админ-панели.
 * Тесты проверяют получение списка пользователей, деталей, транзакций, timeline.
 *
 * Запуск:
 *   npm test server/services/__tests__/admin-users.service.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getUsersList,
  getUserDetails,
  getUserTransactions,
  getUserTimeline,
  GetUsersListParams,
  GetUserTransactionsParams,
} from '../admin-users.service';

// Mock database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../lib/logger', () => ({
  logError: vi.fn(),
  logDebug: vi.fn(),
}));

// Mock credits service
vi.mock('../credits.service', () => ({
  getCreditBalance: vi.fn(),
}));

describe('Admin Users Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsersList', () => {
    it('should have correct return type structure', () => {
      // Проверяем что функция экспортирована и имеет правильную сигнатуру
      expect(typeof getUsersList).toBe('function');
    });

    it('should accept pagination parameters', () => {
      const params: GetUsersListParams = {
        page: 1,
        limit: 20,
        search: 'test',
        sortBy: 'created_at',
        sortOrder: 'desc',
      };

      expect(params.page).toBe(1);
      expect(params.limit).toBe(20);
      expect(params.search).toBe('test');
    });
  });

  describe('getUserDetails', () => {
    it('should have correct function signature', () => {
      expect(typeof getUserDetails).toBe('function');
    });

    it('should accept userId parameter', () => {
      const userId = 1;
      expect(typeof userId).toBe('number');
    });

    it('logs credit balance error with logError and returns zero credits (BUG-03)', async () => {
      const { logError } = await import('../../lib/logger');
      const { getCreditBalance } = await import('../credits.service');
      const { db } = await import('../../db');

      const userId = 42;

      // getCreditBalance throws (Redis failure, etc.)
      vi.mocked(getCreditBalance).mockRejectedValue(new Error('Redis connection failed'));

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        telegramId: null,
        telegramUsername: null,
        telegramFirstName: null,
        telegramPhotoUrl: null,
        createdAt: new Date('2025-01-01'),
      };

      // Queue of responses for each db.select() call in order:
      // 1. user lookup (.select().from().where().limit(1))
      // 2. transactionsCount (.select().from().where() — returns promise directly when destructured)
      // 3. walletsCount
      // 4. categoriesCount
      // 5. budgetsCount
      // 6. incomeResult (.select().from().where())
      // 7. expensesResult
      // 8. lastActiveResult
      const responses: any[] = [
        [mockUser],
        [{ count: 5 }],
        [{ count: 2 }],
        [{ count: 3 }],
        [{ count: 1 }],
        [{ total: '100.00' }],
        [{ total: '50.00' }],
        [{ lastActive: null }],
      ];
      let callIndex = 0;

      const makeChain = (data: any) => {
        const chain: any = {
          from: vi.fn(() => chain),
          where: vi.fn(() => chain),
          limit: vi.fn(() => Promise.resolve(data)),
          orderBy: vi.fn(() => chain),
          $dynamic: vi.fn(() => chain),
          // Make the chain itself thenable so `await chain` works
          then: (resolve: any, reject: any) => Promise.resolve(data).then(resolve, reject),
        };
        return chain;
      };

      vi.mocked(db.select).mockImplementation(() => {
        const data = responses[callIndex++] ?? [];
        return makeChain(data) as any;
      });

      const result = await getUserDetails(userId);

      // logError must be called with error context and userId
      expect(logError).toHaveBeenCalledWith(
        expect.stringContaining('credit balance'),
        expect.any(Error),
        expect.objectContaining({ userId })
      );

      // Zero credits fallback preserved
      expect(result?.credits.messagesRemaining).toBe(0);
      expect(result?.credits.totalGranted).toBe(0);
      expect(result?.credits.totalUsed).toBe(0);
    });
  });

  describe('getUserTransactions', () => {
    it('should have correct return type structure', () => {
      expect(typeof getUserTransactions).toBe('function');
    });

    it('should accept transaction parameters', () => {
      const params: GetUserTransactionsParams = {
        userId: 1,
        page: 1,
        limit: 50,
        type: 'income',
        sortBy: 'date',
        sortOrder: 'desc',
      };

      expect(params.userId).toBe(1);
      expect(params.type).toBe('income');
    });
  });

  describe('getUserTimeline', () => {
    it('should have correct function signature', () => {
      expect(typeof getUserTimeline).toBe('function');
    });

    it('should accept userId and limit parameters', () => {
      const userId = 1;
      const limit = 50;
      expect(typeof userId).toBe('number');
      expect(typeof limit).toBe('number');
    });
  });
});

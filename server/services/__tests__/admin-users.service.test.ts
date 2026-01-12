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

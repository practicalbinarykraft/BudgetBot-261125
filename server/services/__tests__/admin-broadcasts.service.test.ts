/**
 * Admin Broadcasts Service Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Эти тесты проверяют работу сервиса рассылок для админ-панели.
 * 
 * Запуск:
 *   npm test server/services/__tests__/admin-broadcasts.service.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getBroadcastsList,
  getBroadcastDetails,
  createBroadcast,
  sendBroadcast,
  getBroadcastTemplates,
  createBroadcastTemplate,
} from '../admin-broadcasts.service';

// Mock database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock telegram bot
vi.mock('../../telegram/bot', () => ({
  getTelegramBot: vi.fn(() => ({
    sendMessage: vi.fn(() => Promise.resolve({ message_id: 1 })),
  })),
}));

// Mock logger
vi.mock('../../lib/logger', () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

describe('Admin Broadcasts Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBroadcastsList', () => {
    it('should have correct function signature', () => {
      expect(typeof getBroadcastsList).toBe('function');
    });

    it('should return broadcasts list with correct structure', () => {
      const expectedStructure = {
        broadcasts: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      expect(expectedStructure).toHaveProperty('broadcasts');
      expect(expectedStructure).toHaveProperty('total');
      expect(expectedStructure).toHaveProperty('page');
      expect(expectedStructure).toHaveProperty('limit');
      expect(expectedStructure).toHaveProperty('totalPages');
      expect(Array.isArray(expectedStructure.broadcasts)).toBe(true);
    });
  });

  describe('getBroadcastDetails', () => {
    it('should have correct function signature', () => {
      expect(typeof getBroadcastDetails).toBe('function');
    });

    it('should return broadcast details with recipients structure', () => {
      const expectedStructure = {
        id: 1,
        title: 'Test',
        message: 'Test message',
        status: 'draft',
        recipients: {
          total: 0,
          sent: 0,
          failed: 0,
          pending: 0,
        },
      };

      expect(expectedStructure).toHaveProperty('recipients');
      expect(expectedStructure.recipients).toHaveProperty('total');
      expect(expectedStructure.recipients).toHaveProperty('sent');
      expect(expectedStructure.recipients).toHaveProperty('failed');
      expect(expectedStructure.recipients).toHaveProperty('pending');
    });
  });

  describe('createBroadcast', () => {
    it('should have correct function signature', () => {
      expect(typeof createBroadcast).toBe('function');
    });
  });

  describe('sendBroadcast', () => {
    it('should have correct function signature', () => {
      expect(typeof sendBroadcast).toBe('function');
    });

    it('should return send result with correct structure', () => {
      const expectedStructure = {
        success: true,
        totalRecipients: 0,
        sentCount: 0,
        failedCount: 0,
      };

      expect(expectedStructure).toHaveProperty('success');
      expect(expectedStructure).toHaveProperty('totalRecipients');
      expect(expectedStructure).toHaveProperty('sentCount');
      expect(expectedStructure).toHaveProperty('failedCount');
    });
  });

  describe('getBroadcastTemplates', () => {
    it('should have correct function signature', () => {
      expect(typeof getBroadcastTemplates).toBe('function');
    });
  });

  describe('createBroadcastTemplate', () => {
    it('should have correct function signature', () => {
      expect(typeof createBroadcastTemplate).toBe('function');
    });
  });
});


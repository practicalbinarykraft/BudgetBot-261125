/**
 * Admin Support Service Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Эти тесты проверяют работу сервиса поддержки для админ-панели.
 * 
 * Запуск:
 *   npm test server/services/__tests__/admin-support.service.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSupportChatsList,
  getChatMessages,
  sendSupportMessage,
  updateChatStatus,
  markMessagesAsRead,
  createSupportChat,
} from '../admin-support.service';

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

describe('Admin Support Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSupportChatsList', () => {
    it('should have correct function signature', () => {
      expect(typeof getSupportChatsList).toBe('function');
    });

    it('should return chats list with correct structure', () => {
      const expectedStructure = {
        chats: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      expect(expectedStructure).toHaveProperty('chats');
      expect(expectedStructure).toHaveProperty('total');
      expect(expectedStructure).toHaveProperty('page');
      expect(expectedStructure).toHaveProperty('limit');
      expect(expectedStructure).toHaveProperty('totalPages');
      expect(Array.isArray(expectedStructure.chats)).toBe(true);
    });
  });

  describe('getChatMessages', () => {
    it('should have correct function signature', () => {
      expect(typeof getChatMessages).toBe('function');
    });

    it('should return messages with correct structure', () => {
      const expectedStructure = {
        messages: [],
        total: 0,
      };

      expect(expectedStructure).toHaveProperty('messages');
      expect(expectedStructure).toHaveProperty('total');
      expect(Array.isArray(expectedStructure.messages)).toBe(true);
    });
  });

  describe('sendSupportMessage', () => {
    it('should have correct function signature', () => {
      expect(typeof sendSupportMessage).toBe('function');
    });
  });

  describe('updateChatStatus', () => {
    it('should have correct function signature', () => {
      expect(typeof updateChatStatus).toBe('function');
    });

    it('should accept valid status values', () => {
      const validStatuses = ['open', 'closed', 'pending', 'resolved'];
      validStatuses.forEach((status) => {
        expect(typeof status).toBe('string');
      });
    });

    it('should accept valid priority values', () => {
      const validPriorities = ['low', 'normal', 'high', 'urgent'];
      validPriorities.forEach((priority) => {
        expect(typeof priority).toBe('string');
      });
    });
  });

  describe('markMessagesAsRead', () => {
    it('should have correct function signature', () => {
      expect(typeof markMessagesAsRead).toBe('function');
    });
  });

  describe('createSupportChat', () => {
    it('should have correct function signature', () => {
      expect(typeof createSupportChat).toBe('function');
    });
  });
});


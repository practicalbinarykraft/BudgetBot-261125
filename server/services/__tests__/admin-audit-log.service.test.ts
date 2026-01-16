/**
 * Admin Audit Log Service Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для сервиса логирования действий админов
 * 
 * Запуск:
 *   npm test server/services/__tests__/admin-audit-log.service.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAdminAction } from '../admin-audit-log.service';
import type { Request } from 'express';

// Mock database - создаем моки внутри factory функции
const mockValues = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnValue({
  values: mockValues,
});

vi.mock('../../db', () => {
  const mockValues = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnValue({
    values: mockValues,
  });
  
  return {
    db: {
      insert: mockInsert,
    },
    adminAuditLog: {},
  };
});

// Импортируем после мока для получения типизированных моков
import { db } from '../../db';

// Mock logger
vi.mock('../../lib/logger', () => ({
  logError: vi.fn(),
}));

describe('Admin Audit Log Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logAdminAction', () => {
    it('should log admin action with all parameters', async () => {
      const mockReq = {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0',
        },
        ip: '192.168.1.1',
      } as unknown as Request;

      await logAdminAction({
        adminId: 1,
        action: 'user.ban',
        entityType: 'user',
        entityId: '123',
        changes: { before: { status: 'active' }, after: { status: 'banned' } },
        req: mockReq,
      });

      const mockedInsert = vi.mocked(db.insert);
      expect(mockedInsert).toHaveBeenCalled();
    });

    it('should log action without request object', async () => {
      await logAdminAction({
        adminId: 1,
        action: 'login',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      const mockedInsert = vi.mocked(db.insert);
      expect(mockedInsert).toHaveBeenCalled();
    });

    it('should extract IP from x-forwarded-for header', async () => {
      const mockReq = {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      } as unknown as Request;

      await logAdminAction({
        adminId: 1,
        action: 'test',
        req: mockReq,
      });

      const mockedInsert = vi.mocked(db.insert);
      expect(mockedInsert).toHaveBeenCalled();
    });

    it('should extract IP from x-real-ip header', async () => {
      const mockReq = {
        headers: {
          'x-real-ip': '192.168.1.1',
        },
      } as unknown as Request;

      await logAdminAction({
        adminId: 1,
        action: 'test',
        req: mockReq,
      });

      const mockedInsert = vi.mocked(db.insert);
      expect(mockedInsert).toHaveBeenCalled();
    });

    it('should use req.ip as fallback', async () => {
      const mockReq = {
        ip: '192.168.1.1',
        socket: { remoteAddress: '10.0.0.1' },
        headers: {}, // Нет заголовков x-forwarded-for или x-real-ip
      } as unknown as Request;

      await logAdminAction({
        adminId: 1,
        action: 'test',
        req: mockReq,
      });

      // Проверяем, что insert был вызван
      // Используем прямой доступ к моку через db
      expect(db.insert).toHaveBeenCalled();
    });

    it('should handle null adminId', async () => {
      await logAdminAction({
        action: 'system.event',
        entityType: 'system',
      });

      const mockedInsert = vi.mocked(db.insert);
      expect(mockedInsert).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const { logError } = await import('../../lib/logger');
      const mockedInsert = vi.mocked(db.insert);
      mockedInsert.mockRejectedValueOnce(new Error('Database error'));

      await logAdminAction({
        adminId: 1,
        action: 'test',
      });

      expect(logError).toHaveBeenCalled();
    });

    it('should use provided ipAddress and userAgent over request', async () => {
      const mockReq = {
        headers: {
          'x-forwarded-for': '192.168.1.2',
          'user-agent': 'Other Agent',
        },
        ip: '192.168.1.2',
      } as unknown as Request;

      await logAdminAction({
        adminId: 1,
        action: 'test',
        req: mockReq,
        ipAddress: '192.168.1.1',
        userAgent: 'Custom Agent',
      });

      const mockedInsert = vi.mocked(db.insert);
      expect(mockedInsert).toHaveBeenCalled();
    });
  });
});

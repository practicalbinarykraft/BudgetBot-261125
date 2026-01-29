/**
 * NotificationRepository Tests
 * 
 * Tests for notification CRUD operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationRepository } from '../notification.repository';

// Mock database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { db } from '../../db';
import { notifications } from '@shared/schema';

describe('NotificationRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotificationsByUserId', () => {
    it('should return notifications for user ordered by creation date', async () => {
      const userId = 1;
      const mockNotifications = [
        {
          id: 1,
          userId: 1,
          type: 'planned_expense',
          title: 'Test 1',
          message: 'Message 1',
          plannedTransactionId: 1,
          plannedIncomeId: null,
          transactionData: {},
          status: 'unread',
          createdAt: new Date('2024-01-02'),
          readAt: null,
          dismissedAt: null,
          completedAt: null,
        },
        {
          id: 2,
          userId: 1,
          type: 'planned_income',
          title: 'Test 2',
          message: 'Message 2',
          plannedTransactionId: null,
          plannedIncomeId: 1,
          transactionData: {},
          status: 'read',
          createdAt: new Date('2024-01-01'),
          readAt: new Date(),
          dismissedAt: null,
          completedAt: null,
        },
      ];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockNotifications),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await notificationRepository.getNotificationsByUserId(userId);

      expect(db.select).toHaveBeenCalled();
      expect(result).toEqual(mockNotifications);
      expect(result[0].id).toBe(1); // Newest first
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      const userId = 1;
      const mockCount = [{ count: 5 }];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockCount),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await notificationRepository.getUnreadCount(userId);

      expect(db.select).toHaveBeenCalled();
      expect(result).toBe(5);
    });

    it('should return 0 if no unread notifications', async () => {
      const userId = 1;
      const mockCount = [{ count: 0 }];

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockCount),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await notificationRepository.getUnreadCount(userId);

      expect(result).toBe(0);
    });
  });

  describe('createNotification', () => {
    it('should create and return new notification', async () => {
      const userId = 1;
      const notificationData = {
        type: 'planned_expense' as const,
        title: 'Test Notification',
        message: 'Test message',
        plannedTransactionId: 1,
        transactionData: {
          amount: '100.00',
          currency: 'USD',
          description: 'Test',
          type: 'expense',
          date: '2024-01-01',
        },
        status: 'unread' as const,
      };

      const createdNotification = {
        id: 1,
        userId,
        ...notificationData,
        plannedIncomeId: null,
        createdAt: new Date(),
        readAt: null,
        dismissedAt: null,
        completedAt: null,
      };

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([createdNotification]),
      };

      vi.mocked(db.insert).mockReturnValue(mockInsert as any);

      const result = await notificationRepository.createNotification(notificationData, userId);

      expect(db.insert).toHaveBeenCalledWith(notifications);
      expect(mockInsert.values).toHaveBeenCalledWith({
        ...notificationData,
        userId,
      });
      expect(result).toEqual(createdNotification);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = 1;
      const userId = 1;
      const updatedNotification = {
        id: 1,
        userId: 1,
        type: 'planned_expense' as const,
        title: 'Test',
        message: 'Test',
        plannedTransactionId: 1,
        plannedIncomeId: null,
        transactionData: {},
        status: 'read' as const,
        createdAt: new Date(),
        readAt: new Date(),
        dismissedAt: null,
        completedAt: null,
      };

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedNotification]),
      };

      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      const result = await notificationRepository.markAsRead(notificationId, userId);

      expect(db.update).toHaveBeenCalledWith(notifications);
      expect(mockUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'read',
        })
      );
      expect(result).toEqual(updatedNotification);
    });

    it('should return null if notification not found', async () => {
      const notificationId = 999;
      const userId = 1;

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      const result = await notificationRepository.markAsRead(notificationId, userId);

      expect(result).toBeNull();
    });
  });

  describe('markAsDismissed', () => {
    it('should mark notification as dismissed', async () => {
      const notificationId = 1;
      const userId = 1;
      const updatedNotification = {
        id: 1,
        userId: 1,
        type: 'planned_expense' as const,
        title: 'Test',
        message: 'Test',
        plannedTransactionId: 1,
        plannedIncomeId: null,
        transactionData: {},
        status: 'dismissed' as const,
        createdAt: new Date(),
        readAt: null,
        dismissedAt: new Date(),
        completedAt: null,
      };

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedNotification]),
      };

      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      const result = await notificationRepository.markAsDismissed(notificationId, userId);

      expect(mockUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'dismissed',
        })
      );
      expect(result).toEqual(updatedNotification);
    });
  });

  describe('markAsCompleted', () => {
    it('should mark notification as completed', async () => {
      const notificationId = 1;
      const userId = 1;
      const updatedNotification = {
        id: 1,
        userId: 1,
        type: 'planned_expense' as const,
        title: 'Test',
        message: 'Test',
        plannedTransactionId: 1,
        plannedIncomeId: null,
        transactionData: {},
        status: 'completed' as const,
        createdAt: new Date(),
        readAt: null,
        dismissedAt: null,
        completedAt: new Date(),
      };

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedNotification]),
      };

      vi.mocked(db.update).mockReturnValue(mockUpdate as any);

      const result = await notificationRepository.markAsCompleted(notificationId, userId);

      expect(mockUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
        })
      );
      expect(result).toEqual(updatedNotification);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification and return true', async () => {
      const notificationId = 1;
      const userId = 1;

      const mockDelete = {
        where: vi.fn().mockResolvedValue({ rowCount: 1 }),
      };

      vi.mocked(db.delete).mockReturnValue(mockDelete as any);

      const result = await notificationRepository.deleteNotification(notificationId, userId);

      expect(db.delete).toHaveBeenCalledWith(notifications);
      expect(result).toBe(true);
    });

    it('should return false if notification not found', async () => {
      const notificationId = 999;
      const userId = 1;

      const mockDelete = {
        where: vi.fn().mockResolvedValue({ rowCount: 0 }),
      };

      vi.mocked(db.delete).mockReturnValue(mockDelete as any);

      const result = await notificationRepository.deleteNotification(notificationId, userId);

      expect(result).toBe(false);
    });
  });

  describe('getNotificationById', () => {
    it('should return notification by id', async () => {
      const notificationId = 1;
      const userId = 1;
      const notification = {
        id: 1,
        userId: 1,
        type: 'planned_expense' as const,
        title: 'Test',
        message: 'Test',
        plannedTransactionId: 1,
        plannedIncomeId: null,
        transactionData: {},
        status: 'unread' as const,
        createdAt: new Date(),
        readAt: null,
        dismissedAt: null,
        completedAt: null,
      };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([notification]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await notificationRepository.getNotificationById(notificationId, userId);

      expect(result).toEqual(notification);
    });

    it('should return null if notification not found', async () => {
      const notificationId = 999;
      const userId = 1;

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const result = await notificationRepository.getNotificationById(notificationId, userId);

      expect(result).toBeNull();
    });
  });
});

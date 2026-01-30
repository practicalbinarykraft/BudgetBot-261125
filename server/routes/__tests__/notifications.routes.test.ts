/**
 * Notifications Routes Tests
 * 
 * Tests for notification API endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import notificationsRouter from '../notifications.routes';
import { NotificationTransactionData } from '@shared/schema';

// Mock dependencies
vi.mock('../../repositories/notification.repository', () => ({
  notificationRepository: {
    getNotificationsByUserId: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAsDismissed: vi.fn(),
    markAsCompleted: vi.fn(),
    deleteNotification: vi.fn(),
    getNotificationById: vi.fn(),
  },
}));

vi.mock('../../services/notification.service', () => ({
  notificationService: {
    checkAndCreateNotifications: vi.fn(),
  },
}));

vi.mock('../../middleware/auth-utils', () => ({
  withAuth: (handler: any) => {
    return async (req: any, res: any, next: any) => {
      // Mock authenticated user
      req.user = { id: '1' };
      return handler(req, res, next);
    };
  },
}));

import { notificationRepository } from '../../repositories/notification.repository';
import { notificationService } from '../../services/notification.service';

const app = express();
app.use(express.json());
app.use('/api/notifications', notificationsRouter);

describe('Notifications Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/notifications', () => {
    it('should return notifications for authenticated user', async () => {
      const mockNotifications = [
        {
          id: 1,
          userId: 1,
          type: 'planned_expense',
          title: 'Test Notification',
          message: 'Test message',
          plannedTransactionId: 1,
          plannedIncomeId: null,
          transactionData: {
            amount: '100.00',
            currency: 'USD',
            description: 'Test',
            type: 'expense',
            date: '2026-01-30',
          } as NotificationTransactionData,
          status: 'unread',
          createdAt: new Date(),
          readAt: null,
          dismissedAt: null,
          completedAt: null,
        },
      ];

      vi.mocked(notificationService.checkAndCreateNotifications).mockResolvedValue();
      vi.mocked(notificationRepository.getNotificationsByUserId).mockResolvedValue(mockNotifications);

      const response = await request(app)
        .get('/api/notifications')
        .expect(200);

      expect(notificationService.checkAndCreateNotifications).toHaveBeenCalledWith(1);
      expect(notificationRepository.getNotificationsByUserId).toHaveBeenCalledWith(1);
      expect(response.body).toEqual(mockNotifications);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should return unread count', async () => {
      vi.mocked(notificationService.checkAndCreateNotifications).mockResolvedValue();
      vi.mocked(notificationRepository.getUnreadCount).mockResolvedValue(5);

      const response = await request(app)
        .get('/api/notifications/unread-count')
        .expect(200);

      expect(notificationService.checkAndCreateNotifications).toHaveBeenCalledWith(1);
      expect(notificationRepository.getUnreadCount).toHaveBeenCalledWith(1);
      expect(response.body).toEqual({ count: 5 });
    });

    it('should return 0 if no unread notifications', async () => {
      vi.mocked(notificationService.checkAndCreateNotifications).mockResolvedValue();
      vi.mocked(notificationRepository.getUnreadCount).mockResolvedValue(0);

      const response = await request(app)
        .get('/api/notifications/unread-count')
        .expect(200);

      expect(response.body).toEqual({ count: 0 });
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const notification = {
        id: 1,
        userId: 1,
        type: 'planned_expense' as const,
        title: 'Test',
        message: 'Test',
        plannedTransactionId: 1,
        plannedIncomeId: null,
        transactionData: {
          amount: '100.00',
          currency: 'USD',
          description: 'Test',
          type: 'expense',
          date: '2026-01-30',
        } as NotificationTransactionData,
        status: 'read' as const,
        createdAt: new Date(),
        readAt: new Date(),
        dismissedAt: null,
        completedAt: null,
      };

      vi.mocked(notificationRepository.markAsRead).mockResolvedValue(notification);

      const response = await request(app)
        .patch('/api/notifications/1/read')
        .expect(200);

      expect(notificationRepository.markAsRead).toHaveBeenCalledWith(1, 1);
      expect(response.body).toEqual(notification);
    });

    it('should return 404 if notification not found', async () => {
      vi.mocked(notificationRepository.markAsRead).mockResolvedValue(null);

      await request(app)
        .patch('/api/notifications/999/read')
        .expect(404);
    });
  });

  describe('PATCH /api/notifications/:id/dismiss', () => {
    it('should mark notification as dismissed', async () => {
      const notification = {
        id: 1,
        userId: 1,
        type: 'planned_expense' as const,
        title: 'Test',
        message: 'Test',
        plannedTransactionId: 1,
        plannedIncomeId: null,
        transactionData: {
          amount: '100.00',
          currency: 'USD',
          description: 'Test',
          type: 'expense',
          date: '2026-01-30',
        } as NotificationTransactionData,
        status: 'dismissed' as const,
        createdAt: new Date(),
        readAt: null,
        dismissedAt: new Date(),
        completedAt: null,
      };

      vi.mocked(notificationRepository.markAsDismissed).mockResolvedValue(notification);

      const response = await request(app)
        .patch('/api/notifications/1/dismiss')
        .expect(200);

      expect(notificationRepository.markAsDismissed).toHaveBeenCalledWith(1, 1);
      expect(response.body).toEqual(notification);
    });

    it('should return 404 if notification not found', async () => {
      vi.mocked(notificationRepository.markAsDismissed).mockResolvedValue(null);

      await request(app)
        .patch('/api/notifications/999/dismiss')
        .expect(404);
    });
  });

  describe('PATCH /api/notifications/:id/complete', () => {
    it('should mark notification as completed', async () => {
      const notification = {
        id: 1,
        userId: 1,
        type: 'planned_expense' as const,
        title: 'Test',
        message: 'Test',
        plannedTransactionId: 1,
        plannedIncomeId: null,
        transactionData: {
          amount: '100.00',
          currency: 'USD',
          description: 'Test',
          type: 'expense',
          date: '2026-01-30',
        } as NotificationTransactionData,
        status: 'completed' as const,
        createdAt: new Date(),
        readAt: null,
        dismissedAt: null,
        completedAt: new Date(),
      };

      // Mock getNotificationById first (called before markAsCompleted)
      vi.mocked(notificationRepository.getNotificationById).mockResolvedValue(notification);
      vi.mocked(notificationRepository.markAsCompleted).mockResolvedValue(notification);

      const response = await request(app)
        .patch('/api/notifications/1/complete')
        .expect(200);

      expect(notificationRepository.getNotificationById).toHaveBeenCalledWith(1, 1);
      expect(notificationRepository.markAsCompleted).toHaveBeenCalledWith(1, 1);
      expect(response.body).toEqual(notification);
    });

    it('should return 404 if notification not found', async () => {
      vi.mocked(notificationRepository.markAsCompleted).mockResolvedValue(null);

      await request(app)
        .patch('/api/notifications/999/complete')
        .expect(404);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should delete notification', async () => {
      vi.mocked(notificationRepository.deleteNotification).mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/notifications/1')
        .expect(200);

      expect(notificationRepository.deleteNotification).toHaveBeenCalledWith(1, 1);
      expect(response.body).toEqual({ success: true });
    });

    it('should return 404 if notification not found', async () => {
      vi.mocked(notificationRepository.deleteNotification).mockResolvedValue(false);

      await request(app)
        .delete('/api/notifications/999')
        .expect(404);
    });
  });

  describe('GET /api/notifications/:id', () => {
    it('should return notification by id', async () => {
      const notification = {
        id: 1,
        userId: 1,
        type: 'planned_expense' as const,
        title: 'Test',
        message: 'Test',
        plannedTransactionId: 1,
        plannedIncomeId: null,
        transactionData: {
          amount: '100.00',
          currency: 'USD',
          description: 'Test',
          type: 'expense',
          date: '2026-01-30',
        } as NotificationTransactionData,
        status: 'unread' as const,
        createdAt: new Date(),
        readAt: null,
        dismissedAt: null,
        completedAt: null,
      };

      vi.mocked(notificationRepository.getNotificationById).mockResolvedValue(notification);

      const response = await request(app)
        .get('/api/notifications/1')
        .expect(200);

      expect(notificationRepository.getNotificationById).toHaveBeenCalledWith(1, 1);
      expect(response.body).toEqual(notification);
    });

    it('should return 404 if notification not found', async () => {
      vi.mocked(notificationRepository.getNotificationById).mockResolvedValue(null);

      await request(app)
        .get('/api/notifications/999')
        .expect(404);
    });
  });
});

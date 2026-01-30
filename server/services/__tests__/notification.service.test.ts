/**
 * NotificationService Tests
 * 
 * Tests for checking planned transactions and creating notifications
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationService } from '../notification.service';

// Mock dependencies
vi.mock('../../repositories/notification.repository', () => ({
  notificationRepository: {
    getNotificationsByUserId: vi.fn(),
    createNotification: vi.fn(),
  },
}));

vi.mock('../../repositories/planned.repository', () => ({
  plannedRepository: {
    getPlannedByUserId: vi.fn(),
  },
}));

vi.mock('../../repositories/planned-income.repository', () => ({
  plannedIncomeRepository: {
    getPlannedIncomeByUserId: vi.fn(),
  },
}));

import { notificationRepository } from '../../repositories/notification.repository';
import { plannedRepository } from '../../repositories/planned.repository';
import { plannedIncomeRepository } from '../../repositories/planned-income.repository';
import { NotificationTransactionData } from '@shared/schema';

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: return empty array for planned income
    vi.mocked(plannedIncomeRepository.getPlannedIncomeByUserId).mockResolvedValue([]);
  });

  describe('checkAndCreateNotifications', () => {
    it('should create notification for planned expense that reached target date', async () => {
      const userId = 1;
      const today = new Date().toISOString().split('T')[0];
      
      const plannedExpense = {
        id: 1,
        userId: 1,
        name: 'Test Expense',
        amount: '100.00',
        currency: 'USD',
        category: 'Food',
        targetDate: today,
        status: 'planned',
        source: 'manual',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(plannedRepository.getPlannedByUserId).mockResolvedValue([plannedExpense]);
      vi.mocked(plannedIncomeRepository.getPlannedIncomeByUserId).mockResolvedValue([]);
      // getNotificationsByUserId is called once for planned expense check, once for planned income check (empty)
      vi.mocked(notificationRepository.getNotificationsByUserId)
        .mockResolvedValueOnce([]) // For planned expense check
        .mockResolvedValueOnce([]); // For planned income check (empty array)
      vi.mocked(notificationRepository.createNotification).mockResolvedValue({
        id: 1,
        userId: 1,
        type: 'planned_expense',
        title: 'Запланированный расход',
        message: `Был запланированный расход "${plannedExpense.name}" на сумму ${plannedExpense.amount} ${plannedExpense.currency}. Подтвердите транзакцию.`,
        plannedTransactionId: 1,
        plannedIncomeId: null,
        transactionData: {
          amount: plannedExpense.amount,
          currency: plannedExpense.currency,
          description: plannedExpense.name,
          category: plannedExpense.category,
          type: 'expense',
          date: plannedExpense.targetDate,
        },
        status: 'unread',
        createdAt: new Date(),
        readAt: null,
        dismissedAt: null,
        completedAt: null,
      });

      await notificationService.checkAndCreateNotifications(userId);

      expect(plannedRepository.getPlannedByUserId).toHaveBeenCalledWith(userId);
      expect(notificationRepository.getNotificationsByUserId).toHaveBeenCalledWith(userId);
      expect(notificationRepository.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'planned_expense',
          plannedTransactionId: 1,
          status: 'unread',
        }),
        userId
      );
    });

    it('should not create notification if one already exists', async () => {
      const userId = 1;
      const today = new Date().toISOString().split('T')[0];
      
      const plannedExpense = {
        id: 1,
        userId: 1,
        name: 'Test Expense',
        amount: '100.00',
        currency: 'USD',
        category: 'Food',
        targetDate: today,
        status: 'planned',
        source: 'manual',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const existingNotification = {
        id: 1,
        userId: 1,
        type: 'planned_expense' as const,
        title: 'Запланированный расход',
        message: 'Test',
        plannedTransactionId: 1,
        plannedIncomeId: null,
        transactionData: {
          amount: '100.00',
          currency: 'USD',
          description: 'Test Expense',
          type: 'expense',
          date: today,
        } as NotificationTransactionData,
        status: 'unread' as const,
        createdAt: new Date(),
        readAt: null,
        dismissedAt: null,
        completedAt: null,
      };

      vi.mocked(plannedRepository.getPlannedByUserId).mockResolvedValue([plannedExpense]);
      vi.mocked(plannedIncomeRepository.getPlannedIncomeByUserId).mockResolvedValue([]);
      // getNotificationsByUserId is called once for planned expense check, once for planned income check (empty)
      vi.mocked(notificationRepository.getNotificationsByUserId)
        .mockResolvedValueOnce([existingNotification]) // For planned expense check
        .mockResolvedValueOnce([]); // For planned income check (empty array)

      await notificationService.checkAndCreateNotifications(userId);

      expect(notificationRepository.createNotification).not.toHaveBeenCalled();
    });

    it('should not create notification for future planned expense', async () => {
      const userId = 1;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      const plannedExpense = {
        id: 1,
        userId: 1,
        name: 'Future Expense',
        amount: '100.00',
        currency: 'USD',
        category: 'Food',
        targetDate: futureDateStr,
        status: 'planned',
        source: 'manual',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(plannedRepository.getPlannedByUserId).mockResolvedValue([plannedExpense]);
      vi.mocked(plannedIncomeRepository.getPlannedIncomeByUserId).mockResolvedValue([]);
      vi.mocked(notificationRepository.getNotificationsByUserId)
        .mockResolvedValueOnce([]) // For planned expense check
        .mockResolvedValueOnce([]); // For planned income check

      await notificationService.checkAndCreateNotifications(userId);

      expect(notificationRepository.createNotification).not.toHaveBeenCalled();
    });

    it('should not create notification for purchased planned expense', async () => {
      const userId = 1;
      const today = new Date().toISOString().split('T')[0];
      
      const plannedExpense = {
        id: 1,
        userId: 1,
        name: 'Purchased Expense',
        amount: '100.00',
        currency: 'USD',
        category: 'Food',
        targetDate: today,
        status: 'purchased',
        source: 'manual',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(plannedRepository.getPlannedByUserId).mockResolvedValue([plannedExpense]);
      vi.mocked(plannedIncomeRepository.getPlannedIncomeByUserId).mockResolvedValue([]);
      vi.mocked(notificationRepository.getNotificationsByUserId)
        .mockResolvedValueOnce([]) // For planned expense check
        .mockResolvedValueOnce([]); // For planned income check

      await notificationService.checkAndCreateNotifications(userId);

      expect(notificationRepository.createNotification).not.toHaveBeenCalled();
    });

    it('should create notification for planned income that reached expected date', async () => {
      const userId = 1;
      const today = new Date().toISOString().split('T')[0];
      
      const plannedIncome = {
        id: 1,
        userId: 1,
        amount: '500.00',
        currency: 'USD',
        amountUsd: '500.00',
        description: 'Salary',
        categoryId: 1,
        expectedDate: today,
        status: 'pending',
        transactionId: null,
        receivedAt: null,
        source: 'manual',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock planned expenses to return empty array
      vi.mocked(plannedRepository.getPlannedByUserId).mockResolvedValue([]);
      vi.mocked(plannedIncomeRepository.getPlannedIncomeByUserId).mockResolvedValue([plannedIncome]);
      // getNotificationsByUserId is called twice - once for planned expenses check, once for planned income check
      vi.mocked(notificationRepository.getNotificationsByUserId)
        .mockResolvedValueOnce([]) // First call for planned expenses (empty)
        .mockResolvedValueOnce([]); // Second call for planned income (empty)
      vi.mocked(notificationRepository.createNotification).mockResolvedValue({
        id: 1,
        userId: 1,
        type: 'planned_income',
        title: 'Запланированный доход',
        message: `Был запланированный доход "${plannedIncome.description}" на сумму ${plannedIncome.amount} ${plannedIncome.currency}. Подтвердите транзакцию.`,
        plannedTransactionId: null,
        plannedIncomeId: 1,
        transactionData: {
          amount: plannedIncome.amount,
          currency: plannedIncome.currency,
          description: plannedIncome.description,
          categoryId: plannedIncome.categoryId,
          type: 'income',
          date: plannedIncome.expectedDate,
        },
        status: 'unread',
        createdAt: new Date(),
        readAt: null,
        dismissedAt: null,
        completedAt: null,
      });

      await notificationService.checkAndCreateNotifications(userId);

      expect(plannedIncomeRepository.getPlannedIncomeByUserId).toHaveBeenCalledWith(userId, { status: 'pending' });
      expect(notificationRepository.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'planned_income',
          plannedIncomeId: 1,
          status: 'unread',
        }),
        userId
      );
    });

    it('should not create notification if existing notification is completed', async () => {
      const userId = 1;
      const today = new Date().toISOString().split('T')[0];
      
      const plannedExpense = {
        id: 1,
        userId: 1,
        name: 'Test Expense',
        amount: '100.00',
        currency: 'USD',
        category: 'Food',
        targetDate: today,
        status: 'planned',
        source: 'manual',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const completedNotification = {
        id: 1,
        userId: 1,
        type: 'planned_expense' as const,
        title: 'Запланированный расход',
        message: 'Test',
        plannedTransactionId: 1,
        plannedIncomeId: null,
        transactionData: {
          amount: '100.00',
          currency: 'USD',
          description: 'Test',
          type: 'expense',
          date: today,
        } as NotificationTransactionData,
        status: 'completed' as const,
        createdAt: new Date(),
        readAt: null,
        dismissedAt: null,
        completedAt: new Date(),
      };

      vi.mocked(plannedRepository.getPlannedByUserId).mockResolvedValue([plannedExpense]);
      vi.mocked(plannedIncomeRepository.getPlannedIncomeByUserId).mockResolvedValue([]);
      vi.mocked(notificationRepository.getNotificationsByUserId)
        .mockResolvedValueOnce([completedNotification]) // For planned expense check
        .mockResolvedValueOnce([]); // For planned income check

      await notificationService.checkAndCreateNotifications(userId);

      expect(notificationRepository.createNotification).not.toHaveBeenCalled();
    });

    it('should not create notification if existing notification is dismissed', async () => {
      const userId = 1;
      const today = new Date().toISOString().split('T')[0];
      
      const plannedExpense = {
        id: 1,
        userId: 1,
        name: 'Test Expense',
        amount: '100.00',
        currency: 'USD',
        category: 'Food',
        targetDate: today,
        status: 'planned',
        source: 'manual',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dismissedNotification = {
        id: 1,
        userId: 1,
        type: 'planned_expense' as const,
        title: 'Запланированный расход',
        message: 'Test',
        plannedTransactionId: 1,
        plannedIncomeId: null,
        transactionData: {
          amount: '100.00',
          currency: 'USD',
          description: 'Test',
          type: 'expense',
          date: today,
        } as NotificationTransactionData,
        status: 'dismissed' as const,
        createdAt: new Date(),
        readAt: null,
        dismissedAt: new Date(),
        completedAt: null,
      };

      vi.mocked(plannedRepository.getPlannedByUserId).mockResolvedValue([plannedExpense]);
      vi.mocked(plannedIncomeRepository.getPlannedIncomeByUserId).mockResolvedValue([]);
      vi.mocked(notificationRepository.getNotificationsByUserId)
        .mockResolvedValueOnce([dismissedNotification]) // For planned expense check
        .mockResolvedValueOnce([]); // For planned income check

      await notificationService.checkAndCreateNotifications(userId);

      expect(notificationRepository.createNotification).not.toHaveBeenCalled();
    });

    it('should handle multiple planned expenses correctly', async () => {
      const userId = 1;
      const today = new Date().toISOString().split('T')[0];
      
      const plannedExpenses = [
        {
          id: 1,
          userId: 1,
          name: 'Expense 1',
          amount: '100.00',
          currency: 'USD',
          category: 'Food',
          targetDate: today,
          status: 'planned' as const,
          source: 'manual',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          name: 'Expense 2',
          amount: '200.00',
          currency: 'USD',
          category: 'Transport',
          targetDate: today,
          status: 'planned' as const,
          source: 'manual',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(plannedRepository.getPlannedByUserId).mockResolvedValue(plannedExpenses);
      vi.mocked(plannedIncomeRepository.getPlannedIncomeByUserId).mockResolvedValue([]);
      // getNotificationsByUserId is called for each planned expense check
      vi.mocked(notificationRepository.getNotificationsByUserId)
        .mockResolvedValueOnce([]) // For first expense
        .mockResolvedValueOnce([]) // For second expense
        .mockResolvedValueOnce([]); // For planned income check
      vi.mocked(notificationRepository.createNotification).mockResolvedValue({
        id: 1,
        userId: 1,
        type: 'planned_expense',
        title: 'Запланированный расход',
        message: 'Test',
        plannedTransactionId: 1,
        plannedIncomeId: null,
        transactionData: {},
        status: 'unread',
        createdAt: new Date(),
        readAt: null,
        dismissedAt: null,
        completedAt: null,
      });

      await notificationService.checkAndCreateNotifications(userId);

      expect(notificationRepository.createNotification).toHaveBeenCalledTimes(2);
    });
  });
});

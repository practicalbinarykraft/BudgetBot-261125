import { notificationRepository } from "../repositories/notification.repository";
import { plannedRepository } from "../repositories/planned.repository";
import { plannedIncomeRepository } from "../repositories/planned-income.repository";
import { recurringRepository } from "../repositories/recurring.repository";
import { InsertNotification } from "@shared/schema";

/**
 * Service for checking planned transactions, income, and recurring payments
 * and creating notifications
 */
export class NotificationService {
  /**
   * Check for planned transactions/income/recurring payments with future dates (up to 6 months ahead)
   * and create notifications if they don't already exist
   */
  async checkAndCreateNotifications(userId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Calculate max future date (6 months ahead) for notifications
    const maxFutureDate = new Date();
    maxFutureDate.setMonth(maxFutureDate.getMonth() + 6);
    const maxFutureDateStr = maxFutureDate.toISOString().split('T')[0];

    // Check planned expenses
    const plannedExpenses = await plannedRepository.getPlannedByUserId(userId);
    console.log(`[NotificationService] Found ${plannedExpenses.length} planned expenses for user ${userId}`);
    for (const planned of plannedExpenses) {
      console.log(`[NotificationService] Checking planned ${planned.id}: status=${planned.status}, targetDate=${planned.targetDate}, todayStr=${todayStr}, maxFutureDateStr=${maxFutureDateStr}`);
      // Create notifications for planned transactions with future dates (up to 6 months ahead)
      if (planned.status === "planned" && 
          planned.targetDate >= todayStr && 
          planned.targetDate <= maxFutureDateStr) {
        console.log(`[NotificationService] Planned ${planned.id} matches criteria, checking for existing notifications...`);
        // Check if notification already exists
        const existingNotifications = await notificationRepository.getNotificationsByUserId(userId);
        const hasNotification = existingNotifications.some(
          n => n.plannedTransactionId === planned.id && 
               n.status !== "completed" && 
               n.status !== "dismissed"
        );

        console.log(`[NotificationService] Planned ${planned.id}: hasNotification=${hasNotification}`);

        if (!hasNotification) {
          // Create notification
          const notificationData: InsertNotification = {
            userId,
            type: "planned_expense",
            title: "Запланированный расход",
            message: `Был запланированный расход "${planned.name}" на сумму ${planned.amount} ${planned.currency || "USD"}. Подтвердите транзакцию.`,
            plannedTransactionId: planned.id,
            transactionData: {
              amount: planned.amount,
              currency: planned.currency || "USD",
              description: planned.name,
              category: planned.category,
              type: "expense",
              date: planned.targetDate,
            },
            status: "unread",
          };

          await notificationRepository.createNotification(notificationData);
          console.log(`[NotificationService] Created notification for planned ${planned.id} with targetDate ${planned.targetDate}`);
        }
      } else {
        console.log(`[NotificationService] Planned ${planned.id} skipped: status=${planned.status}, targetDate=${planned.targetDate} (not in range ${todayStr} - ${maxFutureDateStr})`);
      }
    }

    // Check planned income
    const plannedIncomes = await plannedIncomeRepository.getPlannedIncomeByUserId(userId, { status: "pending" });
    for (const income of plannedIncomes) {
      // Create notifications for planned income with future dates (up to 6 months ahead)
      if (income.status === "pending" && 
          income.expectedDate >= todayStr && 
          income.expectedDate <= maxFutureDateStr) {
        // Check if notification already exists
        const existingNotifications = await notificationRepository.getNotificationsByUserId(userId);
        const hasNotification = existingNotifications.some(
          n => n.plannedIncomeId === income.id && 
               n.status !== "completed" && 
               n.status !== "dismissed"
        );

        if (!hasNotification) {
          // Create notification
          const notificationData: InsertNotification = {
            userId,
            type: "planned_income",
            title: "Запланированный доход",
            message: `Был запланированный доход "${income.description}" на сумму ${income.amount} ${income.currency || "USD"}. Подтвердите транзакцию.`,
            plannedIncomeId: income.id,
            transactionData: {
              amount: income.amount,
              currency: income.currency || "USD",
              description: income.description,
              categoryId: income.categoryId,
              type: "income",
              date: income.expectedDate,
            },
            status: "unread",
          };

          await notificationRepository.createNotification(notificationData);
        }
      }
    }

    // Check recurring transactions
    // Create notifications for all active recurring transactions with future dates
    // Generate notifications for multiple future occurrences (up to 6 months ahead)
    // Note: maxFutureDateStr is already calculated above
    const { recurring: recurringTransactions } = await recurringRepository.getRecurringByUserId(userId);
    
    // Helper function to calculate next occurrence date based on frequency
    const getNextOccurrenceDate = (currentDate: Date, frequency: string): Date => {
      const next = new Date(currentDate);
      switch (frequency) {
        case 'daily':
          next.setDate(next.getDate() + 1);
          break;
        case 'weekly':
          next.setDate(next.getDate() + 7);
          break;
        case 'monthly':
          next.setMonth(next.getMonth() + 1);
          // Handle month-end rollover (e.g., Jan 31 → Feb 28/29)
          const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
          const originalDay = currentDate.getDate();
          if (originalDay > daysInMonth) {
            next.setDate(daysInMonth);
          }
          break;
        case 'quarterly':
          next.setMonth(next.getMonth() + 3);
          const daysInQuarterMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
          const originalDayQuarter = currentDate.getDate();
          if (originalDayQuarter > daysInQuarterMonth) {
            next.setDate(daysInQuarterMonth);
          }
          break;
        case 'yearly':
          next.setFullYear(next.getFullYear() + 1);
          break;
        default:
          next.setDate(next.getDate() + 1);
      }
      return next;
    };
    
    for (const recurring of recurringTransactions) {
      if (!recurring.isActive) {
        continue;
      }
      
      // Get existing notifications for this recurring transaction
      const existingNotifications = await notificationRepository.getNotificationsByUserId(userId);
      
      // Generate notifications for all future occurrences up to 6 months ahead
      // Ensure nextDate is a Date object (it might be a string from DB)
      const nextDateObj = recurring.nextDate instanceof Date 
        ? recurring.nextDate 
        : new Date(recurring.nextDate);
      let currentDate = new Date(nextDateObj);
      currentDate.setHours(0, 0, 0, 0);
      const todayDate = new Date(todayStr);
      todayDate.setHours(0, 0, 0, 0);
      
      // Start from nextDate, or today if nextDate is in the past
      if (currentDate < todayDate) {
        currentDate = new Date(todayDate);
      }
      
      const maxDate = new Date(maxFutureDateStr);
      maxDate.setHours(0, 0, 0, 0);
      
      // Generate up to 50 occurrences to prevent infinite loops
      let occurrenceCount = 0;
      while (currentDate <= maxDate && occurrenceCount < 50) {
        const occurrenceDateStr = currentDate.toISOString().split('T')[0];
        
        // Check if notification already exists for this date
        const hasNotification = existingNotifications.some(
          n => {
            const transactionData = n.transactionData as any;
            return transactionData?.recurringId === recurring.id && 
                   transactionData?.nextDate === occurrenceDateStr &&
                   n.status !== "completed" && 
                   n.status !== "dismissed";
          }
        );

        if (!hasNotification) {
          // Create notification for this occurrence
          const notificationData: InsertNotification = {
            userId,
            type: recurring.type === "expense" ? "recurring_expense" : "recurring_income",
            title: recurring.type === "expense" 
              ? "Повторяющийся расход" 
              : "Повторяющийся доход",
            message: `Повторяющийся ${recurring.type === "expense" ? "расход" : "доход"} "${recurring.description}" на сумму ${recurring.amount} ${recurring.currency || "USD"}. Дата: ${occurrenceDateStr}.`,
            plannedTransactionId: null,
            plannedIncomeId: null,
            transactionData: {
              amount: recurring.amount,
              currency: recurring.currency || "USD",
              description: recurring.description,
              category: recurring.category,
              type: recurring.type,
              date: occurrenceDateStr,
              recurringId: recurring.id,
              frequency: recurring.frequency,
              nextDate: occurrenceDateStr,
            },
            status: "unread",
          };

          await notificationRepository.createNotification(notificationData);
        }
        
        // Move to next occurrence
        currentDate = getNextOccurrenceDate(currentDate, recurring.frequency);
        occurrenceCount++;
      }
    }
  }
}

export const notificationService = new NotificationService();

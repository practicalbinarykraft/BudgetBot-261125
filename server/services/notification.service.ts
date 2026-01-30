import { notificationRepository } from "../repositories/notification.repository";
import { plannedRepository } from "../repositories/planned.repository";
import { plannedIncomeRepository } from "../repositories/planned-income.repository";
import { recurringRepository } from "../repositories/recurring.repository";
import { InsertNotification, notificationTransactionDataSchema } from "@shared/schema";

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

    // Load all notifications once at the beginning to avoid multiple database calls
    const allNotifications = await notificationRepository.getNotificationsByUserId(userId);

    // Check planned expenses
    const plannedExpenses = await plannedRepository.getPlannedByUserId(userId);
    console.log(`[NotificationService] Found ${plannedExpenses.length} planned expenses for user ${userId}`);
    for (const planned of plannedExpenses) {
      console.log(`[NotificationService] Checking planned ${planned.id}: status=${planned.status}, targetDate=${planned.targetDate}, todayStr=${todayStr}`);
      // Create notifications only for planned transactions that have reached their target date
      // (targetDate <= todayStr) - not for future transactions
      if (planned.status === "planned" && 
          planned.targetDate <= todayStr) {
        console.log(`[NotificationService] Planned ${planned.id} matches criteria, checking for existing notifications...`);
        // Check if notification already exists (only count active notifications, not completed/dismissed)
        const hasActiveNotification = allNotifications.some(
          n => n.plannedTransactionId === planned.id && 
               n.status !== "completed" && 
               n.status !== "dismissed"
        );
        // Also check if any notification exists for this planned transaction (even if completed/dismissed)
        const hasAnyNotification = allNotifications.some(
          n => n.plannedTransactionId === planned.id
        );

        console.log(`[NotificationService] Planned ${planned.id}: hasActiveNotification=${hasActiveNotification}, hasAnyNotification=${hasAnyNotification}`);

        // Only create notification if there's no notification at all (active or completed/dismissed)
        // If any notification exists, don't create a new one
        if (!hasAnyNotification) {
          // Create notification
          const notificationData: InsertNotification = {
            type: "planned_expense",
            title: "Запланированный расход",
            message: `Был запланированный расход "${planned.name}" на сумму ${planned.amount} ${planned.currency || "USD"}. Подтвердите транзакцию.`,
            plannedTransactionId: planned.id,
            transactionData: notificationTransactionDataSchema.parse({
              amount: planned.amount,
              currency: planned.currency || "USD",
              description: planned.name,
              category: planned.category,
              type: "expense",
              date: planned.targetDate,
            }),
            status: "unread",
          };

          await notificationRepository.createNotification(notificationData, userId);
          console.log(`[NotificationService] Created notification for planned ${planned.id} with targetDate ${planned.targetDate}`);
        }
      } else {
        console.log(`[NotificationService] Planned ${planned.id} skipped: status=${planned.status}, targetDate=${planned.targetDate} (future date or not planned)`);
      }
    }

    // Check planned income
    const plannedIncomes = await plannedIncomeRepository.getPlannedIncomeByUserId(userId, { status: "pending" });
    for (const income of plannedIncomes) {
      // Create notifications only for planned income that has reached its expected date
      // (expectedDate <= todayStr) - not for future transactions
      if (income.status === "pending" && 
          income.expectedDate <= todayStr) {
        // Check if notification already exists (only count active notifications, not completed/dismissed)
        const hasActiveNotification = allNotifications.some(
          n => n.plannedIncomeId === income.id && 
               n.status !== "completed" && 
               n.status !== "dismissed"
        );
        // Also check if any notification exists for this planned income (even if completed/dismissed)
        const hasAnyNotification = allNotifications.some(
          n => n.plannedIncomeId === income.id
        );

        // Only create notification if there's no notification at all (active or completed/dismissed)
        // If any notification exists, don't create a new one
        if (!hasAnyNotification) {
          // Create notification
          const notificationData: InsertNotification = {
            type: "planned_income",
            title: "Запланированный доход",
            message: `Был запланированный доход "${income.description}" на сумму ${income.amount} ${income.currency || "USD"}. Подтвердите транзакцию.`,
            plannedIncomeId: income.id,
            transactionData: notificationTransactionDataSchema.parse({
              amount: income.amount,
              currency: income.currency || "USD",
              description: income.description,
              categoryId: income.categoryId,
              type: "income",
              date: income.expectedDate,
            }),
            status: "unread",
          };

          await notificationRepository.createNotification(notificationData, userId);
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
      
      // Generate notifications for all future occurrences up to 6 months ahead
      // nextDate from drizzle is always a string in 'YYYY-MM-DD' format
      const nextDateObj = new Date(recurring.nextDate);
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
        const hasNotification = allNotifications.some(
          n => {
            if (!n.transactionData) return false;
            const transactionData = notificationTransactionDataSchema.safeParse(n.transactionData);
            if (!transactionData.success) return false;
            return transactionData.data.recurringId === recurring.id && 
                   transactionData.data.nextDate === occurrenceDateStr &&
                   n.status !== "completed" && 
                   n.status !== "dismissed";
          }
        );

        if (!hasNotification) {
          // Create notification for this occurrence
          const notificationData: InsertNotification = {
            type: recurring.type === "expense" ? "recurring_expense" : "recurring_income",
            title: recurring.type === "expense" 
              ? "Повторяющийся расход" 
              : "Повторяющийся доход",
            message: `Повторяющийся ${recurring.type === "expense" ? "расход" : "доход"} "${recurring.description}" на сумму ${recurring.amount} ${recurring.currency || "USD"}. Дата: ${occurrenceDateStr}.`,
            plannedTransactionId: null,
            plannedIncomeId: null,
            transactionData: notificationTransactionDataSchema.parse({
              amount: recurring.amount,
              currency: recurring.currency || "USD",
              description: recurring.description,
              category: recurring.category,
              type: recurring.type,
              date: occurrenceDateStr,
              recurringId: recurring.id,
              frequency: recurring.frequency,
              nextDate: occurrenceDateStr,
            }),
            status: "unread",
          };

          await notificationRepository.createNotification(notificationData, userId);
        }
        
        // Move to next occurrence
        currentDate = getNextOccurrenceDate(currentDate, recurring.frequency);
        occurrenceCount++;
      }
    }
  }
}

export const notificationService = new NotificationService();

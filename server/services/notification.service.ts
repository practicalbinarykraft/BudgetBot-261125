import { notificationRepository } from "../repositories/notification.repository";
import { plannedRepository } from "../repositories/planned.repository";
import { plannedIncomeRepository } from "../repositories/planned-income.repository";
import { InsertNotification } from "@shared/schema";

/**
 * Service for checking planned transactions and creating notifications
 */
export class NotificationService {
  /**
   * Check for planned transactions/income that have reached their target date
   * and create notifications if they don't already exist
   */
  async checkAndCreateNotifications(userId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Check planned expenses
    const plannedExpenses = await plannedRepository.getPlannedByUserId(userId);
    for (const planned of plannedExpenses) {
      // Only check if status is "planned" and target date has arrived
      if (planned.status === "planned" && planned.targetDate <= todayStr) {
        // Check if notification already exists
        const existingNotifications = await notificationRepository.getNotificationsByUserId(userId);
        const hasNotification = existingNotifications.some(
          n => n.plannedTransactionId === planned.id && 
               n.status !== "completed" && 
               n.status !== "dismissed"
        );

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
        }
      }
    }

    // Check planned income
    const plannedIncomes = await plannedIncomeRepository.getPlannedIncomeByUserId(userId, { status: "pending" });
    for (const income of plannedIncomes) {
      // Only check if status is "pending" and expected date has arrived
      if (income.status === "pending" && income.expectedDate <= todayStr) {
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
  }
}

export const notificationService = new NotificationService();

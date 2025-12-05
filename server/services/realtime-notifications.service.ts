/**
 * Real-time Notifications Service
 *
 * Sends WebSocket notifications for budget alerts, transactions, etc.
 */

import { sendNotificationToUser, NotificationEvent } from '../lib/websocket';
import { db } from '../db';
import { budgets, transactions } from '@shared/schema';
import { eq, and, gte, lte, sum } from 'drizzle-orm';
import logger from '../lib/logger';

/**
 * Check if transaction exceeds budget and send alert
 */
export async function checkBudgetAlert(params: {
  userId: number;
  categoryId: number;
  amount: number;
  transactionDate: string;
}): Promise<void> {
  try {
    const { userId, categoryId, amount, transactionDate } = params;

    // Get active budget for this category
    const [budget] = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.categoryId, categoryId)
        )
      )
      .limit(1);

    if (!budget) {
      // No budget set for this category
      return;
    }

    // Calculate current spending for this month
    const date = new Date(transactionDate);
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const result = await db
      .select({
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.categoryId, categoryId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, firstDay.toISOString().split('T')[0]),
          lte(transactions.date, lastDay.toISOString().split('T')[0])
        )
      );

    const currentSpending = parseFloat(result[0]?.total || '0');
    const budgetLimit = parseFloat(budget.limitAmount);
    const percentage = (currentSpending / budgetLimit) * 100;

    logger.info('Budget check', {
      userId,
      categoryId,
      currentSpending,
      budgetLimit,
      percentage: percentage.toFixed(1),
    });

    // Send alert if 80% reached
    if (percentage >= 80 && percentage < 100) {
      sendNotificationToUser(userId, NotificationEvent.BUDGET_WARNING, {
        categoryId,
        categoryName: `Category ${categoryId}`,
        currentSpending,
        budgetLimit,
        percentage: percentage.toFixed(1),
        remaining: budgetLimit - currentSpending,
        message: `You've used ${percentage.toFixed(0)}% of your budget for this category`,
      });
    }

    // Send alert if budget exceeded
    if (percentage >= 100) {
      sendNotificationToUser(userId, NotificationEvent.BUDGET_EXCEEDED, {
        categoryId,
        categoryName: `Category ${categoryId}`,
        currentSpending,
        budgetLimit,
        percentage: percentage.toFixed(1),
        exceeded: currentSpending - budgetLimit,
        message: `Budget exceeded! You've spent ${percentage.toFixed(0)}% of your budget for this category`,
      });
    }
  } catch (error: unknown) {
    logger.error('Failed to check budget alert', {
      error: error instanceof Error ? error.message : String(error),
      ...params,
    });
  }
}

/**
 * Send transaction created notification
 */
export function notifyTransactionCreated(params: {
  userId: number;
  transaction: {
    id: number;
    type: string;
    amount: string;
    description: string;
    category?: string | null;
    date: string;
  };
}): void {
  try {
    const { userId, transaction } = params;

    sendNotificationToUser(userId, NotificationEvent.TRANSACTION_CREATED, {
      transactionId: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      category: transaction.category,
      date: transaction.date,
      message: `New ${transaction.type}: ${transaction.description} - $${transaction.amount}`,
    });
  } catch (error: unknown) {
    logger.error('Failed to send transaction notification', {
      error: error instanceof Error ? error.message : String(error),
      userId: params.userId,
    });
  }
}

/**
 * Send exchange rate update notification
 */
export function notifyExchangeRateUpdate(params: {
  currencies: Record<string, number>;
  source: string;
}): void {
  try {
    const { currencies, source } = params;

    // Broadcast to all connected users
    const { broadcastNotification } = require('../lib/websocket');

    broadcastNotification(NotificationEvent.EXCHANGE_RATE_UPDATED, {
      currencies,
      source,
      timestamp: new Date().toISOString(),
      message: 'Exchange rates updated',
    });
  } catch (error: unknown) {
    logger.error('Failed to send exchange rate notification', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Send wallet balance low notification
 */
export function notifyLowBalance(params: {
  userId: number;
  walletId: number;
  walletName: string;
  balance: string;
  threshold: number;
}): void {
  try {
    const { userId, walletId, walletName, balance, threshold } = params;

    sendNotificationToUser(userId, NotificationEvent.WALLET_BALANCE_LOW, {
      walletId,
      walletName,
      balance,
      threshold,
      message: `Low balance alert: ${walletName} has only $${balance} remaining`,
    });
  } catch (error: unknown) {
    logger.error('Failed to send low balance notification', {
      error: error instanceof Error ? error.message : String(error),
      userId: params.userId,
    });
  }
}

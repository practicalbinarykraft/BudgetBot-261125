/**
 * Forecast Service Utilities
 *
 * Helper functions for data fetching and calculations
 * Junior-Friendly: <100 lines, focused on data processing
 */

import { storage } from "../../storage";
import type { Transaction, Recurring } from "@shared/schema";
import type { HistoricalStats } from "./types";

/**
 * Get historical transactions for analysis
 *
 * @param userId User ID
 * @param days Number of days to look back
 * @returns Filtered transactions from last N days
 */
export async function getHistoricalTransactions(
  userId: number,
  days: number
): Promise<Transaction[]> {
  const { transactions } = await storage.getTransactionsByUserId(userId);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return transactions.filter(t => new Date(t.date) >= cutoffDate);
}

/**
 * Calculate historical statistics from transactions
 *
 * @param transactions Historical transactions
 * @returns Stats object with averages and totals
 */
export function calculateHistoricalStats(transactions: Transaction[]): HistoricalStats {
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');

  const totalIncome = incomeTransactions.reduce(
    (sum, t) => sum + parseFloat(t.amountUsd as unknown as string),
    0
  );
  const totalExpense = expenseTransactions.reduce(
    (sum, t) => sum + parseFloat(t.amountUsd as unknown as string),
    0
  );

  const days = transactions.length > 0 ? 90 : 1; // Avoid division by zero

  return {
    avgDailyIncome: totalIncome / days,
    avgDailyExpense: totalExpense / days,
    totalIncome,
    totalExpense,
    incomeCount: incomeTransactions.length,
    expenseCount: expenseTransactions.length,
  };
}

/**
 * Check if recurring payment applies to given date
 *
 * @param recurring Recurring payment object
 * @param date Target date to check
 * @returns True if payment should occur on this date
 */
export function shouldApplyRecurring(recurring: Recurring, date: Date): boolean {
  const nextDate = new Date(recurring.nextDate);

  if (date < nextDate) {
    return false;
  }

  const daysDiff = Math.floor(
    (date.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  switch (recurring.frequency) {
    case 'weekly':
      return daysDiff % 7 === 0;
    case 'monthly':
      return date.getDate() === nextDate.getDate();
    case 'yearly':
      return (
        date.getDate() === nextDate.getDate() &&
        date.getMonth() === nextDate.getMonth()
      );
    default:
      return false;
  }
}

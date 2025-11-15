import { db } from '../db';
import { transactions, budgets } from '@shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { startOfMonth, subMonths, format } from 'date-fns';

/**
 * Budget Statistics Service
 * 
 * Provides reusable stats calculations to avoid N+1 queries
 * Used by goal predictor and budget progress components
 */

export interface MonthlyStats {
  income: number;
  expenses: number;
  freeCapital: number;
}

/**
 * Calculate average monthly income and expenses
 * Uses last 3 months of data for more accurate predictions
 * 
 * Guards: Returns safe defaults for new users with no transactions
 */
export async function getMonthlyStats(userId: number): Promise<MonthlyStats> {
  const threeMonthsAgo = format(subMonths(startOfMonth(new Date()), 3), 'yyyy-MM-dd');

  const result = await db
    .select({
      totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN CAST(${transactions.amountUsd} AS NUMERIC) ELSE 0 END), 0)`,
      totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN CAST(${transactions.amountUsd} AS NUMERIC) ELSE 0 END), 0)`,
      months: sql<number>`COUNT(DISTINCT DATE_TRUNC('month', ${transactions.date}))`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, threeMonthsAgo)
      )
    );

  // Guard: handle new users with no transactions
  const data = result[0] ?? { totalIncome: 0, totalExpenses: 0, months: 0 };
  const monthCount = Math.max(data.months || 1, 1);
  const avgIncome = data.totalIncome / monthCount;
  const avgExpenses = data.totalExpenses / monthCount;

  return {
    income: avgIncome,
    expenses: avgExpenses,
    freeCapital: avgIncome - avgExpenses,
  };
}

/**
 * Calculate total monthly budget limits
 * 
 * Guards: Returns 0 for users with no budgets set
 */
export async function getTotalBudgetLimits(userId: number): Promise<number> {
  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(${budgets.limitAmount} AS NUMERIC)), 0)`,
    })
    .from(budgets)
    .where(
      and(
        eq(budgets.userId, userId),
        eq(budgets.period, 'month')
      )
    );

  // Guard: handle users with no budgets
  return result[0]?.total ?? 0;
}

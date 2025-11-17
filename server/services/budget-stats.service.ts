import { db } from '../db';
import { transactions, budgets, recurring } from '@shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { startOfMonth, subMonths, format } from 'date-fns';
import { convertToUSD } from './currency-service';

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
 * Calculate monthly recurring income and expenses
 * 
 * Normalizes all frequencies to monthly equivalents:
 * - monthly: 1x
 * - weekly: 4.33x (52 weeks / 12 months)
 * - yearly: 1/12x
 * 
 * Only includes active recurring transactions
 */
async function getMonthlyRecurringStats(userId: number): Promise<{ income: number; expenses: number }> {
  const activeRecurring = await db
    .select()
    .from(recurring)
    .where(
      and(
        eq(recurring.userId, userId),
        eq(recurring.isActive, true)
      )
    );

  let monthlyIncome = 0;
  let monthlyExpenses = 0;

  for (const rec of activeRecurring) {
    // Backfill for legacy recurring (amountUsd might be NULL)
    let amountUsd = parseFloat(rec.amountUsd as unknown as string || '0');
    
    if (isNaN(amountUsd) || amountUsd === 0) {
      // Legacy recurring without amountUsd: calculate on-the-fly
      const amount = parseFloat(rec.amount as unknown as string || '0');
      const currency = rec.currency || 'USD';
      amountUsd = currency === 'USD' ? amount : convertToUSD(amount, currency);
    }
    
    if (isNaN(amountUsd) || amountUsd === 0) continue;
    
    let monthlyAmount = amountUsd;

    if (rec.frequency === 'weekly') {
      monthlyAmount = amountUsd * 4.33;
    } else if (rec.frequency === 'yearly') {
      monthlyAmount = amountUsd / 12;
    }

    if (rec.type === 'income') {
      monthlyIncome += monthlyAmount;
    } else if (rec.type === 'expense') {
      monthlyExpenses += monthlyAmount;
    }
  }

  return { income: monthlyIncome, expenses: monthlyExpenses };
}

/**
 * Calculate average monthly income and expenses
 * Uses last 3 months of data + active recurring transactions
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
  
  // If no transactions exist, avgIncome/avgExpenses should be 0 (not NaN)
  // This allows recurring-only users to get predictions
  let avgIncome = 0;
  let avgExpenses = 0;
  
  if (data.months > 0) {
    avgIncome = data.totalIncome / data.months;
    avgExpenses = data.totalExpenses / data.months;
  }

  // Add recurring transactions (normalized to monthly)
  const recurringStats = await getMonthlyRecurringStats(userId);

  return {
    income: avgIncome + recurringStats.income,
    expenses: avgExpenses + recurringStats.expenses,
    freeCapital: (avgIncome + recurringStats.income) - (avgExpenses + recurringStats.expenses),
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

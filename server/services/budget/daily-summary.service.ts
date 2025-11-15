import { db } from '../../db';
import { recurring, transactions } from '@shared/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { checkLimitsCompliance, LimitCheck } from './limits-checker.service';
import { format, startOfDay, endOfDay, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export interface PlannedExpense {
  description: string;
  amount: number;
  date: string;
}

export interface DailySummaryData {
  todayExpenses: PlannedExpense[];
  todayTotal: number;
  weekExpenses: PlannedExpense[];
  weekTotal: number;
  budgetAlerts: LimitCheck[];
  availableCapital: number;
  monthIncome: number;
  monthExpenses: number;
}

/**
 * Get planned expenses for today (from recurring payments)
 * 
 * Checks recurring payments where nextDate equals today
 */
async function getTodayPlannedExpenses(
  userId: number,
  timezone: string
): Promise<PlannedExpense[]> {
  const today = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');

  const recurringExpenses = await db
    .select()
    .from(recurring)
    .where(
      and(
        eq(recurring.userId, userId),
        eq(recurring.type, 'expense'),
        eq(recurring.isActive, true),
        eq(recurring.nextDate, today)
      )
    );

  return recurringExpenses.map(exp => ({
    description: exp.description,
    amount: parseFloat(exp.amount),
    date: exp.nextDate,
  }));
}

/**
 * Get planned expenses for this week (next 7 days)
 * 
 * Includes all recurring payments scheduled for the next week
 */
async function getWeekPlannedExpenses(
  userId: number,
  timezone: string
): Promise<PlannedExpense[]> {
  const today = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
  const weekEnd = formatInTimeZone(addDays(new Date(), 7), timezone, 'yyyy-MM-dd');

  const recurringExpenses = await db
    .select()
    .from(recurring)
    .where(
      and(
        eq(recurring.userId, userId),
        eq(recurring.type, 'expense'),
        eq(recurring.isActive, true),
        gte(recurring.nextDate, today),
        lte(recurring.nextDate, weekEnd)
      )
    );

  return recurringExpenses.map(exp => ({
    description: exp.description,
    amount: parseFloat(exp.amount),
    date: exp.nextDate,
  }));
}

/**
 * Calculate available capital for current month
 * 
 * Returns: monthIncome - monthExpenses
 */
async function getMonthlyCapital(userId: number): Promise<{
  income: number;
  expenses: number;
  available: number;
}> {
  const now = new Date();
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

  // Get month income
  const incomeResult = await db
    .select({
      total: sql<string>`COALESCE(SUM(${transactions.amountUsd}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'income'),
        gte(transactions.date, monthStart),
        lte(transactions.date, monthEnd)
      )
    );

  // Get month expenses
  const expensesResult = await db
    .select({
      total: sql<string>`COALESCE(SUM(${transactions.amountUsd}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'expense'),
        gte(transactions.date, monthStart),
        lte(transactions.date, monthEnd)
      )
    );

  const income = parseFloat(incomeResult[0]?.total || '0');
  const expenses = parseFloat(expensesResult[0]?.total || '0');
  const available = income - expenses;

  return { income, expenses, available };
}

/**
 * Generate complete daily summary data
 * 
 * Includes:
 * - Today's planned expenses
 * - Week's upcoming expenses
 * - Budget status (warnings/exceeded)
 * - Available capital
 */
export async function generateDailySummary(
  userId: number,
  timezone: string
): Promise<DailySummaryData> {
  // Get planned expenses
  const todayExpenses = await getTodayPlannedExpenses(userId, timezone);
  const weekExpenses = await getWeekPlannedExpenses(userId, timezone);

  // Calculate totals
  const todayTotal = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const weekTotal = weekExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Get budget compliance
  const compliance = await checkLimitsCompliance(userId);
  
  // Filter only warnings and exceeded (caution+ alerts)
  const budgetAlerts = compliance.results.filter(
    result => result.status === 'warning' || result.status === 'exceeded'
  );

  // Get monthly capital
  const capital = await getMonthlyCapital(userId);

  return {
    todayExpenses,
    todayTotal,
    weekExpenses,
    weekTotal,
    budgetAlerts,
    availableCapital: capital.available,
    monthIncome: capital.income,
    monthExpenses: capital.expenses,
  };
}

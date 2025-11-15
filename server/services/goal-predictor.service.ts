import { db } from '../db';
import { transactions, budgets, categories } from '@shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { startOfMonth, subMonths, format } from 'date-fns';

/**
 * Goal Predictor Service
 * 
 * Calculates when user can afford wishlist items based on:
 * - Monthly income vs expenses
 * - Budget limits (if user stays within limits)
 * - Current spending patterns
 */

interface MonthlyStats {
  income: number;
  expenses: number;
  freeCapital: number;
}

interface GoalPrediction {
  canAfford: boolean;
  monthsToGoal: number;
  targetDate: string | null;
  capitalLeft: number;
  monthlyFreeCapital: number;
  warning: string | null;
}

interface BudgetComparison {
  withinLimits: GoalPrediction;
  currentPace: GoalPrediction;
}

/**
 * Calculate average monthly income and expenses
 * Uses last 3 months of data for more accurate predictions
 * 
 * EXPORTED for reuse in routes to avoid N+1 queries
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
 * EXPORTED for reuse in routes to avoid N+1 queries
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

/**
 * Predict when user can afford a goal
 */
function calculatePrediction(
  goalAmount: number,
  monthlyFreeCapital: number
): GoalPrediction {
  if (monthlyFreeCapital <= 0) {
    return {
      canAfford: false,
      monthsToGoal: Infinity,
      targetDate: null,
      capitalLeft: monthlyFreeCapital,
      monthlyFreeCapital,
      warning: 'Ваши расходы превышают доходы. Сначала нужно сократить траты!',
    };
  }

  const monthsToGoal = Math.ceil(goalAmount / monthlyFreeCapital);
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + monthsToGoal);

  const totalSaved = monthlyFreeCapital * monthsToGoal;
  const capitalLeft = totalSaved - goalAmount;

  return {
    canAfford: true,
    monthsToGoal,
    targetDate: format(targetDate, 'yyyy-MM-dd'),
    capitalLeft,
    monthlyFreeCapital,
    warning: null,
  };
}

/**
 * Predict goal with pre-computed stats (avoid N+1 queries)
 * Use this in routes to reuse stats across multiple items
 */
export function predictGoalWithStats(
  goalAmount: number,
  stats: MonthlyStats,
  budgetLimits: number
): BudgetComparison {
  // Scenario 1: Current spending pace
  const currentPace = calculatePrediction(goalAmount, stats.freeCapital);

  // Scenario 2: If user stays within budget limits
  let withinLimits: GoalPrediction;
  
  if (budgetLimits > 0) {
    const freeCapitalWithLimits = stats.income - budgetLimits;
    withinLimits = calculatePrediction(goalAmount, freeCapitalWithLimits);
  } else {
    // No budgets set - same as current pace
    withinLimits = currentPace;
  }

  return {
    withinLimits,
    currentPace,
  };
}

/**
 * Main function: Predict goal achievement with budget comparison
 * For single-item predictions (backward compatible)
 */
export async function predictGoal(
  userId: number,
  goalAmount: number
): Promise<BudgetComparison> {
  const stats = await getMonthlyStats(userId);
  const budgetLimits = await getTotalBudgetLimits(userId);
  return predictGoalWithStats(goalAmount, stats, budgetLimits);
}

/**
 * Check if user is close to budget limit (>80%)
 */
export async function getBudgetAlerts(userId: number): Promise<Array<{
  categoryId: number;
  categoryName: string;
  spent: number;
  limit: number;
  percentUsed: number;
  amountLeft: number;
}>> {
  const startOfCurrentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const budgetData = await db
    .select({
      categoryId: budgets.categoryId,
      categoryName: categories.name,
      limitAmount: budgets.limitAmount,
    })
    .from(budgets)
    .leftJoin(categories, eq(budgets.categoryId, categories.id))
    .where(
      and(
        eq(budgets.userId, userId),
        eq(budgets.period, 'month')
      )
    );

  const alerts = [];

  for (const budget of budgetData) {
    const spentResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${transactions.amountUsd} AS NUMERIC)), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          eq(transactions.categoryId, budget.categoryId),
          gte(transactions.date, startOfCurrentMonth)
        )
      );

    const spent = spentResult[0]?.total || 0;
    const limit = parseFloat(budget.limitAmount);
    
    // Skip if limit is 0 or invalid (avoid division by zero)
    if (!limit || limit <= 0) {
      continue;
    }
    
    const percentUsed = (spent / limit) * 100;
    const amountLeft = limit - spent;

    if (percentUsed >= 80) {
      alerts.push({
        categoryId: budget.categoryId,
        categoryName: budget.categoryName || 'Unknown',
        spent,
        limit,
        percentUsed,
        amountLeft,
      });
    }
  }

  return alerts;
}

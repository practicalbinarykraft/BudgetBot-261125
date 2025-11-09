/**
 * Budget Helpers - Reusable utilities for budget calculations
 * 
 * These functions are shared between:
 * - budgets-page.tsx (budget management UI)
 * - budget-alerts.tsx (dashboard alerts)
 * 
 * ⏰ All date parsing uses parseISO() to prevent timezone bugs
 */

import { 
  parseISO, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear 
} from "date-fns";
import type { Budget, Transaction } from "@shared/schema";

/**
 * Calculate the date range for a budget period
 * 
 * @param budget - Budget with period (week/month/year) and startDate
 * @returns Object with start and end Date objects
 * 
 * @example
 * const budget = { period: "month", startDate: "2024-01-15", ... }
 * const { start, end } = getBudgetPeriodDates(budget)
 * // start: Jan 1, 2024, end: Jan 31, 2024
 */
export function getBudgetPeriodDates(budget: Budget): { start: Date; end: Date } {
  // ⏰ parseISO correctly parses "2024-01-15" without timezone shifts
  const startDate = parseISO(budget.startDate);
  
  switch (budget.period) {
    case "week":
      return {
        start: startOfWeek(startDate, { weekStartsOn: 1 }), // Monday
        end: endOfWeek(startDate, { weekStartsOn: 1 }),
      };
    case "month":
      return {
        start: startOfMonth(startDate),
        end: endOfMonth(startDate),
      };
    case "year":
      return {
        start: startOfYear(startDate),
        end: endOfYear(startDate),
      };
    default:
      throw new Error(`Invalid budget period: ${budget.period}`);
  }
}

/**
 * Calculate budget spending progress and status
 * 
 * Filters transactions by:
 * - Matching category name
 * - Type = "expense"
 * - Date within budget period
 * 
 * @param budget - Budget with limitAmount and period info
 * @param transactions - All user transactions
 * @param categoryName - Category name to filter by
 * @returns Object with spent amount, percentage, and status
 * 
 * Status thresholds:
 * - "ok": < 80% of limit
 * - "warning": 80-99% of limit
 * - "exceeded": >= 100% of limit
 */
export function calculateBudgetProgress(
  budget: Budget,
  transactions: Transaction[],
  categoryName: string
): { spent: number; percentage: number; status: "ok" | "warning" | "exceeded" } {
  const { start, end } = getBudgetPeriodDates(budget);
  
  // Filter transactions by category, type, and date range
  const categoryTransactions = transactions.filter((t) => {
    // ⏰ parseISO prevents timezone bugs when comparing dates
    const transactionDate = parseISO(t.date);
    return (
      t.category === categoryName &&
      t.type === "expense" &&
      transactionDate >= start &&
      transactionDate <= end
    );
  });

  // Sum up spending in USD
  const spent = categoryTransactions.reduce(
    (sum, t) => sum + parseFloat(t.amountUsd),
    0
  );

  const limitAmount = parseFloat(budget.limitAmount);
  const percentage = limitAmount > 0 ? (spent / limitAmount) * 100 : 0;

  // Determine status based on percentage
  let status: "ok" | "warning" | "exceeded" = "ok";
  if (percentage >= 100) {
    status = "exceeded";
  } else if (percentage >= 80) {
    status = "warning";
  }

  return { spent, percentage, status };
}

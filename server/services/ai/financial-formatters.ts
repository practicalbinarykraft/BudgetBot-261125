import type { Transaction, Budget, Wallet, Category } from "@shared/schema";

/**
 * Financial Data Formatters
 * Formats financial data sections for AI consumption
 * 
 * Sprint 4.2: Junior-Friendly utilities (<200 lines)
 */

/**
 * Format wallets section
 */
export function formatWallets(wallets: Wallet[]): string {
  const totalBalance = wallets.reduce((sum, w) => {
    const balance = parseFloat(w.balanceUsd || w.balance || "0");
    return sum + (isNaN(balance) ? 0 : balance);
  }, 0);

  const walletList = wallets
    .map(w => {
      const balance = parseFloat(w.balanceUsd || w.balance || "0");
      const safeBalance = isNaN(balance) ? 0 : balance;
      return `- ${w.name}: $${safeBalance.toFixed(2)} (${w.currency})`;
    })
    .join("\n");

  return `WALLETS (Total: $${totalBalance.toFixed(2)})\n${walletList}`;
}

/**
 * Format transactions section
 */
export function formatTransactions(
  transactions: Transaction[],
  categories: Category[],
  days: number
): string {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  
  // Sort by date DESC to get most recent transactions
  const sorted = [...transactions].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  const recentTransactions = sorted
    .slice(0, 10)
    .map(t => {
      const category = t.categoryId ? categoryMap.get(t.categoryId) || "Uncategorized" : "Uncategorized";
      const amount = parseFloat(t.amountUsd || t.amount || "0");
      const safeAmount = isNaN(amount) ? 0 : amount;
      const sign = t.type === "income" ? "+" : "-";
      return `- ${t.date}: ${sign}$${safeAmount.toFixed(2)} - ${t.description || category}`;
    })
    .join("\n");

  return `RECENT TRANSACTIONS (Last ${days} days)\n${recentTransactions}`;
}

/**
 * Format budgets section
 * Note: Simplified for Sprint 4.2 - shows budget limits only (utilization tracking deferred)
 */
export function formatBudgets(
  budgets: Budget[],
  categories: Category[],
  _transactions: Transaction[]
): string {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  
  const budgetList = budgets
    .map(b => {
      const category = b.categoryId ? categoryMap.get(b.categoryId) || "Unknown" : "Overall";
      const limit = parseFloat(b.limitAmount);
      
      return `- ${category}: $${limit.toFixed(2)} ${b.period} limit`;
    })
    .join("\n");

  return `BUDGETS (limits only)\n${budgetList}\n\nNote: Budget utilization tracking will be added in a future update.`;
}

/**
 * Format financial summary with safe division
 */
export function formatFinancialSummary(
  transactions: Transaction[],
  budgets: Budget[],
  days: number
): string {
  // Guard against invalid days
  const safeDays = Math.max(1, days);
  
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => {
      const amount = parseFloat(t.amountUsd || t.amount || "0");
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

  const expenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => {
      const amount = parseFloat(t.amountUsd || t.amount || "0");
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

  const netCashflow = income - expenses;
  const avgDailyExpense = expenses / safeDays;

  const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.limitAmount), 0);

  return `SUMMARY (Last ${safeDays} days)
- Income: $${income.toFixed(2)}
- Expenses: $${expenses.toFixed(2)}
- Net Cashflow: $${netCashflow.toFixed(2)}
- Avg Daily Expense: $${avgDailyExpense.toFixed(2)}
${budgets.length > 0 ? `- Total Budget Limit: $${totalBudget.toFixed(2)}` : ""}`;
}

/**
 * Calculate period end date based on period type
 */
export function calculatePeriodEnd(startDate: Date, period: string): Date {
  const end = new Date(startDate);
  
  switch (period) {
    case "week":
      end.setDate(end.getDate() + 7);
      break;
    case "month":
      end.setMonth(end.getMonth() + 1);
      break;
    case "year":
      end.setFullYear(end.getFullYear() + 1);
      break;
    default:
      end.setMonth(end.getMonth() + 1); // Default to month
  }
  
  return end;
}


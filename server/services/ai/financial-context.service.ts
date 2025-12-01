import type { Transaction, Budget, Wallet, Category } from "@shared/schema";
import {
  formatWallets,
  formatTransactions,
  formatBudgets,
  formatFinancialSummary
} from "./financial-formatters";

/**
 * Financial Context Builder
 * Gathers user's financial data and formats it for AI consumption
 * 
 * Sprint 4.2: Junior-Friendly Implementation (<200 lines)
 */

export interface FinancialContextOptions {
  userId: number;
  includeTransactions?: boolean;
  includeBudgets?: boolean;
  includeWallets?: boolean;
  transactionDays?: number; // Last N days of transactions
}

/**
 * Build comprehensive financial context for AI
 */
export async function buildFinancialContext(
  options: FinancialContextOptions
): Promise<string> {
  const { storage } = await import("../../storage");
  
  const {
    userId,
    includeTransactions = true,
    includeBudgets = true,
    includeWallets = true,
    transactionDays = 30
  } = options;

  const sections: string[] = [];

  // Calculate transaction date range (simple, not extended for budgets)
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - transactionDays);
  const fromDateStr = fromDate.toISOString().split('T')[0];
  
  // Fetch all data in parallel
  const [transactionsResult, budgetsResult, walletsResult, categoriesResult] = await Promise.all([
    includeTransactions
      ? storage.getTransactionsByUserId(userId, { from: fromDateStr })
      : Promise.resolve({ transactions: [], total: 0 }),
    includeBudgets
      ? storage.getBudgetsByUserId(userId)
      : Promise.resolve({ budgets: [], total: 0 }),
    includeWallets
      ? storage.getWalletsByUserId(userId)
      : Promise.resolve({ wallets: [], total: 0 }),
    storage.getCategoriesByUserId(userId)
  ]);

  const transactions = transactionsResult.transactions;
  const budgets = budgetsResult.budgets;
  const wallets = walletsResult.wallets;
  const categories = categoriesResult.categories;

  // Build context sections
  if (includeWallets && wallets.length > 0) {
    sections.push(formatWallets(wallets));
  }

  if (includeTransactions && transactions.length > 0) {
    sections.push(formatTransactions(transactions, categories, transactionDays));
  }

  if (includeBudgets && budgets.length > 0) {
    sections.push(formatBudgets(budgets, categories, transactions));
  }

  // Add summary statistics
  if (transactions.length > 0) {
    sections.push(formatFinancialSummary(transactions, budgets, transactionDays));
  }

  // Provide fallback if no data
  if (sections.length === 0) {
    return "No financial data available yet. Start tracking your income and expenses to get personalized advice.";
  }

  return sections.join("\n\n");
}

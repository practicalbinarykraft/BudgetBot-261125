import { IStorage } from '../storage';
import { Transaction, Budget } from '@shared/schema';
import { startOfDay, subDays } from 'date-fns';

export interface FinancialHealthScore {
  score: number;
  status: string;
  metrics: {
    budgetAdherence: number;
    cashflowBalance: number;
    expenseStability: number;
  };
}

export async function calculateFinancialHealth(
  storage: IStorage,
  userId: number,
  daysWindow: number = 30
): Promise<FinancialHealthScore> {
  const today = new Date();
  const startDate = startOfDay(subDays(today, daysWindow));
  const previousStartDate = startOfDay(subDays(today, daysWindow * 2));

  // Fetch data once for both periods
  const [transactionsResult, budgetsResult, categoriesResult] = await Promise.all([
    storage.getTransactionsByUserId(userId),
    storage.getBudgetsByUserId(userId),
    storage.getCategoriesByUserId(userId),
  ]);

  const allTransactions = transactionsResult.transactions;
  const budgets = budgetsResult.budgets;
  const categories = categoriesResult.categories;

  // Filter transactions by date
  const current: Transaction[] = allTransactions.filter((t: Transaction) => new Date(t.date) >= startDate);
  const previous: Transaction[] = allTransactions.filter(
    (t: Transaction) => new Date(t.date) >= previousStartDate && new Date(t.date) < startDate
  );

  // 1. Budget Adherence (40%) - percentage of budgets not exceeded
  let budgetAdherence = 50; // neutral default
  if (budgets.length > 0) {
    const adherentBudgets = budgets.filter((budget: Budget) => {
      // Find category name for this budget
      const category = categories.find(c => c.id === budget.categoryId);
      const categoryName = category?.name || '';
      
      const spent = current
        .filter((t: Transaction) => t.type === 'expense' && (
          t.categoryId === budget.categoryId || t.category === categoryName
        ))
        .reduce((sum: number, t: Transaction) => sum + Number(t.amountUsd), 0);
      return spent <= Number(budget.limitAmount);
    });
    budgetAdherence = (adherentBudgets.length / budgets.length) * 100;
  }

  // 2. Cashflow Balance (35%) - income vs expenses ratio
  const currentIncome = current
    .filter((t: Transaction) => t.type === 'income')
    .reduce((sum: number, t: Transaction) => sum + Number(t.amountUsd), 0);
  const currentExpenses = current
    .filter((t: Transaction) => t.type === 'expense')
    .reduce((sum: number, t: Transaction) => sum + Number(t.amountUsd), 0);

  let cashflowBalance = 50; // neutral default
  if (currentIncome > 0 || currentExpenses > 0) {
    const savingsRate = currentIncome > 0
      ? ((currentIncome - currentExpenses) / currentIncome) * 100
      : -100;
    
    // Map savings rate to 0-100 scale
    // -100% (spending > 2x income) = 0
    // 0% (break even) = 50
    // 50%+ (saving half) = 100
    cashflowBalance = Math.max(0, Math.min(100, 50 + savingsRate));
  }

  // 3. Expense Stability (25%) - compare current vs previous expenses
  const previousExpenses = previous
    .filter((t: Transaction) => t.type === 'expense')
    .reduce((sum: number, t: Transaction) => sum + Number(t.amountUsd), 0);

  let expenseStability = 50; // neutral default
  if (previousExpenses > 0 && currentExpenses > 0) {
    const changeRate = ((currentExpenses - previousExpenses) / previousExpenses) * 100;
    
    // Map change rate to 0-100 scale
    // -50%+ decrease = 100 (great!)
    // 0% change = 50
    // 50%+ increase = 0 (concerning)
    expenseStability = Math.max(0, Math.min(100, 50 - changeRate));
  }

  // Calculate weighted score
  const score = Math.round(
    budgetAdherence * 0.4 +
    cashflowBalance * 0.35 +
    expenseStability * 0.25
  );

  // Determine status based on score
  let status: string;
  if (score >= 80) {
    status = 'Excellent';
  } else if (score >= 60) {
    status = 'Stable';
  } else if (score >= 40) {
    status = 'Needs Attention';
  } else {
    status = 'Critical';
  }

  return {
    score,
    status: `${status} financial health`,
    metrics: {
      budgetAdherence: Math.round(budgetAdherence),
      cashflowBalance: Math.round(cashflowBalance),
      expenseStability: Math.round(expenseStability),
    },
  };
}

import { db } from "../db";
import { budgets, transactions, categories } from "@shared/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

// Тип для одного лимита с прогрессом
export interface LimitProgress {
  budgetId: number;
  categoryId: number;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  limitAmount: string; // Decimal from DB
  spent: number;
  period: string; // 'week', 'month', 'year'
  periodStart: string; // Date ISO string
  periodEnd: string; // Date ISO string
  percentage: number;
}

// Вычислить дату конца периода на основе startDate и period
function calculatePeriodEnd(startDate: string, period: string): string {
  const date = new Date(startDate);
  
  switch (period) {
    case 'week':
      date.setDate(date.getDate() + 7);
      break;
    case 'month':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'year':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Получить все лимиты с прогрессом для пользователя
export async function getBudgetProgress(userId: number): Promise<LimitProgress[]> {
  // 1. Получаем все бюджеты пользователя с категориями
  const userBudgets = await db
    .select({
      budgetId: budgets.id,
      categoryId: budgets.categoryId,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      limitAmount: budgets.limitAmount,
      period: budgets.period,
      startDate: budgets.startDate,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .where(eq(budgets.userId, userId));

  // 2. Для каждого бюджета вычисляем spent
  const results: LimitProgress[] = [];
  
  for (const budget of userBudgets) {
    const periodEnd = calculatePeriodEnd(budget.startDate, budget.period);
    
    // Получаем сумму расходов для категории за период
    const spentResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${transactions.amountUsd}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          eq(transactions.categoryId, budget.categoryId),
          gte(transactions.date, budget.startDate),
          lte(transactions.date, periodEnd)
        )
      );

    const spent = parseFloat(spentResult[0]?.total || '0');
    const limit = parseFloat(budget.limitAmount);
    const percentage = limit > 0 ? (spent / limit) * 100 : 0;

    results.push({
      budgetId: budget.budgetId,
      categoryId: budget.categoryId,
      categoryName: budget.categoryName,
      categoryIcon: budget.categoryIcon,
      categoryColor: budget.categoryColor,
      limitAmount: budget.limitAmount,
      spent,
      period: budget.period,
      periodStart: budget.startDate,
      periodEnd,
      percentage,
    });
  }

  return results;
}

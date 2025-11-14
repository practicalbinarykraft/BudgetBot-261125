import { db } from '../../db';
import { transactions, categories } from '@shared/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export interface CategoryBreakdownItem {
  id: number;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface BreakdownResponse {
  total: number;
  items: CategoryBreakdownItem[];
}

export async function getCategoryBreakdown(
  userId: number,
  startDate: string,
  endDate: string
): Promise<BreakdownResponse> {
  const results = await db
    .select({
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      total: sql<string>`cast(sum(${transactions.amountUsd}) as text)`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'expense'),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
      )
    )
    .groupBy(
      transactions.categoryId,
      categories.name,
      categories.icon,
      categories.color
    )
    .orderBy(sql`sum(${transactions.amountUsd}) desc`);

  const totalAmount = results.reduce((sum, r) => sum + parseFloat(r.total || '0'), 0);

  const items: CategoryBreakdownItem[] = results
    .filter(r => r.categoryId !== null)
    .map(r => ({
      id: r.categoryId!,
      name: r.categoryName || 'Unknown',
      icon: r.categoryIcon || 'Tag',
      color: r.categoryColor || '#3b82f6',
      amount: parseFloat(r.total || '0'),
      percentage: totalAmount > 0 ? (parseFloat(r.total || '0') / totalAmount) * 100 : 0,
    }));

  return {
    total: totalAmount,
    items,
  };
}

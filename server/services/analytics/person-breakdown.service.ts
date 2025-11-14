import { db } from '../../db';
import { transactions, personalTags } from '@shared/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export interface PersonBreakdownItem {
  id: number;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface BreakdownResponse {
  total: number;
  items: PersonBreakdownItem[];
}

export async function getPersonBreakdown(
  userId: number,
  startDate: string,
  endDate: string
): Promise<BreakdownResponse> {
  const results = await db
    .select({
      tagId: transactions.personalTagId,
      tagName: personalTags.name,
      tagIcon: personalTags.icon,
      tagColor: personalTags.color,
      total: sql<string>`cast(sum(${transactions.amountUsd}) as text)`,
    })
    .from(transactions)
    .leftJoin(personalTags, eq(transactions.personalTagId, personalTags.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'expense'),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
      )
    )
    .groupBy(
      transactions.personalTagId,
      personalTags.name,
      personalTags.icon,
      personalTags.color
    )
    .orderBy(sql`sum(${transactions.amountUsd}) desc`);

  const totalAmount = results.reduce((sum, r) => sum + parseFloat(r.total || '0'), 0);

  const items: PersonBreakdownItem[] = results
    .filter(r => r.tagId !== null)
    .map(r => ({
      id: r.tagId!,
      name: r.tagName || 'Unknown',
      icon: r.tagIcon || 'User',
      color: r.tagColor || '#3b82f6',
      amount: parseFloat(r.total || '0'),
      percentage: totalAmount > 0 ? (parseFloat(r.total || '0') / totalAmount) * 100 : 0,
    }));

  return {
    total: totalAmount,
    items,
  };
}

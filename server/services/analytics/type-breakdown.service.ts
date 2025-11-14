import { db } from '../../db';
import { transactions } from '@shared/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export interface TypeBreakdownItem {
  type: 'essential' | 'discretionary' | 'asset' | 'liability';
  name: string;
  amount: number;
  percentage: number;
}

export interface BreakdownResponse {
  total: number;
  items: TypeBreakdownItem[];
}

const TYPE_NAMES: Record<string, string> = {
  essential: 'Essential',
  discretionary: 'Discretionary',
  asset: 'Assets',
  liability: 'Liabilities',
};

export async function getTypeBreakdown(
  userId: number,
  startDate: string,
  endDate: string
): Promise<BreakdownResponse> {
  const results = await db
    .select({
      financialType: transactions.financialType,
      total: sql<string>`cast(sum(${transactions.amountUsd}) as text)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'expense'),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
      )
    )
    .groupBy(transactions.financialType)
    .orderBy(sql`sum(${transactions.amountUsd}) desc`);

  const totalAmount = results.reduce((sum, r) => sum + parseFloat(r.total || '0'), 0);

  const items: TypeBreakdownItem[] = results.map(r => ({
    type: r.financialType as 'essential' | 'discretionary' | 'asset' | 'liability',
    name: TYPE_NAMES[r.financialType || 'discretionary'] || 'Unknown',
    amount: parseFloat(r.total || '0'),
    percentage: totalAmount > 0 ? (parseFloat(r.total || '0') / totalAmount) * 100 : 0,
  }));

  return {
    total: totalAmount,
    items,
  };
}

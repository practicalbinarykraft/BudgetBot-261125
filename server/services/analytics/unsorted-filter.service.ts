import { db } from '../../db';
import { transactions, personalTags } from '@shared/schema';
import { eq, and, gte, lte, or, isNull } from 'drizzle-orm';
import type { Transaction } from '@shared/schema';

export async function getUnsortedTransactions(
  userId: number,
  startDate: string,
  endDate: string
): Promise<Transaction[]> {
  const undefinedTag = await db
    .select()
    .from(personalTags)
    .where(
      and(
        eq(personalTags.userId, userId),
        eq(personalTags.name, 'Неопределена')
      )
    )
    .limit(1);

  const undefinedTagId = undefinedTag[0]?.id;

  const orConditions = [
    isNull(transactions.personalTagId),
    isNull(transactions.financialType)
  ];
  
  if (undefinedTagId !== undefined) {
    orConditions.push(eq(transactions.personalTagId, undefinedTagId));
  }

  const results = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'expense'),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
        or(...orConditions)
      )
    )
    .orderBy(transactions.date);

  return results;
}

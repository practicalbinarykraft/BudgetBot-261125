import { db } from '../../db';
import { transactions, personalTags } from '@shared/schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function backfillTransactionClassifications(userId: number): Promise<{
  updated: number;
  message: string;
}> {
  let unknownTag = await db.transaction(async (tx) => {
    const existing = await tx.query.personalTags.findFirst({
      where: and(
        eq(personalTags.userId, userId),
        eq(personalTags.name, 'Неопределена')
      )
    });

    if (existing) {
      return existing;
    }

    const [created] = await tx
      .insert(personalTags)
      .values({
        userId,
        name: 'Неопределена',
        icon: 'HelpCircle',
        color: '#9ca3af',
        type: 'person',
        isDefault: true,
        sortOrder: 999
      })
      .returning();
    
    return created;
  });

  const tagUpdates = await db
    .update(transactions)
    .set({
      personalTagId: unknownTag.id,
    })
    .where(
      and(
        eq(transactions.userId, userId),
        isNull(transactions.personalTagId)
      )
    )
    .returning({ id: transactions.id });

  const typeUpdates = await db
    .update(transactions)
    .set({
      financialType: 'discretionary',
    })
    .where(
      and(
        eq(transactions.userId, userId),
        isNull(transactions.financialType)
      )
    )
    .returning({ id: transactions.id });

  const totalUpdated = new Set([...tagUpdates.map(t => t.id), ...typeUpdates.map(t => t.id)]).size;

  return {
    updated: totalUpdated,
    message: `Successfully backfilled ${totalUpdated} transactions (${tagUpdates.length} tag updates, ${typeUpdates.length} type updates)`
  };
}

import { tagRepository } from '../../repositories/tag.repository';
import { transactionRepository } from '../../repositories/transaction.repository';

export async function backfillTransactionClassifications(userId: number): Promise<{
  updated: number;
  message: string;
}> {
  const unknownTag = await tagRepository.findOrCreateUnknownTag(userId);

  const tagUpdates = await transactionRepository.backfillNullTags(userId, unknownTag.id);
  const typeUpdates = await transactionRepository.backfillNullFinancialTypes(userId);

  const totalUpdated = new Set([...tagUpdates.map(t => t.id), ...typeUpdates.map(t => t.id)]).size;

  return {
    updated: totalUpdated,
    message: `Successfully backfilled ${totalUpdated} transactions (${tagUpdates.length} tag updates, ${typeUpdates.length} type updates)`
  };
}

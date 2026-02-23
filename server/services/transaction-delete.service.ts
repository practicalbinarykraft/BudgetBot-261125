/**
 * Atomic Transaction Deletion Service
 *
 * Deletes a transaction and reverses wallet balance in a single DB transaction.
 * Ensures no orphaned balance changes on failure.
 */

import { db } from '../db';
import { transactions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { updateWalletBalance } from './wallet.service';
import { logInfo } from '../lib/logger';

interface DeleteTransactionParams {
  transactionId: number;
  userId: number;
}

/**
 * Delete a transaction and reverse its wallet balance effect atomically.
 *
 * Inside one db.transaction:
 *   1. SELECT the transaction (ownership check via userId)
 *   2. DELETE the transaction row
 *   3. Reverse balance via updateWalletBalance (inverted type)
 *
 * If any step fails, the entire operation rolls back.
 */
export async function deleteTransactionAndReverseBalance(
  params: DeleteTransactionParams
) {
  const { transactionId, userId } = params;

  await db.transaction(async (tx) => {
    // 1. Fetch transaction inside tx (ownership check)
    const [transaction] = await tx
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
      .limit(1);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // 2. Delete the transaction row
    await tx
      .delete(transactions)
      .where(eq(transactions.id, transactionId));

    // 3. Reverse wallet balance (only if transaction has a wallet)
    if (transaction.walletId) {
      const amountUsd = parseFloat(transaction.amountUsd);
      const transactionType = transaction.type as 'income' | 'expense';
      const reverseType = transactionType === 'income' ? 'expense' : 'income';

      await updateWalletBalance(
        transaction.walletId,
        userId,
        amountUsd,
        reverseType,
        tx
      );

      logInfo('Transaction deleted with balance reversal', {
        userId,
        transactionId,
        walletId: transaction.walletId,
        amountUsd,
        originalType: transactionType,
        reverseType,
      });
    } else {
      logInfo('Transaction deleted (no wallet)', { userId, transactionId });
    }
  });
}

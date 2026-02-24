/**
 * Atomic Transaction Create + Balance Update
 *
 * Single entry point for creating a transaction row AND updating wallet balance
 * inside one db.transaction(). Used by Telegram handlers, calibration, and any
 * code that bypasses transactionService.createTransaction().
 *
 * If updateWalletBalance fails (overdraft, NaN, wallet not found), the insert
 * is rolled back — no orphaned transaction rows.
 */

import { db } from '../db';
import { transactionRepository } from '../repositories/transaction.repository';
import { updateWalletBalance } from './wallet.service';
import type { InsertTransaction } from '@shared/schema';

type TxType = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface AtomicCreateInput {
  data: InsertTransaction & { amountUsd: string };
  type: 'income' | 'expense';
  /** Callback to run inside the same tx after insert, before balance update.
   *  Use for receipt items or other dependent inserts. */
  withinTx?: (transactionId: number, tx: TxType) => Promise<void>;
}

/**
 * Insert transaction row + update wallet balance atomically.
 * Optionally runs `withinTx` callback (e.g. receipt items insert) in the same tx.
 */
export async function createTransactionAtomic(input: AtomicCreateInput) {
  const { data, type, withinTx } = input;

  return db.transaction(async (tx) => {
    const row = await transactionRepository.createTransaction(data, tx);

    if (withinTx) {
      await withinTx(row.id, tx);
    }

    if (row.walletId) {
      const amountUsd = parseFloat(row.amountUsd);
      await updateWalletBalance(row.walletId, data.userId, amountUsd, type, tx);
    }

    return row;
  });
}

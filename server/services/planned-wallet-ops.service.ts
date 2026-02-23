import { db } from '../db';
import { transactions } from '@shared/schema';
import { insertTransactionSchema } from '@shared/schema';
import { updateWalletBalance } from './wallet.service';
import { validateBalanceDelta } from './wallet-balance-integrity.service';

interface PlannedTransactionParams {
  userId: number;
  walletId: number;
  amount: string;
  currency: string;
  amountUsd: string;
  description: string;
  category?: string | null;
  categoryId?: number | null;
  date: string;
  source: string;
}

/**
 * Create an expense transaction from a planned purchase and update wallet
 * balance atomically inside a single DB transaction.
 *
 * Balance logic is delegated to updateWalletBalance() — no duplication.
 */
export async function applyPlannedPurchase(params: PlannedTransactionParams) {
  const amountUsdNum = parseFloat(params.amountUsd);
  validateBalanceDelta(amountUsdNum, `applyPlannedPurchase wallet=${params.walletId}`);

  const transactionData = insertTransactionSchema.parse({
    userId: params.userId,
    date: params.date,
    type: 'expense',
    amount: params.amount,
    description: params.description,
    category: params.category ?? undefined,
    currency: params.currency,
    amountUsd: params.amountUsd,
    walletId: params.walletId,
    source: params.source,
  });

  return await db.transaction(async (tx) => {
    const [transaction] = await tx
      .insert(transactions)
      .values({ ...transactionData, amountUsd: params.amountUsd })
      .returning();

    await updateWalletBalance(params.walletId, params.userId, amountUsdNum, 'expense', tx);

    return transaction;
  });
}

/**
 * Create an income transaction from a planned income and update wallet
 * balance atomically inside a single DB transaction.
 */
export async function applyPlannedIncome(params: PlannedTransactionParams) {
  const amountUsdNum = parseFloat(params.amountUsd);
  validateBalanceDelta(amountUsdNum, `applyPlannedIncome wallet=${params.walletId}`);

  const transactionData = insertTransactionSchema.parse({
    userId: params.userId,
    date: params.date,
    type: 'income',
    amount: params.amount,
    description: params.description,
    categoryId: params.categoryId ?? undefined,
    currency: params.currency,
    amountUsd: params.amountUsd,
    walletId: params.walletId,
    source: params.source,
  });

  return await db.transaction(async (tx) => {
    const [transaction] = await tx
      .insert(transactions)
      .values({ ...transactionData, amountUsd: params.amountUsd })
      .returning();

    await updateWalletBalance(params.walletId, params.userId, amountUsdNum, 'income', tx);

    return transaction;
  });
}

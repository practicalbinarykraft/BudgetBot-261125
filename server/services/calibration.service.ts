import { db } from '../db';
import { calibrations, wallets, transactions, categories } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { convertToUSD } from './currency-service';
import { transactionRepository } from '../repositories/transaction.repository';
import { updateWalletBalance } from './wallet.service';
import { validateBalanceDelta } from './wallet-balance-integrity.service';

/**
 * Calibrate wallet - sync app balance with real balance.
 *
 * Creates an adjustment transaction for the difference (income if positive,
 * expense if negative). Wallet balance is updated ONLY through
 * updateWalletBalance() — no direct db.update of balance fields.
 *
 * All writes (transaction + balance + calibration record) happen inside a single
 * db.transaction() — if any step fails, everything is rolled back.
 *
 * Deleting the adjustment transaction fully reverses the calibration effect.
 */
export async function calibrateWallet(
  userId: number,
  walletId: number,
  actualBalance: number
): Promise<{
  calibration: any;
  transactionCreated: boolean;
}> {
  // 1. Get current wallet (read-only, outside tx)
  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.id, walletId))
    .limit(1);

  if (!wallet || wallet.userId !== userId) {
    throw new Error('Wallet not found');
  }

  const expectedBalance = Number(wallet.balance);
  const difference = actualBalance - expectedBalance;

  let transactionId: number | null = null;
  let adjustmentData: {
    amount: number;
    amountUsd: number;
    txType: 'income' | 'expense';
    currency: string;
    description: string;
    categoryId: number | null;
  } | null = null;

  // 2. Prepare adjustment data if there's a meaningful difference
  if (Math.abs(difference) > 0.01) {
    validateBalanceDelta(difference, `calibration wallet=${walletId}`);
    const adjustmentAmount = Math.abs(difference);
    const txType = difference > 0 ? 'income' : 'expense';
    const currency = wallet.currency || 'USD';
    const amountUsd = currency === 'USD'
      ? adjustmentAmount
      : convertToUSD(adjustmentAmount, currency);

    // Find "Unaccounted" category (read-only, outside tx)
    const [unaccountedCategory] = await db
      .select()
      .from(categories)
      .where(and(
        eq(categories.userId, userId),
        eq(categories.name, 'Unaccounted')
      ))
      .limit(1);

    const description = difference > 0
      ? `Unaccounted income (calibration of "${wallet.name}")`
      : `Unaccounted expenses (calibration of "${wallet.name}")`;

    adjustmentData = {
      amount: adjustmentAmount,
      amountUsd,
      txType,
      currency,
      description,
      categoryId: unaccountedCategory?.id || null,
    };
  }

  // 3. Atomic: transaction insert + balance update + calibration record
  const result = await db.transaction(async (tx) => {
    if (adjustmentData) {
      const row = await transactionRepository.createTransaction({
        userId,
        type: adjustmentData.txType,
        amount: adjustmentData.amount.toFixed(2),
        amountUsd: adjustmentData.amountUsd.toFixed(2),
        description: adjustmentData.description,
        category: 'Unaccounted',
        categoryId: adjustmentData.categoryId,
        date: new Date().toISOString().split('T')[0],
        currency: adjustmentData.currency,
        source: 'calibration',
        walletId,
      }, tx);

      transactionId = row.id;

      await updateWalletBalance(walletId, userId, adjustmentData.amountUsd, adjustmentData.txType, tx);
    }

    const [calibration] = await tx
      .insert(calibrations)
      .values({
        userId,
        walletId,
        actualBalance: actualBalance.toFixed(2),
        expectedBalance: expectedBalance.toFixed(2),
        difference: difference.toFixed(2),
        transactionId,
        date: new Date().toISOString().split('T')[0],
      })
      .returning();

    return calibration;
  });

  return {
    calibration: result,
    transactionCreated: transactionId !== null,
  };
}

/**
 * Get calibration history for user with transaction details
 */
export async function getCalibrationHistory(userId: number) {
  return await db
    .select({
      calibration: calibrations,
      wallet: wallets,
      transaction: transactions,
    })
    .from(calibrations)
    .leftJoin(wallets, eq(calibrations.walletId, wallets.id))
    .leftJoin(transactions, eq(calibrations.transactionId, transactions.id))
    .where(eq(calibrations.userId, userId))
    .orderBy(calibrations.createdAt);
}

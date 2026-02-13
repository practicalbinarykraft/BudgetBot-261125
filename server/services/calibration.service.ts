import { db } from '../db';
import { calibrations, wallets, transactions, categories } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { convertToUSD } from './currency-service';
import { updateWalletBalance } from './wallet.service';

/**
 * Calibrate wallet - sync app balance with real balance.
 *
 * Creates an adjustment transaction for the difference (income if positive,
 * expense if negative). Wallet balance is updated ONLY through
 * updateWalletBalance() — no direct db.update of balance fields.
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
  // 1. Get current wallet
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

  // 2. Create adjustment transaction if there's a meaningful difference
  if (Math.abs(difference) > 0.01) {
    const adjustmentAmount = Math.abs(difference);
    const txType = difference > 0 ? 'income' : 'expense';
    const currency = wallet.currency || 'USD';
    const amountUsd = currency === 'USD'
      ? adjustmentAmount
      : convertToUSD(adjustmentAmount, currency);

    // Find or use "Unaccounted" category
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

    const [transaction] = await db
      .insert(transactions)
      .values({
        userId,
        type: txType,
        amount: adjustmentAmount.toFixed(2),
        amountUsd: amountUsd.toFixed(2),
        description,
        category: 'Unaccounted',
        categoryId: unaccountedCategory?.id || null,
        date: new Date().toISOString().split('T')[0],
        currency,
        source: 'calibration',
        walletId,
      })
      .returning();

    transactionId = transaction.id;

    // Update wallet balance through the normal transaction path.
    // No direct db.update(wallets).set({balance}) — balance changes ONLY via transactions.
    await updateWalletBalance(walletId, userId, amountUsd, txType);
  }

  // 3. Save calibration record
  const [calibration] = await db
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

  return {
    calibration,
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

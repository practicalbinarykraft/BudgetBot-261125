import { db } from '../db';
import { calibrations, wallets, transactions, categories } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { convertToUSD } from './currency-service';

/**
 * Calibrate wallet - sync app balance with real balance
 * Creates "Unaccounted" expense if actual balance is lower
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
  
  // 2. If difference is negative → create unaccounted expense
  if (difference < -0.01) {
    const expenseAmount = Math.abs(difference);
    const currency = wallet.currency || 'USD';
    const amountUsd = currency === 'USD' 
      ? expenseAmount 
      : convertToUSD(expenseAmount, currency);
    
    // Find "Unaccounted" category for this user
    const [unaccountedCategory] = await db
      .select()
      .from(categories)
      .where(and(
        eq(categories.userId, userId),
        eq(categories.name, 'Unaccounted')
      ))
      .limit(1);
    
    const [transaction] = await db
      .insert(transactions)
      .values({
        userId,
        type: 'expense',
        amount: expenseAmount.toFixed(2),
        amountUsd: amountUsd.toFixed(2),
        description: `Unaccounted expenses (calibration of "${wallet.name}")`,
        category: 'Unaccounted',
        categoryId: unaccountedCategory?.id || null,
        date: new Date().toISOString().split('T')[0],
        currency,
        source: 'calibration',
        walletId,
      })
      .returning();
    
    transactionId = transaction.id;
  }
  
  // 3. Update wallet balance
  const balanceUsd = wallet.currency === 'USD'
    ? actualBalance
    : convertToUSD(actualBalance, wallet.currency || 'USD');
  
  await db
    .update(wallets)
    .set({ 
      balance: actualBalance.toFixed(2),
      balanceUsd: balanceUsd.toFixed(2)
    })
    .where(eq(wallets.id, walletId));
  
  // 4. Save calibration record
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

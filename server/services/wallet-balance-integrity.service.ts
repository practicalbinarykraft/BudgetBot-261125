import { db } from '../db';
import { wallets, transactions } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { logWarning } from '../lib/logger';
import { BadRequestError } from '../lib/errors';

const MAX_REASONABLE_DELTA = 1_000_000;

/** Round to 2 decimal places without floating point errors.
 *  EPSILON nudge fixes IEEE 754 boundary cases like 1.005 → 1.01 */
export function roundTo2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Guard: reject NaN, Infinity, unreasonably large deltas */
export function validateBalanceDelta(amountUsd: number, context: string): void {
  if (!Number.isFinite(amountUsd)) {
    throw new BadRequestError(
      `Invalid balance delta: ${amountUsd} is not a finite number (${context})`
    );
  }
  if (Math.abs(amountUsd) > MAX_REASONABLE_DELTA) {
    throw new BadRequestError(
      `Balance delta $${amountUsd.toFixed(2)} exceeds safety limit of $${MAX_REASONABLE_DELTA} (${context})`
    );
  }
}

/** Recalculate wallet balance from openingBalanceUsd + SUM(transactions) */
export async function recalculateWalletBalanceUsd(
  walletId: number,
  userId: number
): Promise<number> {
  const [wallet] = await db
    .select({ openingBalanceUsd: wallets.openingBalanceUsd })
    .from(wallets)
    .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)))
    .limit(1);

  if (!wallet) throw new Error('Wallet not found');

  const openingUsd = parseFloat(wallet.openingBalanceUsd as string) || 0;

  const [sums] = await db
    .select({
      totalIncome: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN CAST(${transactions.amountUsd} AS NUMERIC) ELSE 0 END), 0)`,
      totalExpense: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN CAST(${transactions.amountUsd} AS NUMERIC) ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(and(eq(transactions.walletId, walletId), eq(transactions.userId, userId)));

  const income = parseFloat(sums?.totalIncome || '0');
  const expense = parseFloat(sums?.totalExpense || '0');

  return roundTo2(openingUsd + income - expense);
}

/** Compare cached balance with recalculated. Log warning if drift > 0.02 */
export async function verifyWalletBalanceUsd(
  walletId: number,
  userId: number
): Promise<{ ok: boolean; expectedUsd: number; currentUsd: number; diffUsd: number }> {
  const expectedUsd = await recalculateWalletBalanceUsd(walletId, userId);

  const [wallet] = await db
    .select({ balanceUsd: wallets.balanceUsd })
    .from(wallets)
    .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)))
    .limit(1);

  const currentUsd = parseFloat((wallet?.balanceUsd as string) || '0');
  const diffUsd = roundTo2(expectedUsd - currentUsd);
  const ok = Math.abs(diffUsd) <= 0.02;

  if (!ok) {
    logWarning('[BalanceIntegrity] Drift detected', {
      userId,
      walletId,
      expectedUsd,
      currentUsd,
      diffUsd,
    });
  }

  return { ok, expectedUsd, currentUsd, diffUsd };
}

/** Repair: set wallet.balanceUsd to recalculated value */
export async function repairWalletBalanceUsd(
  walletId: number,
  userId: number
): Promise<{ repaired: boolean; oldUsd: number; newUsd: number }> {
  const { ok, expectedUsd, currentUsd } = await verifyWalletBalanceUsd(walletId, userId);
  if (ok) return { repaired: false, oldUsd: currentUsd, newUsd: currentUsd };

  await db
    .update(wallets)
    .set({ balanceUsd: expectedUsd.toFixed(2) })
    .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)));

  return { repaired: true, oldUsd: currentUsd, newUsd: expectedUsd };
}

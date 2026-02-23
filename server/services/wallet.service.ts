import { db } from '../db';
import { wallets } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { convertToUSD, getUserExchangeRates } from './currency-service';
import { logInfo, logWarning } from '../lib/logger';
import { validateBalanceDelta } from './wallet-balance-integrity.service';

export async function getPrimaryWallet(userId: number) {
  // First, try to get wallet marked as primary (isPrimary = 1)
  const primaryWallets = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .orderBy(desc(wallets.isPrimary)) // isPrimary = 1 comes first
    .limit(1);

  if (primaryWallets.length > 0) {
    const wallet = primaryWallets[0];
    const balanceUsd = parseFloat(wallet.balanceUsd || '0');
    
    logInfo('Primary wallet selected', {
      userId,
      walletId: wallet.id,
      walletName: wallet.name,
      isPrimary: wallet.isPrimary,
      balanceUsd,
      balance: parseFloat(wallet.balance || '0'),
      currency: wallet.currency,
    });
    
    // If marked as primary, use it even if balance is zero
    if (wallet.isPrimary) {
      return wallet;
    }
    
    // If not marked as primary but it's the first one, check if we have better options
  }

  // If no primary wallet marked, get wallet with highest balance
  const allWallets = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId));

  if (allWallets.length > 0) {
    // Sort by balanceUsd descending and return the one with highest balance
    const sortedWallets = allWallets.sort((a, b) => {
      const balanceA = parseFloat(a.balanceUsd || '0');
      const balanceB = parseFloat(b.balanceUsd || '0');
      return balanceB - balanceA;
    });
    
    const selectedWallet = sortedWallets[0];
    const balanceUsd = parseFloat(selectedWallet.balanceUsd || '0');
    
    logInfo('Wallet with highest balance selected', {
      userId,
      walletId: selectedWallet.id,
      walletName: selectedWallet.name,
      isPrimary: selectedWallet.isPrimary,
      balanceUsd,
      balance: parseFloat(selectedWallet.balance || '0'),
      currency: selectedWallet.currency,
      totalWallets: allWallets.length,
    });
    
    return selectedWallet;
  }

  // No wallet found - create default wallet
  logWarning('No wallets found, creating default wallet', { userId });
  const [newWallet] = await db
    .insert(wallets)
    .values({
      userId,
      name: 'My Wallet',
      type: 'cash',
      balance: '0',
      currency: 'USD',
      balanceUsd: '0',
      openingBalanceUsd: '0',
      openingBalanceDate: new Date().toISOString().split('T')[0],
    })
    .returning();

  return newWallet;
}

/**
 * Update wallet balance with guards (NaN/Infinity/overdraft protection).
 *
 * @param tx — optional drizzle transaction. When provided, all reads/writes
 *             go through tx so the caller can wrap insert+balance in one
 *             atomic DB transaction. When omitted, uses the global db.
 */
export async function updateWalletBalance(
  walletId: number,
  userId: number,
  amountUsd: number,
  transactionType: 'income' | 'expense',
  tx?: Parameters<Parameters<typeof db.transaction>[0]>[0]
) {
  const q = tx ?? db;

  // Guard against NaN/Infinity/absurd values
  validateBalanceDelta(amountUsd, `updateWalletBalance wallet=${walletId}`);

  // Get current wallet
  const [wallet] = await q
    .select()
    .from(wallets)
    .where(eq(wallets.id, walletId))
    .limit(1);

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  // Calculate USD delta
  const deltaUsd = transactionType === 'income' ? amountUsd : -amountUsd;

  // Update balance in wallet's native currency
  const walletCurrency = wallet.currency || 'USD';
  const currentBalance = parseFloat(wallet.balance);
  const currentBalanceUsd = parseFloat(wallet.balanceUsd || '0');

  let newBalance: number;
  let newBalanceUsd: number;

  if (walletCurrency === 'USD') {
    // Simple USD calculation
    newBalance = currentBalance + deltaUsd;
    newBalanceUsd = newBalance;
  } else {
    // Convert USD delta to wallet currency
    // rates[currency] = units of currency per 1 USD (e.g. RUB: 92.5)
    const rates = await getUserExchangeRates(userId);
    const rate = rates[walletCurrency] || 1;
    const deltaInWalletCurrency = deltaUsd * rate;

    newBalance = currentBalance + deltaInWalletCurrency;
    newBalanceUsd = currentBalanceUsd + deltaUsd;
  }

  // Validate result before writing
  validateBalanceDelta(newBalanceUsd, `wallet balance result wallet=${walletId}`);

  // Overdraft protection: prevent negative balance for expenses
  if (transactionType === 'expense' && newBalanceUsd < 0) {
    throw new Error(`Insufficient balance: wallet has $${currentBalanceUsd.toFixed(2)} but expense is $${amountUsd.toFixed(2)}`);
  }

  // Update wallet
  await q
    .update(wallets)
    .set({
      balance: newBalance.toFixed(2),
      balanceUsd: newBalanceUsd.toFixed(2),
    })
    .where(eq(wallets.id, walletId));
}

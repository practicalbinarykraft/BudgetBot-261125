import { db } from '../db';
import { wallets } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { convertToUSD, getUserExchangeRates } from './currency-service';

export async function getPrimaryWallet(userId: number) {
  // Try to get existing wallet
  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId))
    .limit(1);

  if (wallet) {
    return wallet;
  }

  // No wallet found - create default wallet
  const [newWallet] = await db
    .insert(wallets)
    .values({
      userId,
      name: 'My Wallet',
      type: 'cash',
      balance: '0',
      currency: 'USD',
      balanceUsd: '0',
    })
    .returning();

  return newWallet;
}

export async function updateWalletBalance(
  walletId: number,
  userId: number,
  amountUsd: number,
  transactionType: 'income' | 'expense'
) {
  // Get current wallet
  const [wallet] = await db
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
    const rates = await getUserExchangeRates(userId);
    const rate = rates[walletCurrency] || 1;
    const deltaInWalletCurrency = deltaUsd * rate;
    
    newBalance = currentBalance + deltaInWalletCurrency;
    newBalanceUsd = currentBalanceUsd + deltaUsd;
  }

  // Update wallet
  await db
    .update(wallets)
    .set({
      balance: newBalance.toFixed(2),
      balanceUsd: newBalanceUsd.toFixed(2),
    })
    .where(eq(wallets.id, walletId));
}

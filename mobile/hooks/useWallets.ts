/**
 * Hooks for wallet data.
 */

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { Wallet, Settings } from '@/types';

/** Fetch all wallets */
export function useWallets() {
  return useQuery<Wallet[]>({
    queryKey: ['/api/wallets'],
    queryFn: () => apiRequest<Wallet[]>('GET', '/api/wallets'),
  });
}

/** Fetch user settings */
export function useSettings() {
  return useQuery<Settings>({
    queryKey: ['/api/settings'],
    queryFn: () => apiRequest<Settings>('GET', '/api/settings'),
  });
}

/** Compute total balance across all wallets */
export function useTotalBalance() {
  const { data: wallets, ...rest } = useWallets();

  const totalBalance = wallets
    ? wallets.reduce((sum, w) => sum + parseFloat(w.balance || '0'), 0)
    : 0;

  const primaryWallet = wallets?.find((w) => w.isPrimary) ?? wallets?.[0];

  return {
    totalBalance,
    currency: primaryWallet?.currency ?? 'USD',
    wallets,
    ...rest,
  };
}

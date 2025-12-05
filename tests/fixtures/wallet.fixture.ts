/**
 * Wallet test fixtures
 */

export interface MockWallet {
  id: number;
  userId: number;
  name: string;
  currency: string;
  balance: string;
  icon: string;
  color: string;
  createdAt: Date;
}

export const mockWallet: MockWallet = {
  id: 1,
  userId: 1,
  name: 'Main Wallet',
  currency: 'USD',
  balance: '1000.00',
  icon: 'wallet',
  color: '#3b82f6',
  createdAt: new Date('2024-01-01'),
};

export const mockWallets: MockWallet[] = [
  mockWallet,
  {
    id: 2,
    userId: 1,
    name: 'Savings',
    currency: 'USD',
    balance: '5000.00',
    icon: 'piggy-bank',
    color: '#10b981',
    createdAt: new Date('2024-01-02'),
  },
];

export function createMockWallet(
  overrides: Partial<MockWallet> = {}
): MockWallet {
  return {
    ...mockWallet,
    id: Math.floor(Math.random() * 10000),
    ...overrides,
  };
}

/**
 * Transaction test fixtures
 */

export interface MockTransaction {
  id: number;
  userId: number;
  walletId: number;
  categoryId: number;
  type: 'income' | 'expense';
  amount: string;
  description: string;
  date: Date;
  createdAt: Date;
}

export const mockTransaction: MockTransaction = {
  id: 1,
  userId: 1,
  walletId: 1,
  categoryId: 1,
  type: 'expense',
  amount: '50.00',
  description: 'Grocery shopping',
  date: new Date('2024-01-15'),
  createdAt: new Date('2024-01-15'),
};

export const mockTransactions: MockTransaction[] = [
  mockTransaction,
  {
    id: 2,
    userId: 1,
    walletId: 1,
    categoryId: 2,
    type: 'income',
    amount: '2000.00',
    description: 'Salary',
    date: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 3,
    userId: 1,
    walletId: 1,
    categoryId: 3,
    type: 'expense',
    amount: '15.00',
    description: 'Coffee',
    date: new Date('2024-01-16'),
    createdAt: new Date('2024-01-16'),
  },
];

export function createMockTransaction(
  overrides: Partial<MockTransaction> = {}
): MockTransaction {
  return {
    ...mockTransaction,
    id: Math.floor(Math.random() * 10000),
    ...overrides,
  };
}

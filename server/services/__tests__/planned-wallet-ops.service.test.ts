import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock tx that tracks insert calls
function createMockTx() {
  return {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 1, type: 'expense' }]),
      }),
    }),
  };
}

const mockTransaction = vi.fn();

vi.mock('../../db', () => ({
  db: {
    transaction: (fn: any) => mockTransaction(fn),
  },
}));

vi.mock('@shared/schema', () => ({
  insertTransactionSchema: {
    parse: vi.fn((data: any) => data),
  },
  transactions: {},
}));

vi.mock('../wallet.service', () => ({
  updateWalletBalance: vi.fn(),
}));

vi.mock('../wallet-balance-integrity.service', () => ({
  validateBalanceDelta: vi.fn(),
}));

import { applyPlannedPurchase, applyPlannedIncome } from '../planned-wallet-ops.service';
import { updateWalletBalance } from '../wallet.service';
import { validateBalanceDelta } from '../wallet-balance-integrity.service';

describe('planned-wallet-ops.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateWalletBalance).mockResolvedValue(undefined);
  });

  const basePurchaseParams = {
    userId: 1,
    walletId: 10,
    amount: '50.00',
    currency: 'USD',
    amountUsd: '50.00',
    description: 'Test purchase',
    category: 'Shopping',
    date: '2026-02-23',
    source: 'manual',
  };

  const baseIncomeParams = {
    userId: 1,
    walletId: 10,
    amount: '100.00',
    currency: 'USD',
    amountUsd: '100.00',
    description: 'Test income',
    categoryId: 5,
    date: '2026-02-23',
    source: 'manual',
  };

  describe('applyPlannedPurchase', () => {
    it('creates expense transaction inside DB transaction', async () => {
      const tx = createMockTx();
      mockTransaction.mockImplementation(async (fn) => fn(tx));

      await applyPlannedPurchase(basePurchaseParams);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(tx.insert).toHaveBeenCalledTimes(1);
    });

    it('calls validateBalanceDelta before transaction', async () => {
      const tx = createMockTx();
      mockTransaction.mockImplementation(async (fn) => fn(tx));

      await applyPlannedPurchase(basePurchaseParams);

      expect(validateBalanceDelta).toHaveBeenCalledWith(
        50.0,
        'applyPlannedPurchase wallet=10'
      );
    });

    it('delegates balance update to updateWalletBalance with tx', async () => {
      const tx = createMockTx();
      mockTransaction.mockImplementation(async (fn) => fn(tx));

      await applyPlannedPurchase(basePurchaseParams);

      expect(updateWalletBalance).toHaveBeenCalledWith(10, 1, 50.0, 'expense', tx);
    });

    it('returns the created transaction', async () => {
      const mockTxResult = { id: 42, type: 'expense' };
      const tx = createMockTx();
      tx.insert().values().returning.mockResolvedValue([mockTxResult]);
      mockTransaction.mockImplementation(async (fn) => fn(tx));

      const result = await applyPlannedPurchase(basePurchaseParams);

      expect(result).toEqual(mockTxResult);
    });

    it('propagates updateWalletBalance errors (atomic rollback)', async () => {
      const tx = createMockTx();
      mockTransaction.mockImplementation(async (fn) => fn(tx));
      vi.mocked(updateWalletBalance).mockRejectedValue(
        new Error('Insufficient balance: wallet has $10.00 but expense is $50.00')
      );

      await expect(applyPlannedPurchase(basePurchaseParams)).rejects.toThrow(
        'Insufficient balance'
      );
    });

    it('normalizes null category to undefined', async () => {
      const tx = createMockTx();
      mockTransaction.mockImplementation(async (fn) => fn(tx));

      const { insertTransactionSchema } = await import('@shared/schema');
      await applyPlannedPurchase({ ...basePurchaseParams, category: null });

      expect(insertTransactionSchema.parse).toHaveBeenCalledWith(
        expect.objectContaining({ category: undefined })
      );
    });
  });

  describe('applyPlannedIncome', () => {
    it('creates income transaction and delegates balance to updateWalletBalance', async () => {
      const tx = createMockTx();
      tx.insert().values().returning.mockResolvedValue([{ id: 99, type: 'income' }]);
      mockTransaction.mockImplementation(async (fn) => fn(tx));

      const result = await applyPlannedIncome(baseIncomeParams);

      expect(result).toEqual({ id: 99, type: 'income' });
      expect(updateWalletBalance).toHaveBeenCalledWith(10, 1, 100.0, 'income', tx);
    });

    it('normalizes null categoryId to undefined', async () => {
      const tx = createMockTx();
      mockTransaction.mockImplementation(async (fn) => fn(tx));

      const { insertTransactionSchema } = await import('@shared/schema');
      await applyPlannedIncome({ ...baseIncomeParams, categoryId: null });

      expect(insertTransactionSchema.parse).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: undefined })
      );
    });

    it('propagates updateWalletBalance errors', async () => {
      const tx = createMockTx();
      mockTransaction.mockImplementation(async (fn) => fn(tx));
      vi.mocked(updateWalletBalance).mockRejectedValue(new Error('Wallet not found'));

      await expect(applyPlannedIncome(baseIncomeParams)).rejects.toThrow('Wallet not found');
    });
  });

  describe('atomicity', () => {
    it('insert and updateWalletBalance share the same tx object', async () => {
      const tx = createMockTx();
      mockTransaction.mockImplementation(async (fn) => fn(tx));

      await applyPlannedPurchase(basePurchaseParams);

      // Both insert (transaction row) and balance update received same tx
      expect(tx.insert).toHaveBeenCalledTimes(1);
      const passedTx = vi.mocked(updateWalletBalance).mock.calls[0][4];
      expect(passedTx).toBe(tx);
    });
  });
});

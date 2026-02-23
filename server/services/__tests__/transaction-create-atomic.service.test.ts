import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDbTransaction = vi.fn();

vi.mock('../../db', () => ({
  db: {
    transaction: (fn: any) => mockDbTransaction(fn),
  },
}));

vi.mock('../../repositories/transaction.repository', () => ({
  transactionRepository: {
    createTransaction: vi.fn(),
  },
}));

vi.mock('../wallet.service', () => ({
  updateWalletBalance: vi.fn(),
}));

import { createTransactionAtomic } from '../transaction-create-atomic.service';
import { transactionRepository } from '../../repositories/transaction.repository';
import { updateWalletBalance } from '../wallet.service';

describe('createTransactionAtomic', () => {
  const fakeTx = { __isTx: true };

  const baseData = {
    userId: 1,
    type: 'expense' as const,
    amount: '50.00',
    amountUsd: '50.00',
    description: 'Test',
    date: '2026-02-23',
    currency: 'USD',
    source: 'telegram' as const,
    walletId: 10,
  };

  const mockRow = {
    id: 42,
    userId: 1,
    type: 'expense',
    amount: '50.00',
    amountUsd: '50.00',
    walletId: 10,
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDbTransaction.mockImplementation(async (fn) => fn(fakeTx));
    vi.mocked(transactionRepository.createTransaction).mockResolvedValue(mockRow as any);
    vi.mocked(updateWalletBalance).mockResolvedValue(undefined);
  });

  it('uses one tx for insert + balance update', async () => {
    await createTransactionAtomic({ data: baseData as any, type: 'expense' });

    expect(mockDbTransaction).toHaveBeenCalledTimes(1);
    expect(transactionRepository.createTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      fakeTx
    );
    expect(updateWalletBalance).toHaveBeenCalledWith(10, 1, 50, 'expense', fakeTx);
  });

  it('propagates balance error — no swallowing', async () => {
    vi.mocked(updateWalletBalance).mockRejectedValue(
      new Error('Insufficient balance: wallet has $10.00 but expense is $50.00')
    );

    await expect(
      createTransactionAtomic({ data: baseData as any, type: 'expense' })
    ).rejects.toThrow('Insufficient balance');

    // Both called inside the same tx
    const insertTx = vi.mocked(transactionRepository.createTransaction).mock.calls[0][1];
    const balanceTx = vi.mocked(updateWalletBalance).mock.calls[0][4];
    expect(insertTx).toBe(balanceTx);
  });

  it('skips balance update when walletId is null', async () => {
    const noWalletRow = { ...mockRow, walletId: null };
    vi.mocked(transactionRepository.createTransaction).mockResolvedValue(noWalletRow as any);

    const result = await createTransactionAtomic({
      data: { ...baseData, walletId: null } as any,
      type: 'expense',
    });

    expect(result.walletId).toBeNull();
    expect(updateWalletBalance).not.toHaveBeenCalled();
  });

  it('runs withinTx callback inside the same transaction', async () => {
    const withinTx = vi.fn().mockResolvedValue(undefined);

    await createTransactionAtomic({
      data: baseData as any,
      type: 'expense',
      withinTx,
    });

    expect(withinTx).toHaveBeenCalledWith(42, fakeTx);
    // withinTx called BEFORE updateWalletBalance
    const withinTxOrder = withinTx.mock.invocationCallOrder[0];
    const balanceOrder = vi.mocked(updateWalletBalance).mock.invocationCallOrder[0];
    expect(withinTxOrder).toBeLessThan(balanceOrder);
  });

  it('returns created transaction row', async () => {
    const result = await createTransactionAtomic({ data: baseData as any, type: 'expense' });

    expect(result).toEqual(mockRow);
  });
});

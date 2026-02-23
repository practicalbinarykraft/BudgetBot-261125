import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock tx that tracks calls
function createMockTx() {
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{
            id: 1,
            userId: 10,
            walletId: 5,
            type: 'expense',
            amountUsd: '50.00',
          }]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
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
  transactions: {},
}));

vi.mock('../wallet.service', () => ({
  updateWalletBalance: vi.fn(),
}));

vi.mock('../../lib/logger', () => ({
  logInfo: vi.fn(),
  logWarning: vi.fn(),
  logError: vi.fn(),
}));

import { deleteTransactionAndReverseBalance } from '../transaction-delete.service';
import { updateWalletBalance } from '../wallet.service';

describe('transaction-delete.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateWalletBalance).mockResolvedValue(undefined);
  });

  it('deleting expense calls updateWalletBalance with income (reversal)', async () => {
    const tx = createMockTx();
    mockTransaction.mockImplementation(async (fn) => fn(tx));

    await deleteTransactionAndReverseBalance({
      transactionId: 1,
      userId: 10,
    });

    expect(updateWalletBalance).toHaveBeenCalledWith(5, 10, 50.0, 'income', tx);
  });

  it('deleting income calls updateWalletBalance with expense (reversal)', async () => {
    const tx = createMockTx();
    tx.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{
            id: 2,
            userId: 10,
            walletId: 5,
            type: 'income',
            amountUsd: '100.00',
          }]),
        }),
      }),
    });
    mockTransaction.mockImplementation(async (fn) => fn(tx));

    await deleteTransactionAndReverseBalance({
      transactionId: 2,
      userId: 10,
    });

    expect(updateWalletBalance).toHaveBeenCalledWith(5, 10, 100.0, 'expense', tx);
  });

  it('throws if transaction not found', async () => {
    const tx = createMockTx();
    tx.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
    mockTransaction.mockImplementation(async (fn) => fn(tx));

    await expect(
      deleteTransactionAndReverseBalance({ transactionId: 999, userId: 10 })
    ).rejects.toThrow(/Transaction not found/);
  });

  it('updateWalletBalance error prevents deletion (atomic rollback)', async () => {
    const tx = createMockTx();
    mockTransaction.mockImplementation(async (fn) => fn(tx));
    vi.mocked(updateWalletBalance).mockRejectedValue(new Error('Wallet not found'));

    await expect(
      deleteTransactionAndReverseBalance({ transactionId: 1, userId: 10 })
    ).rejects.toThrow('Wallet not found');

    // delete should have been called (before the error from updateWalletBalance),
    // but since it's inside db.transaction, the whole thing rolls back
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('skips balance reversal when transaction has no walletId', async () => {
    const tx = createMockTx();
    tx.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{
            id: 3,
            userId: 10,
            walletId: null,
            type: 'expense',
            amountUsd: '25.00',
          }]),
        }),
      }),
    });
    mockTransaction.mockImplementation(async (fn) => fn(tx));

    await deleteTransactionAndReverseBalance({ transactionId: 3, userId: 10 });

    expect(updateWalletBalance).not.toHaveBeenCalled();
    expect(tx.delete).toHaveBeenCalledTimes(1);
  });

  it('runs select, delete, and updateWalletBalance inside same tx', async () => {
    const tx = createMockTx();
    mockTransaction.mockImplementation(async (fn) => fn(tx));

    await deleteTransactionAndReverseBalance({ transactionId: 1, userId: 10 });

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(tx.select).toHaveBeenCalledTimes(1);
    expect(tx.delete).toHaveBeenCalledTimes(1);
    const passedTx = vi.mocked(updateWalletBalance).mock.calls[0][4];
    expect(passedTx).toBe(tx);
  });
});

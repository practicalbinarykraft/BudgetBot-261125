/**
 * TransactionService Tests
 *
 * NOTE: These tests verify TransactionService methods delegate correctly to repositories.
 * For full integration tests with real database, see integration test suite.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock db.transaction to execute the callback synchronously with a fake tx
const mockDbTransaction = vi.fn();
vi.mock('../../db', () => ({
  db: {
    transaction: (fn: any) => mockDbTransaction(fn),
  },
}));

// Mock dependencies
vi.mock('../../repositories/transaction.repository', () => ({
  transactionRepository: {
    getTransactionsByUserId: vi.fn(),
    getTransactionById: vi.fn(),
    createTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  },
}));

vi.mock('../../repositories/wallet.repository', () => ({
  walletRepository: {
    getWalletById: vi.fn(),
    updateWalletBalance: vi.fn(),
  },
}));

vi.mock('../../repositories/category.repository', () => ({
  categoryRepository: {
    getCategoryByNameAndUserId: vi.fn(),
  },
}));

vi.mock('../../middleware/ml-middleware', () => ({
  applyMLCategory: vi.fn().mockResolvedValue({
    category: 'Food',
    mlSuggested: false,
    mlConfidence: 0,
  }),
  trainMLCategory: vi.fn(),
}));

vi.mock('../currency-service', () => ({
  convertToUSD: vi.fn().mockResolvedValue(100),
  getExchangeRate: vi.fn().mockResolvedValue(1),
}));

vi.mock('../budget/limits-checker.service', () => ({
  checkCategoryLimit: vi.fn(),
  sendBudgetAlert: vi.fn(),
}));

vi.mock('../wallet.service', () => ({
  updateWalletBalance: vi.fn(),
}));

import { TransactionService } from '../transaction.service';
import { transactionRepository } from '../../repositories/transaction.repository';
import { walletRepository } from '../../repositories/wallet.repository';
import { updateWalletBalance } from '../wallet.service';

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TransactionService();
    // Default: db.transaction executes the callback with a fake tx object
    mockDbTransaction.mockImplementation(async (fn) => fn({ __isTx: true }));
    vi.mocked(updateWalletBalance).mockResolvedValue(undefined);
  });

  describe('getTransactions', () => {
    it('should delegate to repository and return transactions for user', async () => {
      const mockTransactions = [
        { id: 1, userId: 1, amount: '100.00', type: 'expense' },
        { id: 2, userId: 1, amount: '50.00', type: 'income' },
      ];

      (transactionRepository.getTransactionsByUserId as any).mockResolvedValue({
        transactions: mockTransactions,
        total: 2,
      });

      const result = await service.getTransactions(1, {});

      expect(transactionRepository.getTransactionsByUserId).toHaveBeenCalledWith(1, {});
      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should pass filters to repository', async () => {
      const filters = {
        from: '2024-01-01',
        to: '2024-01-31',
        limit: 10,
        offset: 0,
      };

      (transactionRepository.getTransactionsByUserId as any).mockResolvedValue({
        transactions: [],
        total: 0,
      });

      await service.getTransactions(1, filters);

      expect(transactionRepository.getTransactionsByUserId).toHaveBeenCalledWith(1, filters);
    });
  });

  describe('getTransaction', () => {
    it('should return transaction if it belongs to user', async () => {
      const mockTransaction = {
        id: 1,
        userId: 1,
        amount: '100.00',
        type: 'expense',
        description: 'Test',
      };

      (transactionRepository.getTransactionById as any).mockResolvedValue(mockTransaction);

      const result = await service.getTransaction(1, 1);

      expect(transactionRepository.getTransactionById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTransaction);
    });

    it('should return null if transaction does not belong to user', async () => {
      const mockTransaction = {
        id: 1,
        userId: 2, // Different user
        amount: '100.00',
        type: 'expense',
      };

      (transactionRepository.getTransactionById as any).mockResolvedValue(mockTransaction);

      const result = await service.getTransaction(1, 1);

      expect(result).toBeNull();
    });

    it('should return null for non-existent transaction', async () => {
      (transactionRepository.getTransactionById as any).mockResolvedValue(null);

      const result = await service.getTransaction(999, 1);

      expect(result).toBeNull();
    });
  });

  describe('createTransaction', () => {
    const baseInput = {
      type: 'expense' as const,
      amount: 50,
      description: 'Test',
      date: '2024-01-15',
      walletId: 1,
    };

    const mockCreatedRow = {
      id: 1,
      userId: 1,
      type: 'expense',
      amount: '50.00',
      amountUsd: '50.00',
      description: 'Test',
      category: 'Food',
      categoryId: null,
      date: '2024-01-15',
      currency: 'USD',
      originalAmount: null,
      originalCurrency: null,
      exchangeRate: null,
      source: 'manual',
      walletId: 1,
      personalTagId: null,
      financialType: 'discretionary',
      createdAt: new Date(),
    };

    beforeEach(() => {
      (walletRepository.getWalletById as any).mockResolvedValue({ id: 1, userId: 1, balance: '1000.00' });
      (transactionRepository.createTransaction as any).mockResolvedValue(mockCreatedRow);
    });

    it('should verify wallet ownership before creating transaction', async () => {
      await service.createTransaction(1, baseInput);

      expect(walletRepository.getWalletById).toHaveBeenCalledWith(1);
    });

    it('should throw error if wallet does not belong to user', async () => {
      (walletRepository.getWalletById as any).mockResolvedValue({ id: 1, userId: 2, balance: '1000.00' });

      await expect(
        service.createTransaction(1, baseInput)
      ).rejects.toThrow('Invalid wallet');
    });

    it('wraps insert + updateWalletBalance in db.transaction()', async () => {
      await service.createTransaction(1, baseInput);

      expect(mockDbTransaction).toHaveBeenCalledTimes(1);
      // Both insert and balance update should have received the tx object
      expect(transactionRepository.createTransaction).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ __isTx: true })
      );
      expect(updateWalletBalance).toHaveBeenCalledWith(
        1, 1, 50, 'expense',
        expect.objectContaining({ __isTx: true })
      );
    });

    it('rolls back insert when updateWalletBalance fails (atomic)', async () => {
      vi.mocked(updateWalletBalance).mockRejectedValue(
        new Error('Insufficient balance: wallet has $10.00 but expense is $50.00')
      );

      // db.transaction should propagate the error — meaning the whole tx rolled back
      await expect(
        service.createTransaction(1, baseInput)
      ).rejects.toThrow('Insufficient balance');

      // The insert was called (inside the tx), but since the tx rolled back,
      // the row won't persist. Verify that both were called inside the same tx.
      expect(transactionRepository.createTransaction).toHaveBeenCalledTimes(1);
      expect(updateWalletBalance).toHaveBeenCalledTimes(1);

      // Both received the same tx object
      const insertTx = vi.mocked(transactionRepository.createTransaction).mock.calls[0][1];
      const balanceTx = vi.mocked(updateWalletBalance).mock.calls[0][4];
      expect(insertTx).toBe(balanceTx);
    });

    it('does not call updateWalletBalance when walletId is null', async () => {
      const noWalletRow = { ...mockCreatedRow, walletId: null };
      (transactionRepository.createTransaction as any).mockResolvedValue(noWalletRow);

      await service.createTransaction(1, { ...baseInput, walletId: undefined });

      expect(updateWalletBalance).not.toHaveBeenCalled();
    });

    it('returns transaction with ML metadata', async () => {
      const result = await service.createTransaction(1, baseInput);

      expect(result).toMatchObject({
        id: 1,
        mlSuggested: false,
        mlConfidence: 0,
      });
    });
  });
});

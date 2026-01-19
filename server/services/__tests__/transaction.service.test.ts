/**
 * TransactionService Tests
 * 
 * NOTE: These tests verify TransactionService methods delegate correctly to repositories.
 * For full integration tests with real database, see integration test suite.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import { TransactionService } from '../transaction.service';
import { transactionRepository } from '../../repositories/transaction.repository';
import { walletRepository } from '../../repositories/wallet.repository';

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TransactionService();
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
    it('should verify wallet ownership before creating transaction', async () => {
      const mockWallet = { id: 1, userId: 1, balance: '1000.00' };
      (walletRepository.getWalletById as any).mockResolvedValue(mockWallet);
      
      const mockTransaction = {
        id: 1,
        userId: 1,
        type: 'expense' as const,
        amount: '50.00',
        description: 'Test',
        date: '2024-01-15',
        walletId: 1,
      };
      
      (transactionRepository.createTransaction as any).mockResolvedValue(mockTransaction);

      await service.createTransaction(1, {
        type: 'expense',
        amount: 50,
        description: 'Test',
        date: '2024-01-15',
        walletId: 1,
      });
      
      expect(walletRepository.getWalletById).toHaveBeenCalledWith(1);
    });

    it('should throw error if wallet does not belong to user', async () => {
      const mockWallet = { id: 1, userId: 2, balance: '1000.00' }; // Different user
      (walletRepository.getWalletById as any).mockResolvedValue(mockWallet);

      await expect(
        service.createTransaction(1, {
          type: 'expense',
          amount: 50,
          description: 'Test',
          date: '2024-01-15',
          walletId: 1,
        })
      ).rejects.toThrow('Invalid wallet');
    });
  });
});

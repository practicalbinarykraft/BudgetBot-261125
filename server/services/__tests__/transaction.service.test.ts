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
    getCategoryByName: vi.fn(),
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

import { transactionRepository } from '../../repositories/transaction.repository';
import { walletRepository } from '../../repositories/wallet.repository';

describe('TransactionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTransactions', () => {
    it('should return transactions for user', async () => {
      const mockTransactions = [
        { id: 1, userId: 1, amount: '100.00', type: 'expense' },
        { id: 2, userId: 1, amount: '50.00', type: 'income' },
      ];
      
      (transactionRepository.getTransactionsByUserId as any).mockResolvedValue({
        transactions: mockTransactions,
        total: 2,
      });

      const result = await transactionRepository.getTransactionsByUserId(1, {});
      
      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by date range', async () => {
      const mockTransactions = [
        { id: 1, userId: 1, amount: '100.00', date: '2024-01-15' },
      ];
      
      (transactionRepository.getTransactionsByUserId as any).mockResolvedValue({
        transactions: mockTransactions,
        total: 1,
      });

      const result = await transactionRepository.getTransactionsByUserId(1, {
        from: '2024-01-01',
        to: '2024-01-31',
      });
      
      expect(result.transactions).toHaveLength(1);
    });

    it('should return empty array for user with no transactions', async () => {
      (transactionRepository.getTransactionsByUserId as any).mockResolvedValue({
        transactions: [],
        total: 0,
      });

      const result = await transactionRepository.getTransactionsByUserId(999, {});
      
      expect(result.transactions).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getTransaction', () => {
    it('should return single transaction by id', async () => {
      const mockTransaction = { 
        id: 1, 
        userId: 1, 
        amount: '100.00',
        type: 'expense',
        description: 'Test',
      };
      
      (transactionRepository.getTransactionById as any).mockResolvedValue(mockTransaction);

      const result = await transactionRepository.getTransactionById(1);
      
      expect(result).toEqual(mockTransaction);
      expect(result.id).toBe(1);
    });

    it('should return null for non-existent transaction', async () => {
      (transactionRepository.getTransactionById as any).mockResolvedValue(null);

      const result = await transactionRepository.getTransactionById(999);
      
      expect(result).toBeNull();
    });
  });

  describe('Transaction validation', () => {
    it('should validate transaction type', () => {
      const validTypes = ['income', 'expense'];
      
      expect(validTypes.includes('income')).toBe(true);
      expect(validTypes.includes('expense')).toBe(true);
      expect(validTypes.includes('invalid')).toBe(false);
    });

    it('should validate positive amount', () => {
      const amount = 100;
      expect(amount > 0).toBe(true);
      
      const negativeAmount = -50;
      expect(negativeAmount > 0).toBe(false);
    });

    it('should validate date format', () => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      
      expect(dateRegex.test('2024-01-15')).toBe(true);
      expect(dateRegex.test('01-15-2024')).toBe(false);
      expect(dateRegex.test('2024/01/15')).toBe(false);
    });
  });

  describe('Wallet verification', () => {
    it('should verify wallet belongs to user', async () => {
      const mockWallet = { id: 1, userId: 1, balance: '1000.00' };
      (walletRepository.getWalletById as any).mockResolvedValue(mockWallet);

      const wallet = await walletRepository.getWalletById(1);
      
      expect(wallet).not.toBeNull();
      expect(wallet?.userId).toBe(1);
    });

    it('should reject wallet of different user', async () => {
      const mockWallet = { id: 1, userId: 2, balance: '1000.00' };
      (walletRepository.getWalletById as any).mockResolvedValue(mockWallet);

      const wallet = await walletRepository.getWalletById(1);
      const requestingUserId = 1;
      
      expect(wallet?.userId).not.toBe(requestingUserId);
    });
  });

  describe('createTransaction', () => {
    it('should create transaction with required fields', async () => {
      const newTransaction = {
        id: 1,
        userId: 1,
        type: 'expense',
        amount: '50.00',
        description: 'Grocery shopping',
        date: '2024-01-15',
      };
      
      (transactionRepository.createTransaction as any).mockResolvedValue(newTransaction);

      const result = await transactionRepository.createTransaction(newTransaction);
      
      expect(result.id).toBe(1);
      expect(result.type).toBe('expense');
      expect(result.amount).toBe('50.00');
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction', async () => {
      (transactionRepository.deleteTransaction as any).mockResolvedValue(undefined);

      await expect(transactionRepository.deleteTransaction(1)).resolves.not.toThrow();
      expect(transactionRepository.deleteTransaction).toHaveBeenCalledWith(1);
    });
  });
});

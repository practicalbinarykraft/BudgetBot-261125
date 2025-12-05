import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletRepository } from '../wallet.repository';
import { db } from '../../db';
import { wallets } from '@shared/schema';

// Mock the database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('WalletRepository', () => {
  let repository: WalletRepository;

  beforeEach(() => {
    repository = new WalletRepository();
    vi.clearAllMocks();
  });

  describe('getWalletsByUserId', () => {
    it('should return wallets for a user', async () => {
      const mockWalletsList = [
        { id: 1, userId: 1, name: 'Main Wallet', balance: '1000.00', currency: 'USD', createdAt: new Date() },
        { id: 2, userId: 1, name: 'Savings', balance: '5000.00', currency: 'USD', createdAt: new Date() },
      ];

      const mockDynamic = vi.fn().mockResolvedValue(mockWalletsList);
      const mockOrderBy = vi.fn().mockReturnValue({ $dynamic: mockDynamic });
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });

      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.getWalletsByUserId(1);

      expect(result.wallets).toEqual(mockWalletsList);
      expect(result.total).toBe(0); // total comes from count query
      expect(db.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith(wallets);
    });

    it('should return empty array when user has no wallets', async () => {
      const mockDynamic = vi.fn().mockResolvedValue([]);
      const mockOrderBy = vi.fn().mockReturnValue({ $dynamic: mockDynamic });
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });

      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.getWalletsByUserId(999);

      expect(result.wallets).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getWalletById', () => {
    it('should return a wallet by id', async () => {
      const mockWallet = { id: 1, userId: 1, name: 'Main Wallet', balance: '1000.00', currency: 'USD', createdAt: new Date() };

      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue([mockWallet]);

      (db.select as any).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });
      mockWhere.mockReturnValue({
        limit: mockLimit,
      });

      const result = await repository.getWalletById(1);

      expect(result).toEqual(mockWallet);
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should return null when wallet not found', async () => {
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue([]);

      (db.select as any).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });
      mockWhere.mockReturnValue({
        limit: mockLimit,
      });

      const result = await repository.getWalletById(999);

      expect(result).toBeNull();
    });
  });

  describe('createWallet', () => {
    it('should create a new wallet', async () => {
      const newWallet = { userId: 1, name: 'New Wallet', balance: '0.00', currency: 'EUR' };
      const createdWallet = { id: 3, ...newWallet, createdAt: new Date() };

      const mockValues = vi.fn().mockReturnThis();
      const mockReturning = vi.fn().mockResolvedValue([createdWallet]);

      (db.insert as any).mockReturnValue({
        values: mockValues,
      });
      mockValues.mockReturnValue({
        returning: mockReturning,
      });

      const result = await repository.createWallet(newWallet);

      expect(result).toEqual(createdWallet);
      expect(db.insert).toHaveBeenCalledWith(wallets);
      expect(mockValues).toHaveBeenCalledWith(newWallet);
    });
  });

  describe('updateWallet', () => {
    it('should update a wallet', async () => {
      const updates = { name: 'Updated Wallet', balance: '2000.00' };
      const updatedWallet = { id: 1, userId: 1, ...updates, currency: 'USD', createdAt: new Date() };

      const mockSet = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockReturning = vi.fn().mockResolvedValue([updatedWallet]);

      (db.update as any).mockReturnValue({
        set: mockSet,
      });
      mockSet.mockReturnValue({
        where: mockWhere,
      });
      mockWhere.mockReturnValue({
        returning: mockReturning,
      });

      const result = await repository.updateWallet(1, updates);

      expect(result).toEqual(updatedWallet);
      expect(db.update).toHaveBeenCalledWith(wallets);
      expect(mockSet).toHaveBeenCalledWith(updates);
    });
  });

  describe('deleteWallet', () => {
    it('should delete a wallet', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);

      (db.delete as any).mockReturnValue({
        where: mockWhere,
      });

      await repository.deleteWallet(1);

      expect(db.delete).toHaveBeenCalledWith(wallets);
      expect(mockWhere).toHaveBeenCalled();
    });
  });
});

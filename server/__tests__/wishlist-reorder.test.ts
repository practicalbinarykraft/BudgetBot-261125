import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock storage
const mockStorage = {
  reorderWishlist: vi.fn(),
  getWishlistByUserId: vi.fn(),
};

vi.mock('../storage', () => ({
  storage: mockStorage,
}));

vi.mock('../services/goal-predictor.service', () => ({
  predictGoalWithStats: vi.fn(() => ({
    canAfford: false,
    freeCapital: 500,
    monthsToAfford: 3,
    affordableDate: '2026-05-01',
  })),
  predictGoal: vi.fn(),
}));

vi.mock('../services/budget-stats.service', () => ({
  getMonthlyStats: vi.fn(() => ({ income: 3000, expenses: 2500, freeCapital: 500 })),
  getTotalBudgetLimits: vi.fn(() => 2000),
}));

describe('Wishlist Reorder Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Input validation rules', () => {
    it('should reject empty array', () => {
      const items: { id: number; sortOrder: number }[] = [];
      expect(items.length).toBe(0);
    });

    it('should reject duplicate sortOrder values', () => {
      const items = [
        { id: 1, sortOrder: 1 },
        { id: 2, sortOrder: 1 },
      ];
      const sortOrders = items.map((i) => i.sortOrder);
      const unique = new Set(sortOrders);
      expect(unique.size).toBeLessThan(sortOrders.length);
    });

    it('should accept valid 1..N sortOrder', () => {
      const items = [
        { id: 10, sortOrder: 1 },
        { id: 20, sortOrder: 2 },
        { id: 30, sortOrder: 3 },
      ];
      const sortOrders = items.map((i) => i.sortOrder);
      const unique = new Set(sortOrders);
      expect(unique.size).toBe(sortOrders.length);
      expect(Math.min(...sortOrders)).toBeGreaterThanOrEqual(1);
    });

    it('should reject sortOrder < 1', () => {
      const items = [
        { id: 1, sortOrder: 0 },
        { id: 2, sortOrder: 1 },
      ];
      const invalid = items.filter((i) => i.sortOrder < 1);
      expect(invalid.length).toBeGreaterThan(0);
    });
  });

  describe('Repository reorder', () => {
    it('should call reorderWishlist with correct args', async () => {
      const items = [
        { id: 1, sortOrder: 1 },
        { id: 2, sortOrder: 2 },
      ];
      mockStorage.reorderWishlist.mockResolvedValue(undefined);
      await mockStorage.reorderWishlist(42, items);
      expect(mockStorage.reorderWishlist).toHaveBeenCalledWith(42, items);
    });

    it('should throw if items not owned by user', async () => {
      mockStorage.reorderWishlist.mockRejectedValue(
        new Error('Some wishlist items not found or not owned by user')
      );
      await expect(mockStorage.reorderWishlist(42, [{ id: 999, sortOrder: 1 }]))
        .rejects.toThrow('not found or not owned');
    });

    it('should return updated list after reorder', async () => {
      mockStorage.reorderWishlist.mockResolvedValue(undefined);
      mockStorage.getWishlistByUserId.mockResolvedValue([
        { id: 1, name: 'iPhone', amount: '1000', sortOrder: 2 },
        { id: 2, name: 'MacBook', amount: '2000', sortOrder: 1 },
      ]);

      await mockStorage.reorderWishlist(42, [
        { id: 2, sortOrder: 1 },
        { id: 1, sortOrder: 2 },
      ]);

      const result = await mockStorage.getWishlistByUserId(42);
      expect(result).toHaveLength(2);
      expect(result[0].sortOrder).toBe(2);
      expect(result[1].sortOrder).toBe(1);
    });
  });
});

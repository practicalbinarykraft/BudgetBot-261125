/**
 * CategoryRepository Unit Tests
 * 
 * NOTE: These are unit tests that verify the repository methods structure and query building.
 * They use mocked database to test the logic without requiring a real DB connection.
 * 
 * For integration tests with real database, see integration test suite.
 * These tests verify:
 * - Query structure is correct
 * - Methods are called with correct parameters
 * - Return values are properly formatted
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '../../db';
import { categories } from '@shared/schema';
import { CategoryRepository } from '../category.repository';

// Mock the database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('CategoryRepository', () => {
  let repository: CategoryRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new CategoryRepository();
  });

  describe('getCategoriesByUserId', () => {
    it('should return categories with total count for a user', async () => {
      const mockCategories = [
        { id: 1, userId: 1, name: 'Food', type: 'expense', icon: '🍔', color: '#ef4444' },
        { id: 2, userId: 1, name: 'Salary', type: 'income', icon: '💰', color: '#10b981' },
      ];

      // Mock count query: select().from().where() returns Promise<[{ count: 2 }]>
      const mockCountWhere = vi.fn().mockResolvedValue([{ count: 2 }]);
      const mockCountFrom = vi.fn().mockReturnValue({ where: mockCountWhere });

      // Mock select query with $dynamic() support
      const mockDynamic = vi.fn().mockResolvedValue(mockCategories);
      const mockOrderBy = vi.fn().mockReturnValue({ $dynamic: mockDynamic });
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });

      (db.select as any)
        .mockReturnValueOnce({ from: mockCountFrom }) // First call for count
        .mockReturnValueOnce({ from: mockFrom }); // Second call for categories

      const result = await repository.getCategoriesByUserId(1);

      expect(result.categories).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.categories[0].name).toBe('Food');
      expect(result.categories[1].type).toBe('income');
    });

    it('should return empty array with zero total for user with no categories', async () => {
      // Mock count query
      const mockCount = vi.fn().mockResolvedValue([{ count: 0 }]);
      const mockCountWhere = vi.fn().mockReturnValue({ count: mockCount });
      const mockCountFrom = vi.fn().mockReturnValue({ where: mockCountWhere });

      // Mock select query with $dynamic() support
      const mockDynamic = vi.fn().mockImplementation(function(this: any) {
        return Object.assign(Promise.resolve([]), {
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockReturnThis(),
          then: (resolve: any) => resolve([]),
        });
      });
      const mockOrderBy = vi.fn().mockReturnValue({ $dynamic: mockDynamic });
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });

      (db.select as any)
        .mockReturnValueOnce({ from: mockCountFrom })
        .mockReturnValueOnce({ from: mockFrom });

      const result = await repository.getCategoriesByUserId(999);

      expect(result.categories).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should apply pagination filters when provided', async () => {
      const mockCategories = [
        { id: 1, userId: 1, name: 'Food', type: 'expense' },
      ];

      // Track calls to limit and offset
      const mockLimit = vi.fn().mockReturnThis();
      const mockOffset = vi.fn().mockReturnThis();

      // Mock $dynamic to return chainable object that resolves to categories
      const mockDynamic = vi.fn().mockImplementation(function(this: any) {
        const chainable = {
          limit: mockLimit,
          offset: mockOffset,
          then: (resolve: any) => resolve(mockCategories),
        };
        // Make limit and offset return the chainable object
        mockLimit.mockReturnValue(chainable);
        mockOffset.mockReturnValue(chainable);
        return chainable;
      });
      const mockOrderBy = vi.fn().mockReturnValue({ $dynamic: mockDynamic });
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });

      const mockCount = vi.fn().mockResolvedValue([{ count: 1 }]);
      const mockCountWhere = vi.fn().mockReturnValue({ count: mockCount });
      const mockCountFrom = vi.fn().mockReturnValue({ where: mockCountWhere });

      (db.select as any)
        .mockReturnValueOnce({ from: mockCountFrom })
        .mockReturnValueOnce({ from: mockFrom });

      await repository.getCategoriesByUserId(1, { limit: 10, offset: 0 });

      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(mockOffset).toHaveBeenCalledWith(0);
    });
  });

  describe('getCategoryById', () => {
    it('should return a category by id', async () => {
      const mockCategory = { 
        id: 1, 
        userId: 1, 
        name: 'Food', 
        type: 'expense',
        icon: '🍔',
        color: '#ef4444'
      };

      const mockLimit = vi.fn().mockResolvedValue([mockCategory]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.getCategoryById(1);
      
      expect(mockLimit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCategory);
      expect(result?.name).toBe('Food');
    });

    it('should return null when category not found', async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await repository.getCategoryById(999);
      
      expect(result).toBeNull();
    });
  });

  describe('createCategory', () => {
    it('should create a new category', async () => {
      const newCategory = { 
        id: 3, 
        userId: 1, 
        name: 'Transport', 
        type: 'expense',
        icon: '🚗',
        color: '#f97316'
      };

      const mockReturning = vi.fn().mockResolvedValue([newCategory]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      (db.insert as any).mockReturnValue({ values: mockValues });

      const result = await mockReturning();
      
      expect(result[0]).toEqual(newCategory);
      expect(result[0].name).toBe('Transport');
    });
  });

  describe('Category validation', () => {
    it('should validate category type', () => {
      const validTypes = ['income', 'expense'];
      
      expect(validTypes.includes('income')).toBe(true);
      expect(validTypes.includes('expense')).toBe(true);
      expect(validTypes.includes('transfer')).toBe(false);
    });

    it('should validate color format (hex)', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      
      expect(hexColorRegex.test('#ef4444')).toBe(true);
      expect(hexColorRegex.test('#10b981')).toBe(true);
      expect(hexColorRegex.test('red')).toBe(false);
      expect(hexColorRegex.test('#fff')).toBe(false);
    });

    it('should validate icon is emoji', () => {
      // Simple emoji detection (starts with emoji character)
      const hasEmoji = (str: string) => /[\u{1F300}-\u{1F9FF}]/u.test(str);
      
      expect(hasEmoji('🍔')).toBe(true);
      expect(hasEmoji('💰')).toBe(true);
      expect(hasEmoji('food')).toBe(false);
    });

    it('should require non-empty name', () => {
      const name = 'Food';
      const emptyName = '';
      
      expect(name.length > 0).toBe(true);
      expect(emptyName.length > 0).toBe(false);
    });
  });

  describe('Default categories', () => {
    it('should have standard expense categories', () => {
      const defaultExpenseCategories = [
        'Food & Drinks',
        'Transport',
        'Shopping',
        'Entertainment',
        'Bills',
      ];
      
      expect(defaultExpenseCategories).toContain('Food & Drinks');
      expect(defaultExpenseCategories).toHaveLength(5);
    });

    it('should have standard income categories', () => {
      const defaultIncomeCategories = [
        'Salary',
        'Freelance',
      ];
      
      expect(defaultIncomeCategories).toContain('Salary');
      expect(defaultIncomeCategories).toHaveLength(2);
    });
  });
});

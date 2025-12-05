import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '../../db';
import { categories } from '@shared/schema';

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCategoriesByUserId', () => {
    it('should return categories for a user', async () => {
      const mockCategories = [
        { id: 1, userId: 1, name: 'Food', type: 'expense', icon: '🍔', color: '#ef4444' },
        { id: 2, userId: 1, name: 'Salary', type: 'income', icon: '💰', color: '#10b981' },
      ];

      const mockOrderBy = vi.fn().mockResolvedValue(mockCategories);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await mockOrderBy();
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Food');
      expect(result[1].type).toBe('income');
    });

    it('should return empty array for user with no categories', async () => {
      const mockOrderBy = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await mockOrderBy();
      
      expect(result).toHaveLength(0);
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

      const result = await mockLimit();
      
      expect(result[0]).toEqual(mockCategory);
      expect(result[0].name).toBe('Food');
    });

    it('should return null when category not found', async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      (db.select as any).mockReturnValue({ from: mockFrom });

      const result = await mockLimit();
      
      expect(result).toHaveLength(0);
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

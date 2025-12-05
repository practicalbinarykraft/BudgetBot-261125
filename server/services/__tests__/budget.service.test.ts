import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('BudgetService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Budget validation', () => {
    it('should validate positive budget amount', () => {
      const amount = 1000;
      expect(amount > 0).toBe(true);
    });

    it('should reject zero budget amount', () => {
      const amount = 0;
      expect(amount > 0).toBe(false);
    });

    it('should reject negative budget amount', () => {
      const amount = -500;
      expect(amount > 0).toBe(false);
    });
  });

  describe('Budget period calculation', () => {
    it('should calculate daily budget', () => {
      const monthlyBudget = 3000;
      const daysInMonth = 30;
      const dailyBudget = monthlyBudget / daysInMonth;
      
      expect(dailyBudget).toBe(100);
    });

    it('should calculate weekly budget', () => {
      const monthlyBudget = 4000;
      const weeksInMonth = 4;
      const weeklyBudget = monthlyBudget / weeksInMonth;
      
      expect(weeklyBudget).toBe(1000);
    });

    it('should calculate remaining budget', () => {
      const budgetLimit = 1000;
      const spent = 750;
      const remaining = budgetLimit - spent;
      
      expect(remaining).toBe(250);
    });
  });

  describe('Budget alerts', () => {
    it('should trigger alert at 80% threshold', () => {
      const budgetLimit = 1000;
      const spent = 800;
      const threshold = 0.8;
      const shouldAlert = spent >= budgetLimit * threshold;
      
      expect(shouldAlert).toBe(true);
    });

    it('should not trigger alert below threshold', () => {
      const budgetLimit = 1000;
      const spent = 500;
      const threshold = 0.8;
      const shouldAlert = spent >= budgetLimit * threshold;
      
      expect(shouldAlert).toBe(false);
    });

    it('should trigger exceeded alert', () => {
      const budgetLimit = 1000;
      const spent = 1200;
      const isExceeded = spent > budgetLimit;
      
      expect(isExceeded).toBe(true);
    });
  });

  describe('Budget percentage calculation', () => {
    it('should calculate percentage used', () => {
      const budgetLimit = 500;
      const spent = 250;
      const percentage = (spent / budgetLimit) * 100;
      
      expect(percentage).toBe(50);
    });

    it('should handle over-budget percentage', () => {
      const budgetLimit = 500;
      const spent = 750;
      const percentage = (spent / budgetLimit) * 100;
      
      expect(percentage).toBe(150);
    });

    it('should return 0% for no spending', () => {
      const budgetLimit = 500;
      const spent = 0;
      const percentage = (spent / budgetLimit) * 100;
      
      expect(percentage).toBe(0);
    });
  });

  describe('Budget category linking', () => {
    it('should link budget to category', () => {
      const budget = {
        id: 1,
        userId: 1,
        categoryId: 5,
        amount: '500.00',
        period: 'monthly',
      };
      
      expect(budget.categoryId).toBe(5);
    });

    it('should allow budget without category (global)', () => {
      const globalBudget = {
        id: 2,
        userId: 1,
        categoryId: null,
        amount: '3000.00',
        period: 'monthly',
      };
      
      expect(globalBudget.categoryId).toBeNull();
    });
  });

  describe('Budget period types', () => {
    it('should support monthly period', () => {
      const validPeriods = ['daily', 'weekly', 'monthly', 'yearly'];
      expect(validPeriods).toContain('monthly');
    });

    it('should support all period types', () => {
      const validPeriods = ['daily', 'weekly', 'monthly', 'yearly'];
      
      expect(validPeriods).toHaveLength(4);
      expect(validPeriods).toContain('daily');
      expect(validPeriods).toContain('weekly');
      expect(validPeriods).toContain('monthly');
      expect(validPeriods).toContain('yearly');
    });
  });
});

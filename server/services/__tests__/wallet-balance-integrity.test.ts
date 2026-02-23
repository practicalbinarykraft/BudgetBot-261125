import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock db before imports
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();

vi.mock('../../db', () => ({
  db: {
    select: (...args: any[]) => mockSelect(...args),
    insert: (...args: any[]) => mockInsert(...args),
    update: (...args: any[]) => mockUpdate(...args),
  },
}));

vi.mock('../../lib/logger', () => ({
  logWarning: vi.fn(),
  logError: vi.fn(),
}));

import {
  roundTo2,
  validateBalanceDelta,
  recalculateWalletBalanceUsd,
  verifyWalletBalanceUsd,
  repairWalletBalanceUsd,
} from '../wallet-balance-integrity.service';
import { logWarning } from '../../lib/logger';
import { BadRequestError } from '../../lib/errors';

// Helper: chainable mock for db.select().from().where().limit()
function chainable(data: any[]) {
  const whereResult: any = Promise.resolve(data);
  whereResult.limit = vi.fn().mockResolvedValue(data);

  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue(whereResult),
    }),
  };
}

describe('wallet-balance-integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('roundTo2', () => {
    it('rounds to 2 decimal places', () => {
      expect(roundTo2(1.005)).toBe(1.01);
      expect(roundTo2(1.006)).toBe(1.01);
      expect(roundTo2(1.004)).toBe(1);
      expect(roundTo2(100.456)).toBe(100.46);
      expect(roundTo2(0)).toBe(0);
      expect(roundTo2(99.999)).toBe(100);
    });
  });

  describe('recalculateWalletBalanceUsd', () => {
    it('returns openingBalanceUsd + income - expense rounded to 2 decimals', async () => {
      let callCount = 0;
      mockSelect.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: get wallet opening balance
          return chainable([{ openingBalanceUsd: '1000.00' }]);
        }
        // Second call: get transaction sums
        return chainable([{ totalIncome: '500.50', totalExpense: '200.25' }]);
      });

      const result = await recalculateWalletBalanceUsd(1, 1);
      expect(result).toBe(1300.25); // 1000 + 500.50 - 200.25
    });

    it('returns openingBalanceUsd when wallet has no transactions', async () => {
      let callCount = 0;
      mockSelect.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return chainable([{ openingBalanceUsd: '5000.00' }]);
        }
        return chainable([{ totalIncome: '0', totalExpense: '0' }]);
      });

      const result = await recalculateWalletBalanceUsd(1, 1);
      expect(result).toBe(5000.00);
    });

    it('throws when wallet not found', async () => {
      mockSelect.mockReturnValue(chainable([]));

      await expect(recalculateWalletBalanceUsd(999, 1)).rejects.toThrow('Wallet not found');
    });
  });

  describe('verifyWalletBalanceUsd', () => {
    it('returns ok: true when balanceUsd matches recalculated', async () => {
      let callCount = 0;
      mockSelect.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // recalculate: wallet opening
          return chainable([{ openingBalanceUsd: '1000.00' }]);
        }
        if (callCount === 2) {
          // recalculate: transaction sums
          return chainable([{ totalIncome: '500.00', totalExpense: '200.00' }]);
        }
        // verify: current balanceUsd
        return chainable([{ balanceUsd: '1300.00' }]);
      });

      const result = await verifyWalletBalanceUsd(1, 1);
      expect(result.ok).toBe(true);
      expect(result.expectedUsd).toBe(1300.00);
      expect(result.currentUsd).toBe(1300.00);
      expect(result.diffUsd).toBe(0);
      expect(logWarning).not.toHaveBeenCalled();
    });

    it('returns ok: false and calls logWarning when mismatch > 0.02', async () => {
      let callCount = 0;
      mockSelect.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return chainable([{ openingBalanceUsd: '1000.00' }]);
        }
        if (callCount === 2) {
          return chainable([{ totalIncome: '500.00', totalExpense: '200.00' }]);
        }
        // Current balance is way off
        return chainable([{ balanceUsd: '800.00' }]);
      });

      const result = await verifyWalletBalanceUsd(1, 1);
      expect(result.ok).toBe(false);
      expect(result.expectedUsd).toBe(1300.00);
      expect(result.currentUsd).toBe(800.00);
      expect(result.diffUsd).toBe(500.00);
      expect(logWarning).toHaveBeenCalledWith(
        '[BalanceIntegrity] Drift detected',
        expect.objectContaining({ diffUsd: 500.00 })
      );
    });
  });

  describe('validateBalanceDelta', () => {
    it('throws BadRequestError for NaN', () => {
      expect(() => validateBalanceDelta(NaN, 'test')).toThrow(BadRequestError);
    });

    it('throws BadRequestError for Infinity', () => {
      expect(() => validateBalanceDelta(Infinity, 'test')).toThrow(BadRequestError);
      expect(() => validateBalanceDelta(-Infinity, 'test')).toThrow(BadRequestError);
    });

    it('throws BadRequestError for delta > 1,000,000', () => {
      expect(() => validateBalanceDelta(1_000_001, 'test')).toThrow(BadRequestError);
      expect(() => validateBalanceDelta(-1_000_001, 'test')).toThrow(BadRequestError);
    });

    it('passes for normal values', () => {
      expect(() => validateBalanceDelta(100, 'test')).not.toThrow();
      expect(() => validateBalanceDelta(0, 'test')).not.toThrow();
      expect(() => validateBalanceDelta(-500.50, 'test')).not.toThrow();
      expect(() => validateBalanceDelta(999_999, 'test')).not.toThrow();
    });
  });

  describe('repairWalletBalanceUsd', () => {
    it('updates wallet.balanceUsd to expected value', async () => {
      let callCount = 0;
      mockSelect.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return chainable([{ openingBalanceUsd: '1000.00' }]);
        }
        if (callCount === 2) {
          return chainable([{ totalIncome: '500.00', totalExpense: '200.00' }]);
        }
        // Current balance is wrong
        return chainable([{ balanceUsd: '800.00' }]);
      });

      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await repairWalletBalanceUsd(1, 1);
      expect(result.repaired).toBe(true);
      expect(result.oldUsd).toBe(800.00);
      expect(result.newUsd).toBe(1300.00);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('does not update when balance is correct', async () => {
      let callCount = 0;
      mockSelect.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return chainable([{ openingBalanceUsd: '1000.00' }]);
        }
        if (callCount === 2) {
          return chainable([{ totalIncome: '0', totalExpense: '0' }]);
        }
        return chainable([{ balanceUsd: '1000.00' }]);
      });

      const result = await repairWalletBalanceUsd(1, 1);
      expect(result.repaired).toBe(false);
      expect(result.oldUsd).toBe(1000.00);
      expect(result.newUsd).toBe(1000.00);
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});

import { describe, it, expect, beforeAll, vi } from 'vitest';

// Mock the database module before importing currency service
vi.mock('../../db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
}));

// Mock Redis cache
vi.mock('../../lib/redis', () => ({
  cache: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
  },
  CACHE_TTL: {
    VERY_SHORT: 300,
    SHORT: 600,
    MEDIUM: 1800,
    LONG: 3600,
    VERY_LONG: 7200,
  },
}));

import {
  convertToUSD,
  convertFromUSD,
  getSupportedCurrencies,
  getExchangeRate,
  convertWithRate,
} from '../currency-service';

// Set DATABASE_URL for tests
beforeAll(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
});

describe('CurrencyService', () => {
  describe('convertToUSD', () => {
    it('should convert USD to USD (no conversion)', () => {
      const result = convertToUSD(100, 'USD');
      expect(result).toBe(100);
    });

    it('should convert RUB to USD', () => {
      const result = convertToUSD(9250, 'RUB');
      expect(result).toBeCloseTo(100, 2);
    });

    it('should convert EUR to USD', () => {
      const result = convertToUSD(92, 'EUR');
      expect(result).toBeCloseTo(100, 2);
    });

    it('should convert IDR to USD', () => {
      const result = convertToUSD(1575000, 'IDR');
      expect(result).toBeCloseTo(100, 2);
    });

    it('should handle unknown currency (defaults to 1)', () => {
      const result = convertToUSD(100, 'UNKNOWN');
      expect(result).toBe(100);
    });

    it('should use custom rates when provided', () => {
      const customRates = { RUB: 100 };
      const result = convertToUSD(1000, 'RUB', customRates);
      expect(result).toBe(10);
    });
  });

  describe('convertFromUSD', () => {
    it('should convert USD to USD (no conversion)', () => {
      const result = convertFromUSD(100, 'USD');
      expect(result).toBe(100);
    });

    it('should convert USD to RUB', () => {
      const result = convertFromUSD(100, 'RUB');
      expect(result).toBeCloseTo(9250, 2);
    });

    it('should convert USD to EUR', () => {
      const result = convertFromUSD(100, 'EUR');
      expect(result).toBeCloseTo(92, 2);
    });

    it('should convert USD to KRW', () => {
      const result = convertFromUSD(100, 'KRW');
      expect(result).toBeCloseTo(132000, 2);
    });

    it('should handle unknown currency (defaults to 1)', () => {
      const result = convertFromUSD(100, 'UNKNOWN');
      expect(result).toBe(100);
    });

    it('should use custom rates when provided', () => {
      const customRates = { EUR: 0.85 };
      const result = convertFromUSD(100, 'EUR', customRates);
      expect(result).toBe(85);
    });
  });

  describe('getSupportedCurrencies', () => {
    it('should return array of supported currencies', () => {
      const currencies = getSupportedCurrencies();
      expect(currencies).toContain('USD');
      expect(currencies).toContain('RUB');
      expect(currencies).toContain('EUR');
      expect(currencies).toContain('IDR');
      expect(currencies).toContain('KRW');
      expect(currencies).toContain('CNY');
    });

    it('should return at least 6 currencies', () => {
      const currencies = getSupportedCurrencies();
      expect(currencies.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('getExchangeRate', () => {
    it('should return exchange rate for USD', () => {
      const rate = getExchangeRate('USD');
      expect(rate).toBe(1);
    });

    it('should return exchange rate for RUB', () => {
      const rate = getExchangeRate('RUB');
      expect(rate).toBe(92.5);
    });

    it('should return exchange rate for EUR', () => {
      const rate = getExchangeRate('EUR');
      expect(rate).toBe(0.92);
    });

    it('should return 1 for unknown currency', () => {
      const rate = getExchangeRate('UNKNOWN');
      expect(rate).toBe(1);
    });

    it('should use custom rates when provided', () => {
      const customRates = { RUB: 95 };
      const rate = getExchangeRate('RUB', customRates);
      expect(rate).toBe(95);
    });
  });

  describe('convertWithRate', () => {
    it('should convert and return rate for same currency', () => {
      const result = convertWithRate(100, 'USD', 'USD');
      expect(result.amount).toBe(100);
      expect(result.rate).toBe(1);
    });

    it('should convert USD to RUB and return rate', () => {
      const result = convertWithRate(100, 'USD', 'RUB');
      expect(result.amount).toBeCloseTo(9250, 2);
      expect(result.rate).toBeCloseTo(92.5, 2);
    });

    it('should convert RUB to USD and return rate', () => {
      const result = convertWithRate(9250, 'RUB', 'USD');
      expect(result.amount).toBeCloseTo(100, 2);
      expect(result.rate).toBeCloseTo(1 / 92.5, 5);
    });

    it('should convert RUB to EUR via USD', () => {
      const result = convertWithRate(9250, 'RUB', 'EUR');
      // 9250 RUB -> 100 USD -> 92 EUR
      expect(result.amount).toBeCloseTo(92, 1);
    });

    it('should use custom rates when provided', () => {
      const customRates = { RUB: 100, EUR: 0.9 };
      const result = convertWithRate(100, 'RUB', 'EUR', customRates);
      // 100 RUB -> 1 USD -> 0.9 EUR
      expect(result.amount).toBeCloseTo(0.9, 2);
    });
  });

  describe('Round-trip conversions', () => {
    it('should convert USD -> RUB -> USD and get same amount', () => {
      const original = 100;
      const rub = convertFromUSD(original, 'RUB');
      const backToUsd = convertToUSD(rub, 'RUB');
      expect(backToUsd).toBeCloseTo(original, 2);
    });

    it('should convert USD -> EUR -> USD and get same amount', () => {
      const original = 100;
      const eur = convertFromUSD(original, 'EUR');
      const backToUsd = convertToUSD(eur, 'EUR');
      expect(backToUsd).toBeCloseTo(original, 2);
    });

    it('should convert USD -> IDR -> USD and get same amount', () => {
      const original = 100;
      const idr = convertFromUSD(original, 'IDR');
      const backToUsd = convertToUSD(idr, 'IDR');
      expect(backToUsd).toBeCloseTo(original, 2);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero amount', () => {
      const result = convertToUSD(0, 'RUB');
      expect(result).toBe(0);
    });

    it('should handle negative amount', () => {
      const result = convertToUSD(-100, 'RUB');
      expect(result).toBeCloseTo(-100 / 92.5, 2);
    });

    it('should handle very large amounts', () => {
      const result = convertToUSD(1000000000, 'RUB');
      expect(result).toBeCloseTo(1000000000 / 92.5, 2);
    });

    it('should handle decimal amounts', () => {
      const result = convertToUSD(92.5, 'RUB');
      expect(result).toBeCloseTo(1, 5);
    });
  });
});

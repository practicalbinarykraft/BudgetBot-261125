import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all external dependencies before imports
vi.mock('../../storage', () => ({
  storage: {
    getTransactionsByUserId: vi.fn(),
    getWalletsByUserId: vi.fn(),
  },
}));

vi.mock('../../repositories/assets.repository', () => ({
  assetsRepository: {
    findByUserId: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../asset-value-calculator.service', () => ({
  assetValueCalculator: {
    calculateValueAtDate: vi.fn().mockReturnValue(0),
  },
}));

vi.mock('../liability-calculator.service', () => ({
  liabilityCalculator: {
    calculateValueAtDate: vi.fn().mockReturnValue(0),
  },
}));

vi.mock('../forecast', () => ({
  generateForecast: vi.fn().mockResolvedValue({
    forecast: [],
    metadata: { usedAI: false, fromCache: false, cacheExpiresAt: null },
  }),
}));

vi.mock('../../lib/logger', () => ({
  logWarning: vi.fn(),
  logError: vi.fn(),
}));

import { calculateTrend } from '../trend-calculator.service';
import { storage } from '../../storage';

describe('trend-sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('corrects opening balance so today capital (no assets) = currentWalletsBalance', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Wallet: openingBalanceUsd=1000 but actual balanceUsd=2000
    // This simulates drift: opening was never updated after some external change
    (storage.getWalletsByUserId as any).mockResolvedValue({
      wallets: [
        {
          id: 1,
          userId: 1,
          name: 'Main',
          type: 'cash',
          balance: '2000.00',
          balanceUsd: '2000.00',
          currency: 'USD',
          openingBalanceUsd: '1000.00',
          openingBalanceDate: '2025-01-01',
          isPrimary: 1,
        },
      ],
      total: 1,
    });

    // Transactions: 700 income, 200 expense = net +500
    // With corrected opening: syncedOpening = 2000 - 500 = 1500
    // Today's capital = 1500 + 700 - 200 = 2000 = currentWalletsBalance ✓
    (storage.getTransactionsByUserId as any).mockResolvedValue({
      transactions: [
        {
          id: 1,
          userId: 1,
          date: todayStr,
          type: 'income',
          amount: '700.00',
          amountUsd: '700.00',
          description: 'Salary',
          currency: 'USD',
          walletId: 1,
        },
        {
          id: 2,
          userId: 1,
          date: todayStr,
          type: 'expense',
          amount: '200.00',
          amountUsd: '200.00',
          description: 'Rent',
          currency: 'USD',
          walletId: 1,
        },
      ],
      total: 2,
    });

    const result = await calculateTrend({
      userId: 1,
      historyDays: 7,
      forecastDays: 0,
      useAI: false,
      includeAssetValue: false,
      includeLiabilityValue: false,
    });

    // Find today's data point
    const todayPoint = result.trendData.find(p => p.isToday);
    expect(todayPoint).toBeDefined();

    // Today's capital (without assets) should equal currentWalletsBalance = 2000
    // If opening wasn't synced, capital would be 1000 + 700 - 200 = 1500 (wrong)
    expect(todayPoint!.capital).toBeCloseTo(2000, 1);
  });
});

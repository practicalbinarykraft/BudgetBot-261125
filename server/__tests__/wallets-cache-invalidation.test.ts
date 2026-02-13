/**
 * Test: Wallet mutations (POST/PATCH/DELETE/calibrate) invalidate cache
 * using delPattern('wallets:user:{userId}:*'), NOT exact cache.del().
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockCacheGet,
  mockCacheSet,
  mockCacheDelPattern,
  mockGetWalletsByUserId,
  mockGetWalletById,
  mockCreateWallet,
  mockUpdateWallet,
  mockDeleteWallet,
  mockCalibrateWallet,
} = vi.hoisted(() => ({
  mockCacheGet: vi.fn().mockResolvedValue(null),
  mockCacheSet: vi.fn().mockResolvedValue(true),
  mockCacheDelPattern: vi.fn().mockResolvedValue(true),
  mockGetWalletsByUserId: vi.fn(),
  mockGetWalletById: vi.fn(),
  mockCreateWallet: vi.fn(),
  mockUpdateWallet: vi.fn(),
  mockDeleteWallet: vi.fn(),
  mockCalibrateWallet: vi.fn(),
}));

vi.mock('../lib/redis', () => ({
  cache: {
    get: mockCacheGet,
    set: mockCacheSet,
    del: vi.fn().mockResolvedValue(true),
    delPattern: mockCacheDelPattern,
  },
  CACHE_TTL: { SHORT: 60, MEDIUM: 300, LONG: 1800 },
}));

vi.mock('../storage', () => ({
  storage: {
    getWalletsByUserId: mockGetWalletsByUserId,
    getWalletById: mockGetWalletById,
    createWallet: mockCreateWallet,
    updateWallet: mockUpdateWallet,
    deleteWallet: mockDeleteWallet,
  },
}));

vi.mock('@shared/schema', () => ({
  insertWalletSchema: {
    parse: (data: any) => data,
    partial: () => ({ parse: (data: any) => data }),
  },
}));

vi.mock('../services/currency-service', () => ({
  convertToUSD: vi.fn((amount: number) => amount),
}));

vi.mock('../services/calibration.service', () => ({
  calibrateWallet: mockCalibrateWallet,
}));

vi.mock('../services/audit-log.service', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE' },
  AuditEntityType: { WALLET: 'WALLET' },
}));

vi.mock('../lib/errors', () => ({
  getErrorMessage: (e: any) => e?.message || 'Unknown error',
}));

vi.mock('../middleware/auth-utils', () => ({
  withAuth: (handler: any) => (req: any, res: any, next: any) => {
    req.user = { id: 1 };
    return handler(req, res, next);
  },
}));

import router from '../routes/wallets.routes';
import express from 'express';
import request from 'supertest';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/wallets', router);
  return app;
}

describe('Wallets cache invalidation — delPattern', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/wallets invalidates with pattern wallets:user:{id}:*', async () => {
    mockCreateWallet.mockResolvedValue({
      id: 1, name: 'Test', currency: 'USD', balance: '100',
    });

    const app = createApp();
    await request(app)
      .post('/api/wallets')
      .send({ name: 'Test', type: 'cash', balance: '100', currency: 'USD', userId: 1 });

    expect(mockCacheDelPattern).toHaveBeenCalledWith('wallets:user:1:*');
  });

  it('PATCH /api/wallets/:id invalidates with pattern wallets:user:{id}:*', async () => {
    mockGetWalletById.mockResolvedValue({ id: 1, userId: 1, name: 'Old', currency: 'USD', balance: '100' });
    mockUpdateWallet.mockResolvedValue({ id: 1, name: 'New' });

    const app = createApp();
    await request(app)
      .patch('/api/wallets/1')
      .send({ name: 'New' });

    expect(mockCacheDelPattern).toHaveBeenCalledWith('wallets:user:1:*');
  });

  it('DELETE /api/wallets/:id invalidates with pattern wallets:user:{id}:*', async () => {
    mockGetWalletById.mockResolvedValue({ id: 1, userId: 1, name: 'Test' });
    mockDeleteWallet.mockResolvedValue(undefined);

    const app = createApp();
    await request(app).delete('/api/wallets/1');

    expect(mockCacheDelPattern).toHaveBeenCalledWith('wallets:user:1:*');
  });

  it('POST /api/wallets/:id/calibrate invalidates with pattern wallets:user:{id}:*', async () => {
    mockCalibrateWallet.mockResolvedValue({
      calibration: { expectedBalance: '100', difference: '10' },
      transactionCreated: true,
    });

    const app = createApp();
    await request(app)
      .post('/api/wallets/1/calibrate')
      .send({ actualBalance: 110 });

    expect(mockCacheDelPattern).toHaveBeenCalledWith('wallets:user:1:*');
  });

  it('never calls cache.del with exact wallets key (regression guard)', async () => {
    const { cache } = await import('../lib/redis');

    mockCreateWallet.mockResolvedValue({ id: 1, name: 'Test', currency: 'USD', balance: '100' });
    mockGetWalletById.mockResolvedValue({ id: 1, userId: 1, name: 'Test' });
    mockDeleteWallet.mockResolvedValue(undefined);

    const app = createApp();

    await request(app).post('/api/wallets').send({ name: 'T', type: 'cash', balance: '0', currency: 'USD', userId: 1 });
    await request(app).patch('/api/wallets/1').send({ name: 'U' });
    await request(app).delete('/api/wallets/1');

    // cache.del should never be called with a wallets key
    for (const call of (cache.del as any).mock.calls) {
      expect(call[0]).not.toMatch(/^wallets:user:/);
    }
  });
});

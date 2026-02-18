/**
 * PATCH /api/wallets/:id/primary — Set wallet as primary
 *
 * Tests:
 * 1. Sets chosen wallet isPrimary=1, clears old primary
 * 2. Guarantees single primary per user
 * 3. 403 for another user's wallet
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import walletsRouter from '../wallets.routes';

// ── In-memory wallet store ──────────────────────────────────────────
let walletStore: Array<{
  id: number;
  userId: number;
  name: string;
  isPrimary: number;
  [key: string]: any;
}> = [];

vi.mock('../../middleware/auth-utils', () => ({
  withAuth: (handler: any) => {
    return async (req: any, res: any, next: any) => {
      req.user = { id: req.headers['x-test-user-id'] || '1' };
      try {
        await handler(req, res, next);
      } catch (err) {
        next(err);
      }
    };
  },
}));

vi.mock('../../storage', () => ({
  storage: {
    getWalletsByUserId: vi.fn(async (userId: number) => {
      const userWallets = walletStore.filter((w) => w.userId === userId);
      return { wallets: userWallets, total: userWallets.length };
    }),
    getWalletById: vi.fn(async (id: number) => {
      return walletStore.find((w) => w.id === id) || null;
    }),
    createWallet: vi.fn(),
    updateWallet: vi.fn(),
    deleteWallet: vi.fn(),
  },
}));

vi.mock('../../lib/redis', () => ({
  cache: { get: vi.fn(), set: vi.fn(), delPattern: vi.fn() },
  CACHE_TTL: { LONG: 1800 },
}));

vi.mock('../../services/currency-service', () => ({
  convertToUSD: vi.fn((amount: number) => amount),
}));

vi.mock('../../services/calibration.service', () => ({
  calibrateWallet: vi.fn(),
}));

vi.mock('../../services/audit-log.service', () => ({
  logAuditEvent: vi.fn(),
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE' },
  AuditEntityType: { WALLET: 'WALLET' },
}));

// Mock db for the primary endpoint (direct drizzle calls)
const mockDbUpdate = vi.fn().mockReturnValue({
  set: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue(undefined),
  }),
});

vi.mock('../../db', () => ({
  db: {
    update: (...args: any[]) => mockDbUpdate(...args),
    transaction: vi.fn(async (cb: any) => {
      // Execute the callback, passing a mock tx that delegates to the same mock
      return cb({
        update: (...args: any[]) => mockDbUpdate(...args),
      });
    }),
  },
}));

vi.mock('@shared/schema', () => ({
  wallets: Symbol('wallets'),
  insertWalletSchema: {
    parse: (data: any) => data,
    partial: () => ({ parse: (data: any) => data }),
  },
}));

// ── App setup ───────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/api/wallets', walletsRouter);

describe('PATCH /api/wallets/:id/primary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    walletStore = [
      { id: 1, userId: 1, name: 'Wallet A', isPrimary: 1, balance: '100', currency: 'USD', balanceUsd: '100' },
      { id: 2, userId: 1, name: 'Wallet B', isPrimary: 0, balance: '200', currency: 'USD', balanceUsd: '200' },
      { id: 3, userId: 2, name: 'Other User', isPrimary: 1, balance: '50', currency: 'USD', balanceUsd: '50' },
    ];
  });

  it('sets chosen wallet as primary and clears old primary', async () => {
    const res = await request(app)
      .patch('/api/wallets/2/primary')
      .set('x-test-user-id', '1')
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // db.transaction should have been called (atomicity)
    const { db } = await import('../../db');
    expect(db.transaction).toHaveBeenCalled();
  });

  it('guarantees at most one isPrimary=1 per user (two UPDATE calls in tx)', async () => {
    await request(app)
      .patch('/api/wallets/2/primary')
      .set('x-test-user-id', '1')
      .send();

    // Should have called update twice: clear all, then set one
    expect(mockDbUpdate).toHaveBeenCalledTimes(2);
  });

  it('returns 403 for wallet belonging to another user', async () => {
    const res = await request(app)
      .patch('/api/wallets/3/primary')
      .set('x-test-user-id', '1')
      .send();

    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent wallet', async () => {
    const res = await request(app)
      .patch('/api/wallets/999/primary')
      .set('x-test-user-id', '1')
      .send();

    expect(res.status).toBe(404);
  });
});

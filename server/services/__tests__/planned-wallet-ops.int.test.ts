/**
 * Planned Wallet Operations — Integration Tests
 *
 * Proves atomicity with a real DB: if updateWalletBalance throws
 * (e.g. overdraft), the transaction row is rolled back too.
 *
 * Uses the same skipIf(!dbAvailable) pattern as password-recovery tests.
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { db, pool } from '../../db';
import { users, wallets, transactions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { applyPlannedPurchase, applyPlannedIncome } from '../planned-wallet-ops.service';

// Mock logger only — everything else is real
vi.mock('../../lib/logger', () => ({
  logInfo: vi.fn(),
  logWarning: vi.fn(),
  logError: vi.fn(),
}));

describe('planned-wallet-ops (integration)', () => {
  let dbAvailable = false;
  let testUser: any;
  let testWallet: any;

  const TEST_MARKER = `int-test-${Date.now()}`;

  beforeAll(async () => {
    try {
      await pool.query('SELECT 1');
      dbAvailable = true;
    } catch {
      dbAvailable = false;
      console.warn('Database not available, skipping integration tests');
    }
  });

  beforeEach(async () => {
    if (!dbAvailable) return;

    // Create test user
    const [user] = await db.insert(users).values({
      email: `planned-ops-test-${Date.now()}@test.com`,
      password: 'hashed',
      name: 'Test User',
    }).returning();
    testUser = user;

    // Create test wallet with known balance
    const [wallet] = await db.insert(wallets).values({
      userId: testUser.id,
      name: 'Test Wallet',
      type: 'card',
      balance: '100.00',
      balanceUsd: '100.00',
      currency: 'USD',
    }).returning();
    testWallet = wallet;
  });

  afterEach(async () => {
    if (!dbAvailable || !testUser) return;

    // Cleanup in FK order
    await db.delete(transactions).where(eq(transactions.userId, testUser.id));
    await db.delete(wallets).where(eq(wallets.userId, testUser.id));
    await db.delete(users).where(eq(users.id, testUser.id));
  });

  it.skipIf(!dbAvailable)(
    'applyPlannedPurchase creates transaction and updates balance atomically',
    async () => {
      const result = await applyPlannedPurchase({
        userId: testUser.id,
        walletId: testWallet.id,
        amount: '25.00',
        currency: 'USD',
        amountUsd: '25.00',
        description: TEST_MARKER,
        category: 'Test',
        date: new Date().toISOString().split('T')[0],
        source: 'manual',
      });

      expect(result.id).toBeDefined();

      // Verify transaction was created
      const [tx] = await db.select().from(transactions)
        .where(and(
          eq(transactions.userId, testUser.id),
          eq(transactions.description, TEST_MARKER),
        )).limit(1);
      expect(tx).toBeDefined();
      expect(tx.type).toBe('expense');

      // Verify wallet balance was updated
      const [wallet] = await db.select().from(wallets)
        .where(eq(wallets.id, testWallet.id)).limit(1);
      expect(wallet.balance).toBe('75.00');
      expect(wallet.balanceUsd).toBe('75.00');
    }
  );

  it.skipIf(!dbAvailable)(
    'applyPlannedPurchase rolls back transaction insert on overdraft',
    async () => {
      const overdraftMarker = `overdraft-${Date.now()}`;

      // Try to spend more than available balance
      await expect(
        applyPlannedPurchase({
          userId: testUser.id,
          walletId: testWallet.id,
          amount: '500.00',
          currency: 'USD',
          amountUsd: '500.00',
          description: overdraftMarker,
          date: new Date().toISOString().split('T')[0],
          source: 'manual',
        })
      ).rejects.toThrow(/Insufficient balance/);

      // Verify NO transaction was created (atomic rollback)
      const rows = await db.select().from(transactions)
        .where(and(
          eq(transactions.userId, testUser.id),
          eq(transactions.description, overdraftMarker),
        ));
      expect(rows).toHaveLength(0);

      // Verify wallet balance is unchanged
      const [wallet] = await db.select().from(wallets)
        .where(eq(wallets.id, testWallet.id)).limit(1);
      expect(wallet.balance).toBe('100.00');
      expect(wallet.balanceUsd).toBe('100.00');
    }
  );

  it.skipIf(!dbAvailable)(
    'applyPlannedIncome creates transaction and increases balance',
    async () => {
      const incomeMarker = `income-${Date.now()}`;

      const result = await applyPlannedIncome({
        userId: testUser.id,
        walletId: testWallet.id,
        amount: '200.00',
        currency: 'USD',
        amountUsd: '200.00',
        description: incomeMarker,
        date: new Date().toISOString().split('T')[0],
        source: 'manual',
      });

      expect(result.id).toBeDefined();

      // Verify wallet balance increased
      const [wallet] = await db.select().from(wallets)
        .where(eq(wallets.id, testWallet.id)).limit(1);
      expect(wallet.balance).toBe('300.00');
      expect(wallet.balanceUsd).toBe('300.00');
    }
  );

  it.skipIf(!dbAvailable)(
    'applyPlannedPurchase with non-existent wallet rolls back cleanly',
    async () => {
      const ghostMarker = `ghost-wallet-${Date.now()}`;

      await expect(
        applyPlannedPurchase({
          userId: testUser.id,
          walletId: 999999,
          amount: '10.00',
          currency: 'USD',
          amountUsd: '10.00',
          description: ghostMarker,
          date: new Date().toISOString().split('T')[0],
          source: 'manual',
        })
      ).rejects.toThrow(/Wallet.*not found/);

      // Verify no transaction was inserted
      const rows = await db.select().from(transactions)
        .where(and(
          eq(transactions.userId, testUser.id),
          eq(transactions.description, ghostMarker),
        ));
      expect(rows).toHaveLength(0);
    }
  );
});

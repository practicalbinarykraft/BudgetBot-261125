/**
 * Transactions Routes — Input Validation Tests
 *
 * Verifies that computed fields (amountUsd) are not required in client payload,
 * and that input validation still catches invalid data.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Request, type Response, type NextFunction } from 'express';
import transactionsRouter from '../transactions.routes';
import { isAppError, toAppError } from '../../lib/errors';

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock('../../middleware/auth-utils', () => ({
  withAuth: (handler: any) => {
    return async (req: any, res: any, next: any) => {
      req.user = { id: '1' };
      try {
        await handler(req, res, next);
      } catch (err) {
        next(err);
      }
    };
  },
}));

vi.mock('../../services/transaction.service', () => ({
  transactionService: {
    createTransaction: vi.fn(),
  },
}));

vi.mock('../../services/wallet.service', () => ({
  getPrimaryWallet: vi.fn().mockResolvedValue({ id: 1 }),
  updateWalletBalance: vi.fn(),
}));

vi.mock('../../services/audit-log.service', () => ({
  logAuditEvent: vi.fn(),
  AuditAction: { CREATE: 'CREATE' },
  AuditEntityType: { TRANSACTION: 'TRANSACTION' },
}));

vi.mock('../../services/realtime-notifications.service', () => ({
  checkBudgetAlert: vi.fn(),
  notifyTransactionCreated: vi.fn(),
}));

vi.mock('../../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { transactionService } from '../../services/transaction.service';
import { insertTransactionInputSchema } from '../transactions.routes';

// ── Test app with error handler (same as production) ─────────────────

const app = express();
app.use(express.json());
app.use('/api/transactions', transactionsRouter);
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const appError = isAppError(err) ? err : toAppError(err);
  res.status(appError.statusCode).json(appError.toJSON());
});

// ── Valid payload (what mobile actually sends) ───────────────────────

const VALID_PAYLOAD = {
  type: 'expense',
  amount: '500',
  description: 'Шашлык',
  date: '2026-02-17',
  currency: 'RUB',
  source: 'manual',
  categoryId: null,
  walletId: null,
  personalTagId: null,
};

const MOCK_TRANSACTION = {
  id: 1,
  userId: 1,
  type: 'expense',
  amount: '500.00',
  amountUsd: '6.51',
  description: 'Шашлык',
  date: '2026-02-17',
  currency: 'RUB',
  source: 'manual',
  categoryId: null,
  walletId: 1,
  personalTagId: null,
  category: null,
  financialType: 'discretionary',
  createdAt: new Date().toISOString(),
};

// ── Tests ────────────────────────────────────────────────────────────

describe('Transaction input schema — computed fields excluded', () => {
  it('amountUsd is NOT in the input schema (computed by server)', () => {
    // insertTransactionInputSchema is the actual schema used in the route.
    // Computed fields must be omitted, not just marked optional —
    // so the contract is explicit: clients never send them.
    expect(insertTransactionInputSchema.shape).not.toHaveProperty('amountUsd');
    expect(insertTransactionInputSchema.shape).not.toHaveProperty('userId');
  });

  it('required client fields are still present', () => {
    expect(insertTransactionInputSchema.shape).toHaveProperty('amount');
    expect(insertTransactionInputSchema.shape).toHaveProperty('type');
    expect(insertTransactionInputSchema.shape).toHaveProperty('description');
    expect(insertTransactionInputSchema.shape).toHaveProperty('date');
  });
});

describe('POST /api/transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (transactionService.createTransaction as any).mockResolvedValue(MOCK_TRANSACTION);
  });

  it('creates transaction without amountUsd (computed field)', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send(VALID_PAYLOAD);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('amountUsd');
    expect(transactionService.createTransaction).toHaveBeenCalledTimes(1);
  });

  it('rejects payload with invalid amount', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send({ ...VALID_PAYLOAD, amount: '12,34' });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
    expect(transactionService.createTransaction).not.toHaveBeenCalled();
  });

  it('rejects payload with non-string amount', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send({ ...VALID_PAYLOAD, amount: 500 });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
    expect(transactionService.createTransaction).not.toHaveBeenCalled();
  });
});

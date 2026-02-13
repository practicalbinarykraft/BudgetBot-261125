/**
 * Contract tests: wallets, budgets, tags, recurring endpoints
 * always return { data: T[], pagination: {...} } — never a plain array.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockGetWalletsByUserId,
  mockGetBudgetsByUserId,
  mockGetAllTags,
  mockGetRecurringByUserId,
  mockGetCategoryById,
} = vi.hoisted(() => ({
  mockGetWalletsByUserId: vi.fn(),
  mockGetBudgetsByUserId: vi.fn(),
  mockGetAllTags: vi.fn(),
  mockGetRecurringByUserId: vi.fn(),
  mockGetCategoryById: vi.fn(),
}));

vi.mock('../lib/redis', () => ({
  cache: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(true),
    del: vi.fn().mockResolvedValue(true),
    delPattern: vi.fn().mockResolvedValue(true),
  },
  CACHE_TTL: { SHORT: 60, MEDIUM: 300, LONG: 1800 },
}));

vi.mock('../storage', () => ({
  storage: {
    getWalletsByUserId: mockGetWalletsByUserId,
    getWalletById: vi.fn(),
    createWallet: vi.fn(),
    updateWallet: vi.fn(),
    deleteWallet: vi.fn(),
    getBudgetsByUserId: mockGetBudgetsByUserId,
    getBudgetById: vi.fn(),
    createBudget: vi.fn(),
    updateBudget: vi.fn(),
    deleteBudget: vi.fn(),
    getCategoryById: mockGetCategoryById,
    getRecurringByUserId: mockGetRecurringByUserId,
    getRecurringById: vi.fn(),
    createRecurring: vi.fn(),
    deleteRecurring: vi.fn(),
  },
}));

vi.mock('../services/tag.service', () => ({
  getAllTags: mockGetAllTags,
  createTag: vi.fn(),
  getTag: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
  getTagStats: vi.fn(),
}));

vi.mock('@shared/schema', () => ({
  insertWalletSchema: {
    parse: (d: any) => d,
    partial: () => ({ parse: (d: any) => d }),
  },
  insertBudgetSchema: {
    parse: (d: any) => d,
    partial: () => ({ parse: (d: any) => d }),
  },
  insertPersonalTagSchema: {
    safeParse: (d: any) => ({ success: true, data: d }),
    partial: () => ({ safeParse: (d: any) => ({ success: true, data: d }) }),
  },
  insertRecurringSchema: {
    parse: (d: any) => d,
  },
}));

vi.mock('../services/currency-service', () => ({
  convertToUSD: vi.fn((a: number) => a),
  getExchangeRate: vi.fn(() => 1),
}));

vi.mock('../services/calibration.service', () => ({
  calibrateWallet: vi.fn(),
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

vi.mock('zod-validation-error', () => ({
  fromZodError: (e: any) => ({ toString: () => 'Validation error' }),
}));

vi.mock('../repositories/recurring.repository', () => ({
  recurringRepository: { updateNextDate: vi.fn() },
}));

import express from 'express';
import request from 'supertest';
import walletsRouter from '../routes/wallets.routes';
import budgetsRouter from '../routes/budgets.routes';
import tagsRouter from '../routes/personal-tags.routes';
import recurringRouter from '../routes/recurring.routes';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/wallets', walletsRouter);
  app.use('/api/budgets', budgetsRouter);
  app.use('/api/tags', tagsRouter);
  app.use('/api/recurring', recurringRouter);
  return app;
}

function expectUnifiedShape(body: any, dataLength: number) {
  expect(body).toHaveProperty('data');
  expect(body).toHaveProperty('pagination');
  expect(Array.isArray(body.data)).toBe(true);
  expect(body.data).toHaveLength(dataLength);
  expect(body.pagination).toHaveProperty('total');
  expect(body.pagination).toHaveProperty('limit');
  expect(body.pagination).toHaveProperty('offset');
  expect(typeof body.pagination.hasMore).toBe('boolean');
  // Must never be a plain array
  expect(Array.isArray(body)).toBe(false);
}

describe('GET /api/wallets — unified response', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetWalletsByUserId.mockResolvedValue({
      wallets: [{ id: 1, name: 'Cash' }],
      total: 1,
    });
  });

  it('returns { data, pagination } WITHOUT query params', async () => {
    const res = await request(createApp()).get('/api/wallets');
    expect(res.status).toBe(200);
    expectUnifiedShape(res.body, 1);
    expect(res.body.pagination).toMatchObject({ total: 1, limit: 100, offset: 0 });
  });

  it('returns { data, pagination } WITH limit=50', async () => {
    const res = await request(createApp()).get('/api/wallets?limit=50');
    expect(res.status).toBe(200);
    expectUnifiedShape(res.body, 1);
    expect(res.body.pagination.limit).toBe(50);
  });

  it('hasMore is correct', async () => {
    mockGetWalletsByUserId.mockResolvedValue({
      wallets: [{ id: 1 }],
      total: 20,
    });
    const res = await request(createApp()).get('/api/wallets?limit=5');
    expect(res.body.pagination.hasMore).toBe(true);
  });
});

describe('GET /api/budgets — unified response', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBudgetsByUserId.mockResolvedValue({
      budgets: [{ id: 1, name: 'Food' }],
      total: 1,
    });
  });

  it('returns { data, pagination } WITHOUT query params', async () => {
    const res = await request(createApp()).get('/api/budgets');
    expect(res.status).toBe(200);
    expectUnifiedShape(res.body, 1);
    expect(res.body.pagination).toMatchObject({ total: 1, limit: 100, offset: 0 });
  });

  it('returns { data, pagination } WITH limit=10&offset=5', async () => {
    const res = await request(createApp()).get('/api/budgets?limit=10&offset=5');
    expect(res.status).toBe(200);
    expectUnifiedShape(res.body, 1);
    expect(res.body.pagination).toMatchObject({ limit: 10, offset: 5 });
  });
});

describe('GET /api/tags — unified response', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllTags.mockResolvedValue({
      tags: [{ id: 1, name: 'Travel' }],
      total: 1,
    });
  });

  it('returns { data, pagination } WITHOUT query params', async () => {
    const res = await request(createApp()).get('/api/tags');
    expect(res.status).toBe(200);
    expectUnifiedShape(res.body, 1);
    expect(res.body.pagination).toMatchObject({ total: 1, limit: 100, offset: 0 });
  });

  it('returns { data, pagination } WITH limit=20', async () => {
    const res = await request(createApp()).get('/api/tags?limit=20');
    expect(res.status).toBe(200);
    expectUnifiedShape(res.body, 1);
    expect(res.body.pagination.limit).toBe(20);
  });
});

describe('GET /api/recurring — unified response', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRecurringByUserId.mockResolvedValue({
      recurring: [{ id: 1, description: 'Rent' }],
      total: 1,
    });
  });

  it('returns { data, pagination } WITHOUT query params', async () => {
    const res = await request(createApp()).get('/api/recurring');
    expect(res.status).toBe(200);
    expectUnifiedShape(res.body, 1);
    expect(res.body.pagination).toMatchObject({ total: 1, limit: 100, offset: 0 });
  });

  it('returns { data, pagination } WITH limit=25&offset=10', async () => {
    const res = await request(createApp()).get('/api/recurring?limit=25&offset=10');
    expect(res.status).toBe(200);
    expectUnifiedShape(res.body, 1);
    expect(res.body.pagination).toMatchObject({ limit: 25, offset: 10 });
  });

  it('hasMore is correct', async () => {
    mockGetRecurringByUserId.mockResolvedValue({
      recurring: [{ id: 1 }],
      total: 50,
    });
    const res = await request(createApp()).get('/api/recurring?limit=10');
    expect(res.body.pagination.hasMore).toBe(true);
  });
});

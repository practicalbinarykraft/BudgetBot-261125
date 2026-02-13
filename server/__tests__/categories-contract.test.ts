/**
 * Test: GET /api/categories always returns { data: Category[], pagination: {...} }
 * regardless of whether limit/offset params are provided.
 *
 * Also verifies that create/update/delete invalidate cache by pattern.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to define mock functions before vi.mock hoisting
const {
  mockCacheGet,
  mockCacheSet,
  mockCacheDelPattern,
  mockGetCategoriesByUserId,
  mockCreateCategory,
  mockGetCategoryById,
  mockUpdateCategory,
  mockDeleteCategory,
} = vi.hoisted(() => ({
  mockCacheGet: vi.fn().mockResolvedValue(null),
  mockCacheSet: vi.fn().mockResolvedValue(true),
  mockCacheDelPattern: vi.fn().mockResolvedValue(true),
  mockGetCategoriesByUserId: vi.fn(),
  mockCreateCategory: vi.fn(),
  mockGetCategoryById: vi.fn(),
  mockUpdateCategory: vi.fn(),
  mockDeleteCategory: vi.fn(),
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
    getCategoriesByUserId: mockGetCategoriesByUserId,
    createCategory: mockCreateCategory,
    getCategoryById: mockGetCategoryById,
    updateCategory: mockUpdateCategory,
    deleteCategory: mockDeleteCategory,
  },
}));

vi.mock('@shared/schema', () => ({
  insertCategorySchema: {
    parse: (data: any) => data,
  },
}));

vi.mock('../db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

vi.mock('@shared/schemas/assets.schema', () => ({
  assets: { categoryId: 'categoryId', userId: 'userId' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
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

import router from '../routes/categories.routes';
import express from 'express';
import request from 'supertest';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/categories', router);
  return app;
}

const sampleCategories = [
  { id: 1, name: 'Food', type: 'expense', icon: '🍔', color: '#ef4444', userId: 1, applicableTo: 'all', createdAt: '' },
  { id: 2, name: 'Salary', type: 'income', icon: '💰', color: '#10b981', userId: 1, applicableTo: 'all', createdAt: '' },
];

describe('GET /api/categories — response contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCategoriesByUserId.mockResolvedValue({
      categories: sampleCategories,
      total: 2,
    });
  });

  it('returns { data, pagination } when called WITHOUT limit/offset', async () => {
    const app = createApp();
    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toEqual(sampleCategories);
    expect(res.body.pagination).toMatchObject({
      total: 2,
      offset: 0,
    });
    expect(typeof res.body.pagination.hasMore).toBe('boolean');
  });

  it('returns { data, pagination } when called WITH limit=100', async () => {
    const app = createApp();
    const res = await request(app).get('/api/categories?limit=100');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toMatchObject({
      total: 2,
      limit: 100,
      offset: 0,
    });
  });

  it('returns { data, pagination } when called WITH limit=10&offset=5', async () => {
    const app = createApp();
    const res = await request(app).get('/api/categories?limit=10&offset=5');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toMatchObject({
      total: 2,
      limit: 10,
      offset: 5,
    });
  });

  it('never returns a plain array (regression guard)', async () => {
    const app = createApp();

    const res1 = await request(app).get('/api/categories');
    expect(Array.isArray(res1.body)).toBe(false);

    const res2 = await request(app).get('/api/categories?limit=50');
    expect(Array.isArray(res2.body)).toBe(false);
  });

  it('pagination.hasMore is correct', async () => {
    mockGetCategoriesByUserId.mockResolvedValue({
      categories: sampleCategories,
      total: 50,
    });

    const app = createApp();
    const res = await request(app).get('/api/categories?limit=10&offset=0');

    expect(res.body.pagination.hasMore).toBe(true);
    expect(res.body.pagination.total).toBe(50);
  });
});

describe('POST/PATCH/DELETE /api/categories — cache invalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST invalidates cache by pattern categories:user:{userId}:*', async () => {
    mockCreateCategory.mockResolvedValue({ id: 3, name: 'New', type: 'expense' });
    const app = createApp();

    await request(app)
      .post('/api/categories')
      .send({ name: 'New', type: 'expense', icon: '🍔', color: '#000' });

    expect(mockCacheDelPattern).toHaveBeenCalledWith('categories:user:1:*');
  });

  it('PATCH invalidates cache by pattern categories:user:{userId}:*', async () => {
    mockGetCategoryById.mockResolvedValue({ id: 1, userId: 1, name: 'Food' });
    mockUpdateCategory.mockResolvedValue({ id: 1, name: 'Updated' });
    const app = createApp();

    await request(app)
      .patch('/api/categories/1')
      .send({ name: 'Updated' });

    expect(mockCacheDelPattern).toHaveBeenCalledWith('categories:user:1:*');
  });

  it('DELETE invalidates cache by pattern categories:user:{userId}:*', async () => {
    mockGetCategoryById.mockResolvedValue({ id: 1, userId: 1, name: 'Food' });
    mockDeleteCategory.mockResolvedValue(undefined);
    const app = createApp();

    await request(app).delete('/api/categories/1');

    expect(mockCacheDelPattern).toHaveBeenCalledWith('categories:user:1:*');
  });
});

/**
 * Admin Migration Routes Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для роутов миграций
 * 
 * Запуск:
 *   npm test server/routes/admin/__tests__/migration.routes.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import migrationRouter from '../migration.routes';
import { backfillTransactionClassifications } from '../../../services/migration/transaction-classification-migration.service';

// Mock services
vi.mock('../../../services/migration/transaction-classification-migration.service', () => ({
  backfillTransactionClassifications: vi.fn(),
}));

// Mock auth middleware
const mockUser = {
  id: 1,
  email: 'user@example.com',
};

vi.mock('../../../middleware/auth-utils', () => ({
  withAuth: (handler: any) => {
    return async (req: any, res: any, next: any) => {
      req.user = mockUser;
      return handler(req, res, next);
    };
  },
}));

vi.mock('../../../lib/logger', () => ({
  logError: vi.fn(),
}));

describe('Admin Migration Routes', () => {
  let app: express.Application;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    }));
    app.use('/api/admin/migration', migrationRouter);
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  describe('POST /api/admin/migration/migrate-transaction-classifications', () => {
    it('should run migration in non-production', async () => {
      process.env.NODE_ENV = 'development';
      const mockResult = { migrated: 10, failed: 0 };
      (backfillTransactionClassifications as any).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/admin/migration/migrate-transaction-classifications')
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(backfillTransactionClassifications).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return 403 in production', async () => {
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .post('/api/admin/migration/migrate-transaction-classifications')
        .expect(403);

      expect(response.body.error).toBe('Migration endpoint disabled in production');
      expect(backfillTransactionClassifications).not.toHaveBeenCalled();
    });

    it('should return 500 on error', async () => {
      process.env.NODE_ENV = 'development';
      (backfillTransactionClassifications as any).mockRejectedValue(new Error('Migration failed'));

      const response = await request(app)
        .post('/api/admin/migration/migrate-transaction-classifications')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });
});

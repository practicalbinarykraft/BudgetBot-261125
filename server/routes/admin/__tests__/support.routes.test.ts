/**
 * Admin Support Routes Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Тесты для роутов поддержки
 * 
 * Запуск:
 *   npm test server/routes/admin/__tests__/support.routes.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import supportRouter from '../support.routes';
import {
  getSupportChatsList,
  getChatMessages,
  sendSupportMessage,
  updateChatStatus,
} from '../../../services/admin-support.service';

// Mock services
vi.mock('../../../services/admin-support.service', () => ({
  getSupportChatsList: vi.fn(),
  getChatMessages: vi.fn(),
  sendSupportMessage: vi.fn(),
  updateChatStatus: vi.fn(),
  markMessagesAsRead: vi.fn(),
}));

vi.mock('../../../services/admin-audit-log.service', () => ({
  logAdminAction: vi.fn(),
}));

// Mock admin auth middleware
const mockAdmin = {
  id: 1,
  email: 'admin@example.com',
  role: 'super_admin',
  permissions: [],
};

vi.mock('../../../middleware/admin-auth.middleware', () => ({
  requireAdmin: (req: any, res: any, next: any) => {
    req.admin = mockAdmin;
    next();
  },
  AdminRequest: {},
}));

vi.mock('../../../lib/logger', () => ({
  logError: vi.fn(),
}));

describe('Admin Support Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    }));
    app.use('/api/admin/support', supportRouter);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/support/chats', () => {
    it('should return support chats list', async () => {
      const mockChats = {
        chats: [{ id: 1, userId: 1, status: 'open' }],
        total: 1,
      };
      (getSupportChatsList as any).mockResolvedValue(mockChats);

      const response = await request(app)
        .get('/api/admin/support/chats')
        .expect(200);

      expect(response.body).toEqual(mockChats);
    });
  });

  describe('POST /api/admin/support/chats/:id/messages', () => {
    it('should send message', async () => {
      const mockMessage = { id: 1, text: 'Hello', chatId: 1 };
      (sendSupportMessage as any).mockResolvedValue(mockMessage);

      const response = await request(app)
        .post('/api/admin/support/chats/1/messages')
        .send({ message: 'Hello' })
        .expect(200);

      expect(response.body).toEqual(mockMessage);
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/admin/support/chats/1/messages')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PATCH /api/admin/support/chats/:id', () => {
    it('should update chat status', async () => {
      const mockChat = { id: 1, status: 'closed' };
      (updateChatStatus as any).mockResolvedValue(mockChat);

      const response = await request(app)
        .patch('/api/admin/support/chats/1')
        .send({ status: 'closed' })
        .expect(200);

      expect(response.body).toEqual(mockChat);
    });
  });
});

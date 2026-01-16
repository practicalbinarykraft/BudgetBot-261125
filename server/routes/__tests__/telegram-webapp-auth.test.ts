/**
 * Telegram Mini App Authentication Tests
 *
 * Tests for Telegram WebApp initData authentication
 * Junior-Friendly: ~200 lines, covers all auth scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import telegramRouter from '../telegram.routes';
import { TELEGRAM_BOT_TOKEN } from '../../telegram/config';

// Mock passport
vi.mock('passport', () => ({
  default: {
    initialize: () => (req: any, res: any, next: any) => next(),
    session: () => (req: any, res: any, next: any) => next(),
    authenticate: () => (req: any, res: any, next: any) => next(),
  },
}));

// Mock rate limiter to avoid rate limiting in tests
vi.mock('../../middleware/rate-limit', () => ({
  authRateLimiter: (req: any, res: any, next: any) => next(),
}));

/**
 * Helper: Create valid Telegram Mini App initData
 * Mimics what Telegram WebApp sends
 */
function createValidInitData(telegramUser: {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
}): string {
  const authDate = Math.floor(Date.now() / 1000);
  const userJson = JSON.stringify(telegramUser);
  
  // Create data-check-string (alphabetically sorted)
  const params = new URLSearchParams();
  params.set('auth_date', authDate.toString());
  params.set('user', userJson);
  
  // Sort params alphabetically
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  // Create secret key from bot token (используем тестовый токен)
  const testToken = process.env.TELEGRAM_BOT_TOKEN || 'test-token';
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(testToken)
    .digest();
  
  // Calculate hash
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  params.set('hash', hash);
  return params.toString();
}

describe.skipIf(process.env.CI)('POST /api/telegram/webapp-auth', () => {
  let app: express.Application;
  
  beforeEach(async () => {
    // Устанавливаем тестовый токен для валидации
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    }
    
    // Cleanup перед каждым тестом (на случай параллельного выполнения)
    try {
      await db.delete(users).where(eq(users.email, 'test@example.com'));
      await db.delete(users).where(eq(users.telegramId, '123456789'));
      await db.delete(users).where(eq(users.telegramId, '987654321'));
      await db.delete(users).where(eq(users.telegramId, '999999999'));
      // Небольшая задержка для завершения транзакций
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch {}
    
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    }));
    
    // Mock req.login - важно: callback должен вызываться синхронно для supertest
    app.use((req: any, res: any, next: any) => {
      req.login = (user: any, callback: any) => {
        req.user = user;
        // Вызываем callback синхронно, чтобы supertest мог дождаться ответа
        if (callback) {
          callback(null);
        }
      };
      next();
    });
    
    app.use('/api/telegram', telegramRouter);
  });
  
  afterEach(async () => {
    // Cleanup тестовых пользователей - но только тех, которые были созданы в beforeEach
    // Не удаляем пользователей, созданных в отдельных тестах, так как они удаляются в самих тестах
    // Удаляем только пользователей с известными тестовыми данными, которые не используются в тестах
    try {
      // Не удаляем здесь, так как это может удалить пользователей, созданных в тестах
      // Каждый тест сам удаляет своих пользователей
    } catch {}
  });
  
  describe('Scenario 1: User found with email+password (auto-login)', () => {
    it('should auto-login user when telegram_id is linked and has email+password', async () => {
      // Arrange: Create user with telegram_id and email+password
      // Используем уникальный email и telegramId для избежания конфликтов при параллельном выполнении
      const uniqueEmail = `test-webapp-auth-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
      const uniqueTelegramId = `${Date.now()}${Math.floor(Math.random() * 1000)}`; // Уникальный telegramId
      const telegramId = uniqueTelegramId;
      
      // Удаляем сначала, если существует
      try {
        await db.delete(users).where(eq(users.email, uniqueEmail));
        await db.delete(users).where(eq(users.telegramId, telegramId));
        // Небольшая задержка для завершения транзакций
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch {}
      
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      const [testUser] = await db.insert(users).values({
        email: uniqueEmail,
        password: hashedPassword,
        name: 'Test User',
        telegramId,
        telegramUsername: 'testuser',
        isBlocked: false,
      }).returning();
      
      // Verify testUser was returned correctly
      if (!testUser) {
        throw new Error('testUser was not returned from db.insert');
      }
      
      // Verify testUser has correct telegramId
      if (!testUser.telegramId || testUser.telegramId !== telegramId) {
        throw new Error(`testUser telegramId mismatch. Expected: ${telegramId}, Got: ${testUser.telegramId}`);
      }
      
      // Wait a bit for transaction to be visible to other connections
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Create initData with the same telegramId (as number, will be converted to string in API)
      const initData = createValidInitData({
        id: parseInt(uniqueTelegramId, 10), // Convert uniqueTelegramId to number
        first_name: 'Test User',
        username: 'testuser',
      });
      
      // Act
      const response = await request(app)
        .post('/api/telegram/webapp-auth')
        .send({ initData });
      
      // Debug if needed
      if (response.status !== 200 || !response.body.autoLogin) {
        console.log('Response status:', response.status);
        console.log('Response body:', JSON.stringify(response.body, null, 2));
        console.log('Test user:', JSON.stringify(testUser, null, 2));
        console.log('Expected telegramId:', telegramId);
        const userFromInitData = JSON.parse(new URLSearchParams(initData).get('user') || '{}');
        console.log('InitData user:', JSON.stringify(userFromInitData, null, 2));
        
        // Try to find user in DB
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.telegramId, telegramId))
          .limit(1);
        console.log('User in DB:', JSON.stringify(dbUser, null, 2));
      }
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.autoLogin).toBe(true);
      expect(response.body.user.id).toBe(testUser.id);
      expect(response.body.user.email).toBe(uniqueEmail);
      
      // Cleanup
      try {
        await db.delete(users).where(eq(users.id, testUser.id));
        await db.delete(users).where(eq(users.email, uniqueEmail));
        await db.delete(users).where(eq(users.telegramId, uniqueTelegramId));
      } catch {}
    });
  });
  
  describe('Scenario 2: User found but missing email (requiresEmail)', () => {
    it('should return requiresEmail when user has telegram_id but no email', async () => {
      // Arrange: Create user with telegram_id but NO email
      const telegramId = '987654321';
      // Удаляем сначала, если существует
      try {
        await db.delete(users).where(eq(users.telegramId, telegramId));
      } catch {}
      
      const [testUser] = await db.insert(users).values({
        email: null,
        password: null,
        name: 'Telegram User',
        telegramId,
        telegramUsername: 'tguser',
        isBlocked: false,
      }).returning();
      
      const initData = createValidInitData({
        id: 987654321,
        first_name: 'Telegram User',
        username: 'tguser',
      });
      
      // Act
      const response = await request(app)
        .post('/api/telegram/webapp-auth')
        .send({ initData })
        .expect(200);
      
      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.requiresEmail).toBe(true);
      expect(response.body.message).toContain('email');
      
      // Cleanup
      await db.delete(users).where(eq(users.id, testUser.id));
    });
  });
  
  describe('Scenario 3: User not found (requiresRegistration)', () => {
    it('should return requiresRegistration when telegram_id is not in database', async () => {
      // Arrange: Use telegram_id that doesn't exist
      const initData = createValidInitData({
        id: 999999999,
        first_name: 'New User',
        username: 'newuser',
      });
      
      // Act
      const response = await request(app)
        .post('/api/telegram/webapp-auth')
        .send({ initData })
        .expect(200);
      
      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.requiresRegistration).toBe(true);
      expect(response.body.telegramId).toBe('999999999');
      expect(response.body.telegramData).toBeDefined();
      expect(response.body.telegramData.firstName).toBe('New User');
    });
  });
  
  describe('Security: Invalid initData', () => {
    it('should reject invalid hash', async () => {
      // Используем текущую дату, но невалидный hash
      const invalidInitData = 'user=%7B%22id%22%3A123%7D&hash=invalid_hash&auth_date=' + Math.floor(Date.now() / 1000);
      
      const response = await request(app)
        .post('/api/telegram/webapp-auth')
        .send({ initData: invalidInitData });
      
      // API возвращает 401 для невалидной подписи
      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Invalid|Missing|error/i);
    });
    
    it('should reject missing initData', async () => {
      const response = await request(app)
        .post('/api/telegram/webapp-auth')
        .send({})
        .expect(400);
      
      expect(response.body.message).toContain('required');
    });
  });
});


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
  
  // Create secret key from bot token
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(TELEGRAM_BOT_TOKEN || 'test-token')
    .digest();
  
  // Calculate hash
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  params.set('hash', hash);
  return params.toString();
}

describe('POST /api/telegram/webapp-auth', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    }));
    
    // Mock req.login
    app.use((req: any, res: any, next: any) => {
      req.login = (user: any, callback: any) => {
        req.user = user;
        callback(null);
      };
      next();
    });
    
    app.use('/api/telegram', telegramRouter);
  });
  
  describe('Scenario 1: User found with email+password (auto-login)', () => {
    it('should auto-login user when telegram_id is linked and has email+password', async () => {
      // Arrange: Create user with telegram_id and email+password
      const telegramId = '123456789';
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      const [testUser] = await db.insert(users).values({
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        telegramId,
        telegramUsername: 'testuser',
      }).returning();
      
      const initData = createValidInitData({
        id: 123456789,
        first_name: 'Test User',
        username: 'testuser',
      });
      
      // Act
      const response = await request(app)
        .post('/api/telegram/webapp-auth')
        .send({ initData })
        .expect(200);
      
      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.autoLogin).toBe(true);
      expect(response.body.user.id).toBe(testUser.id);
      expect(response.body.user.email).toBe('test@example.com');
      
      // Cleanup
      await db.delete(users).where(eq(users.id, testUser.id));
    });
  });
  
  describe('Scenario 2: User found but missing email (requiresEmail)', () => {
    it('should return requiresEmail when user has telegram_id but no email', async () => {
      // Arrange: Create user with telegram_id but NO email
      const telegramId = '987654321';
      const [testUser] = await db.insert(users).values({
        email: null,
        password: null,
        name: 'Telegram User',
        telegramId,
        telegramUsername: 'tguser',
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
      const invalidInitData = 'user=%7B%22id%22%3A123%7D&hash=invalid_hash&auth_date=1234567890';
      
      const response = await request(app)
        .post('/api/telegram/webapp-auth')
        .send({ initData: invalidInitData })
        .expect(401);
      
      expect(response.body.message).toContain('Invalid');
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


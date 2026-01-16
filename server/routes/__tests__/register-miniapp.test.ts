/**
 * Register Mini App Tests
 *
 * Tests for Telegram Mini App registration endpoint
 * Junior-Friendly: ~150 lines, covers registration flow
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { db } from '../../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import authMiniappRouter from '../auth-miniapp.routes';

// Mock passport
vi.mock('passport', () => ({
  default: {
    initialize: () => (req: any, res: any, next: any) => next(),
    session: () => (req: any, res: any, next: any) => next(),
  },
}));

// Mock rate limiter to avoid rate limiting in tests
vi.mock('../../middleware/rate-limit', () => ({
  authRateLimiter: (req: any, res: any, next: any) => next(),
}));

describe.skipIf(process.env.CI)('POST /api/auth/register-miniapp', () => {
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
    
    // Подключаем роутер auth-miniapp
    app.use('/api/auth', authMiniappRouter);
  });
  
  afterEach(async () => {
    // Cleanup: удаляем тестовых пользователей
    try {
      await db.delete(users).where(eq(users.email, 'newuser@example.com'));
      await db.delete(users).where(eq(users.email, 'duplicate@example.com'));
      await db.delete(users).where(eq(users.email, 'existing@example.com'));
      await db.delete(users).where(eq(users.email, 'linked@example.com'));
      await db.delete(users).where(eq(users.email, 'test2@example.com'));
      await db.delete(users).where(eq(users.telegramId, '111222333'));
      await db.delete(users).where(eq(users.telegramId, '999888777'));
    } catch (error) {
      // Игнорируем ошибки cleanup
    }
  });
  
  describe('Successful registration', () => {
    it('should create user with email and password', async () => {
      const registrationData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User',
        telegramId: '111222333',
        telegramData: {
          firstName: 'New',
          username: 'newuser',
          // photoUrl is optional, omit it instead of null
        },
      };
      
      // Act
      const response = await request(app)
        .post('/api/auth/register-miniapp')
        .send(registrationData);
      
      if (response.status !== 201) {
        console.log('Response status:', response.status);
        console.log('Response body:', JSON.stringify(response.body, null, 2));
      }
      
      expect(response.status).toBe(201);
      
      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('newuser@example.com');
      expect(response.body.user.name).toBe('New User');
      expect(response.body.shouldOfferTelegramLink).toBe(true);
      expect(response.body.telegramId).toBe('111222333');
      
      // Verify user in database
      const [createdUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'newuser@example.com'))
        .limit(1);
      
      expect(createdUser).toBeDefined();
      expect(createdUser.telegramId).toBeNull(); // Not linked yet
      
      // Cleanup
      await db.delete(users).where(eq(users.id, createdUser.id));
    });
    
    it('should NOT link telegram_id immediately', async () => {
      const registrationData = {
        email: 'test2@example.com',
        password: 'SecurePass123!',
        name: 'Test User 2',
        telegramId: '444555666',
        telegramData: {
          firstName: 'Test',
          username: 'testuser2',
        },
      };
      
      const response = await request(app)
        .post('/api/auth/register-miniapp')
        .send(registrationData)
        .expect(201);
      
      // Verify telegram_id is NOT linked
      const [createdUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'test2@example.com'))
        .limit(1);
      
      expect(createdUser.telegramId).toBeNull();
      
      // Cleanup
      await db.delete(users).where(eq(users.id, createdUser.id));
    });
  });
  
  describe('Validation errors', () => {
    it('should reject duplicate email', async () => {
      // Arrange: Create existing user (удаляем сначала, если существует)
      try {
        await db.delete(users).where(eq(users.email, 'existing@example.com'));
      } catch {}
      
      const hashedPassword = await bcrypt.hash('password123', 10);
      const [existingUser] = await db.insert(users).values({
        email: 'existing@example.com',
        password: hashedPassword,
        name: 'Existing User',
        isBlocked: false,
      }).returning();
      
      const registrationData = {
        email: 'existing@example.com',
        password: 'NewPass123!',
        name: 'New User',
        telegramId: '777888999',
      };
      
      // Act
      const response = await request(app)
        .post('/api/auth/register-miniapp')
        .send(registrationData);
      
      // Assert - API возвращает 400 с "Email already registered" (не Validation failed)
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already registered');
      
      // Cleanup
      try {
        await db.delete(users).where(eq(users.id, existingUser.id));
      } catch {}
    });
    
    it('should reject weak password', async () => {
      const registrationData = {
        email: 'weak@example.com',
        password: '123', // Too short
        name: 'Weak User',
        telegramId: '000111222',
      };
      
      const response = await request(app)
        .post('/api/auth/register-miniapp')
        .send(registrationData)
        .expect(400);
      
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
      const passwordError = response.body.details.find((d: any) => d.path.includes('password'));
      expect(passwordError).toBeDefined();
    });
    
    it('should reject invalid email format', async () => {
      const registrationData = {
        email: 'not-an-email',
        password: 'SecurePass123!',
        name: 'Invalid User',
        telegramId: '333444555',
      };
      
      const response = await request(app)
        .post('/api/auth/register-miniapp')
        .send(registrationData);
      
      // API возвращает 400 с "Validation failed" для невалидного email
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
      const emailError = response.body.details.find((d: any) => d.path.includes('email'));
      expect(emailError).toBeDefined();
      
      // Cleanup
      try {
        await db.delete(users).where(eq(users.email, 'existing@example.com'));
      } catch {}
    });
  });
  
  describe('Telegram ID validation', () => {
    it('should reject if telegram_id is already linked', async () => {
      // Arrange: Create user with telegram_id (удаляем сначала, если существует)
      try {
        await db.delete(users).where(eq(users.telegramId, '999888777'));
        await db.delete(users).where(eq(users.email, 'linked@example.com'));
      } catch {}
      
      const hashedPassword = await bcrypt.hash('password123', 10);
      const [existingUser] = await db.insert(users).values({
        email: 'linked@example.com',
        password: hashedPassword,
        name: 'Linked User',
        telegramId: '999888777',
        isBlocked: false,
      }).returning();
      
      const registrationData = {
        email: 'newuser_for_linked_test@example.com', // Use unique email to avoid email conflict
        password: 'SecurePass123!',
        name: 'New User',
        telegramId: '999888777', // Same telegram_id
      };
      
      // Act
      const response = await request(app)
        .post('/api/auth/register-miniapp')
        .send(registrationData);
      
      // Assert
      expect(response.status).toBe(400);
      // The API checks email first, then telegramId
      // But if email is unique, it should check telegramId and return the telegram error
      expect(response.body.error).toMatch(/already linked|Telegram account/i);
      
      // Cleanup
      try {
        await db.delete(users).where(eq(users.id, existingUser.id));
        await db.delete(users).where(eq(users.email, 'new@example.com'));
      } catch {}
    });
  });
});


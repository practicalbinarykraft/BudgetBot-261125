/**
 * Register Mini App Tests
 *
 * Tests for Telegram Mini App registration endpoint
 * Junior-Friendly: ~150 lines, covers registration flow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { db } from '../../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { createApp } from '../../index'; // We'll need to import app setup

// Mock passport
vi.mock('passport', () => ({
  default: {
    initialize: () => (req: any, res: any, next: any) => next(),
    session: () => (req: any, res: any, next: any) => next(),
  },
}));

describe('POST /api/auth/register-miniapp', () => {
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
    
    // TODO: Add register-miniapp route when created
    // app.use('/api/auth', authRouter);
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
          photoUrl: null,
        },
      };
      
      // Act
      const response = await request(app)
        .post('/api/auth/register-miniapp')
        .send(registrationData)
        .expect(201);
      
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
      // Arrange: Create existing user
      const hashedPassword = await bcrypt.hash('password123', 10);
      const [existingUser] = await db.insert(users).values({
        email: 'existing@example.com',
        password: hashedPassword,
        name: 'Existing User',
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
        .send(registrationData)
        .expect(400);
      
      // Assert
      expect(response.body.error).toContain('email');
      
      // Cleanup
      await db.delete(users).where(eq(users.id, existingUser.id));
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
      
      expect(response.body.error).toContain('password');
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
        .send(registrationData)
        .expect(400);
      
      expect(response.body.error).toContain('email');
    });
  });
  
  describe('Telegram ID validation', () => {
    it('should reject if telegram_id is already linked', async () => {
      // Arrange: Create user with telegram_id
      const hashedPassword = await bcrypt.hash('password123', 10);
      const [existingUser] = await db.insert(users).values({
        email: 'linked@example.com',
        password: hashedPassword,
        name: 'Linked User',
        telegramId: '999888777',
      }).returning();
      
      const registrationData = {
        email: 'new@example.com',
        password: 'SecurePass123!',
        name: 'New User',
        telegramId: '999888777', // Same telegram_id
      };
      
      // Act
      const response = await request(app)
        .post('/api/auth/register-miniapp')
        .send(registrationData)
        .expect(400);
      
      // Assert
      expect(response.body.error).toContain('already linked');
      
      // Cleanup
      await db.delete(users).where(eq(users.id, existingUser.id));
    });
  });
});


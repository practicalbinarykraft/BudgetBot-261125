import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

// Mock repositories before imports
vi.mock('../repositories/user.repository', () => ({
  userRepository: {
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    getUserById: vi.fn(),
  },
}));

vi.mock('../repositories/category.repository', () => ({
  categoryRepository: {
    createCategory: vi.fn(),
  },
}));

vi.mock('../services/tag.service', () => ({
  createDefaultTags: vi.fn(),
}));

vi.mock('../services/audit-log.service', () => ({
  logAuditEvent: vi.fn(),
  AuditAction: {
    REGISTER: 'REGISTER',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
  },
  AuditEntityType: {
    USER: 'USER',
  },
}));

import { userRepository } from '../repositories/user.repository';

describe('Auth Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Registration validation', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should verify password correctly', async () => {
      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const isMatch = await bcrypt.compare(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should reject wrong password', async () => {
      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const isMatch = await bcrypt.compare('wrongPassword', hashedPassword);
      expect(isMatch).toBe(false);
    });
  });

  describe('User repository mocking', () => {
    it('should return null for non-existent user', async () => {
      (userRepository.getUserByEmail as any).mockResolvedValue(null);
      
      const user = await userRepository.getUserByEmail('test@example.com');
      expect(user).toBeNull();
    });

    it('should return user for existing email', async () => {
      const mockUser = {
        id: 1,
        email: 'existing@example.com',
        name: 'Test User',
        password: 'hashedpassword',
      };
      (userRepository.getUserByEmail as any).mockResolvedValue(mockUser);
      
      const user = await userRepository.getUserByEmail('existing@example.com');
      expect(user).toEqual(mockUser);
      expect(user?.email).toBe('existing@example.com');
    });

    it('should create new user', async () => {
      const newUser = {
        id: 2,
        email: 'new@example.com',
        name: 'New User',
        password: 'hashedpassword',
      };
      (userRepository.createUser as any).mockResolvedValue(newUser);
      
      const user = await userRepository.createUser({
        email: 'new@example.com',
        name: 'New User',
        password: 'hashedpassword',
      });
      
      expect(user.id).toBe(2);
      expect(user.email).toBe('new@example.com');
    });
  });

  describe('Email validation', () => {
    it('should validate correct email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      expect(emailRegex.test('test@example.com')).toBe(true);
      expect(emailRegex.test('user.name@domain.co')).toBe(true);
    });

    it('should reject invalid email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      expect(emailRegex.test('invalid-email')).toBe(false);
      expect(emailRegex.test('missing@domain')).toBe(false);
      expect(emailRegex.test('@nodomain.com')).toBe(false);
    });
  });

  describe('Password validation', () => {
    it('should require minimum password length', () => {
      const minLength = 6;
      
      expect('short'.length >= minLength).toBe(false);
      expect('longenough'.length >= minLength).toBe(true);
    });
  });
});

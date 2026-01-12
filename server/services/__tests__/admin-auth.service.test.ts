/**
 * Admin Auth Service Tests
 * 
 * Junior-Friendly Guide:
 * =====================
 * Эти тесты проверяют работу сервиса авторизации админов.
 * Тесты проверяют хеширование паролей, поиск админов, создание админов.
 * 
 * Запуск:
 *   npm test server/services/__tests__/admin-auth.service.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import {
  hashPassword,
  verifyPassword,
  findAdminByEmail,
  findAdminById,
  createAdmin,
  updateLastLogin,
} from '../admin-auth.service';
import { db } from '../../db';
import { adminUsers } from '@shared/schema';

// Mock database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../lib/logger', () => ({
  logError: vi.fn(),
}));

describe('Admin Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
      expect(hash.startsWith('$2')).toBe(true); // bcrypt hash starts with $2
    });

    it('should produce different hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Bcrypt includes salt, so hashes should be different
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject wrong password', async () => {
      const password = 'testPassword123';
      const hash = await bcrypt.hash(password, 10);

      const isValid = await verifyPassword('wrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('findAdminByEmail', () => {
    it('should return admin when found', async () => {
      const mockAdmin = {
        id: 1,
        email: 'admin@example.com',
        passwordHash: 'hashed',
        role: 'super_admin',
        permissions: [],
        createdAt: new Date(),
        lastLoginAt: null,
        ipWhitelist: null,
        isActive: true,
      };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockAdmin]),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const admin = await findAdminByEmail('admin@example.com');

      expect(admin).toEqual(mockAdmin);
      expect(db.select).toHaveBeenCalled();
    });

    it('should return null when admin not found', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const admin = await findAdminByEmail('notfound@example.com');

      expect(admin).toBeNull();
    });
  });

  describe('findAdminById', () => {
    it('should return admin when found', async () => {
      const mockAdmin = {
        id: 1,
        email: 'admin@example.com',
        passwordHash: 'hashed',
        role: 'super_admin',
        permissions: [],
        createdAt: new Date(),
        lastLoginAt: null,
        ipWhitelist: null,
        isActive: true,
      };

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockAdmin]),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const admin = await findAdminById(1);

      expect(admin).toEqual(mockAdmin);
    });

    it('should return null when admin not found', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      (db.select as any).mockReturnValue(mockSelect);

      const admin = await findAdminById(999);

      expect(admin).toBeNull();
    });
  });

  describe('createAdmin', () => {
    it('should create admin with hashed password', async () => {
      const adminData = {
        email: 'newadmin@example.com',
        password: 'securePassword123',
        role: 'support',
        permissions: ['users.read'],
      };

      const mockAdmin = {
        id: 1,
        email: adminData.email,
        passwordHash: 'hashedPassword',
        role: adminData.role,
        permissions: adminData.permissions,
        createdAt: new Date(),
        lastLoginAt: null,
        ipWhitelist: null,
        isActive: true,
      };

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockAdmin]),
      };

      (db.insert as any).mockReturnValue(mockInsert);

      const admin = await createAdmin(adminData);

      expect(admin).toEqual(mockAdmin);
      expect(db.insert).toHaveBeenCalled();
      expect(mockInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          email: adminData.email,
          passwordHash: expect.any(String), // Реальный хеш будет сгенерирован
          role: adminData.role,
          permissions: adminData.permissions,
          isActive: true,
        })
      );
    });

    it('should use default role if not provided', async () => {
      const adminData = {
        email: 'admin@example.com',
        password: 'password123',
      };

      const mockAdmin = {
        id: 1,
        email: adminData.email,
        passwordHash: 'hashed',
        role: 'support', // default
        permissions: [],
        createdAt: new Date(),
        lastLoginAt: null,
        ipWhitelist: null,
        isActive: true,
      };

      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockAdmin]),
      };

      (db.insert as any).mockReturnValue(mockInsert);

      const admin = await createAdmin(adminData);

      expect(admin.role).toBe('support');
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };

      (db.update as any).mockReturnValue(mockUpdate);

      await updateLastLogin(1);

      expect(db.update).toHaveBeenCalledWith(adminUsers);
      expect(mockUpdate.set).toHaveBeenCalledWith(
        expect.objectContaining({
          lastLoginAt: expect.any(Date),
        })
      );
    });
  });
});


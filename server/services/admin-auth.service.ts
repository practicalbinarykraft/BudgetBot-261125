/**
 * Admin Authentication Service
 * 
 * Junior-Friendly Guide:
 * =====================
 * Этот сервис отвечает за авторизацию админов в админ-панели.
 * Он отделен от обычной авторизации пользователей для безопасности.
 * 
 * Основные функции:
 * - hashPassword: хеширует пароль перед сохранением в БД
 * - verifyPassword: проверяет пароль при входе
 * - findAdminByEmail: ищет админа по email
 * - createAdmin: создает нового админа
 * 
 * Использование:
 *   import { findAdminByEmail, verifyPassword } from './admin-auth.service';
 *   const admin = await findAdminByEmail('admin@example.com');
 *   const isValid = await verifyPassword('password123', admin.passwordHash);
 */

import bcrypt from 'bcryptjs';
import { db } from '../db';
import { adminUsers, AdminUser, InsertAdminUser } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { logError } from '../lib/logger';

/**
 * Хеширует пароль перед сохранением в БД
 * 
 * Для джуна: bcrypt - это алгоритм одностороннего хеширования.
 * Мы не можем восстановить пароль из хеша, только проверить совпадение.
 * 
 * @param password - Пароль в открытом виде
 * @returns Хеш пароля (строка ~60 символов)
 */
export async function hashPassword(password: string): Promise<string> {
  // 10 раундов - хороший баланс между безопасностью и производительностью
  return bcrypt.hash(password, 10);
}

/**
 * Проверяет пароль при входе
 * 
 * Для джуна: сравнивает введенный пароль с хешем из БД.
 * bcrypt.compare сам знает как сравнивать (учитывает salt).
 * 
 * @param password - Пароль в открытом виде (от пользователя)
 * @param hash - Хеш из БД
 * @returns true если пароль верный, false если нет
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Находит админа по email
 * 
 * @param email - Email админа
 * @returns Админ или null если не найден
 */
export async function findAdminByEmail(email: string): Promise<AdminUser | null> {
  try {
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);
    
    return admin || null;
  } catch (error) {
    logError('Failed to find admin by email', error as Error, { email });
    return null;
  }
}

/**
 * Находит админа по ID
 * 
 * @param id - ID админа
 * @returns Админ или null если не найден
 */
export async function findAdminById(id: number): Promise<AdminUser | null> {
  try {
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, id))
      .limit(1);
    
    return admin || null;
  } catch (error) {
    logError('Failed to find admin by id', error as Error, { id });
    return null;
  }
}

/**
 * Создает нового админа
 * 
 * Для джуна: пароль автоматически хешируется перед сохранением.
 * Никогда не сохраняем пароли в открытом виде!
 * 
 * @param data - Данные админа (email, password, role, permissions)
 * @returns Созданный админ
 */
export async function createAdmin(data: {
  email: string;
  password: string;
  role?: string;
  permissions?: string[];
  ipWhitelist?: string[];
}): Promise<AdminUser> {
  // Хешируем пароль перед сохранением
  const passwordHash = await hashPassword(data.password);
  
  const [admin] = await db
    .insert(adminUsers)
    .values({
      email: data.email,
      passwordHash,
      role: data.role || 'support',
      permissions: data.permissions || [],
      ipWhitelist: data.ipWhitelist,
      isActive: true,
    })
    .returning();
  
  return admin;
}

/**
 * Обновляет время последнего входа админа
 * 
 * @param adminId - ID админа
 */
export async function updateLastLogin(adminId: number): Promise<void> {
  try {
    await db
      .update(adminUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(adminUsers.id, adminId));
  } catch (error) {
    logError('Failed to update last login', error as Error, { adminId });
  }
}


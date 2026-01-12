/**
 * Admin Authentication Middleware
 * 
 * Junior-Friendly Guide:
 * =====================
 * Этот middleware проверяет, что запрос приходит от авторизованного админа.
 * Он отделен от обычной авторизации пользователей для безопасности.
 * 
 * Основные функции:
 * - requireAdmin: проверяет что пользователь - админ
 * - requirePermission: проверяет что у админа есть конкретное разрешение
 * 
 * Использование:
 *   import { requireAdmin, requirePermission } from './admin-auth.middleware';
 *   router.get('/users', requireAdmin, handler);
 *   router.post('/users/:id/ban', requireAdmin, requirePermission('users.write'), handler);
 */

import { Request, Response, NextFunction } from 'express';
import { findAdminById } from '../services/admin-auth.service';
import { AdminUser } from '@shared/schema';
import { logError } from '../lib/logger';

/**
 * Расширенный тип Request с полем admin
 * 
 * Для джуна: TypeScript позволяет добавлять поля к типам.
 * Это безопаснее чем использовать (req as any).admin
 */
export interface AdminRequest extends Request {
  admin?: {
    id: number;
    email: string;
    role: string;
    permissions: string[];
  };
}

/**
 * Middleware для проверки авторизации админа
 * 
 * Для джуна: Проверяет что в сессии есть adminId.
 * Если есть - загружает данные админа из БД и добавляет в req.admin.
 * Если нет - возвращает 401 Unauthorized.
 * 
 * @param req - Express Request (с расширенным типом AdminRequest)
 * @param res - Express Response
 * @param next - Express NextFunction
 */
export async function requireAdmin(
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Проверяем что сессия существует
    if (!req.session) {
      res.status(401).json({ error: 'Unauthorized: No session' });
      return;
    }

    // Получаем adminId из сессии
    const adminId = req.session.adminId as number | undefined;

    if (!adminId) {
      res.status(401).json({ error: 'Unauthorized: Not an admin session' });
      return;
    }

    // Загружаем админа из БД
    const admin = await findAdminById(adminId);

    if (!admin) {
      // Админ удален из БД, но сессия еще жива
      delete req.session.adminId;
      res.status(401).json({ error: 'Unauthorized: Admin not found' });
      return;
    }

    // Проверяем что админ активен
    if (!admin.isActive) {
      res.status(403).json({ error: 'Forbidden: Admin account is inactive' });
      return;
    }

    // Добавляем данные админа в req.admin
    req.admin = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions || [],
    };

    // Все ок, продолжаем
    next();
  } catch (error) {
    logError('Admin auth middleware error', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware для проверки конкретного разрешения
 * 
 * Для джуна: Создает middleware который проверяет наличие разрешения.
 * Используется после requireAdmin.
 * 
 * Пример:
 *   router.post('/users/:id/ban', 
 *     requireAdmin, 
 *     requirePermission('users.write'), 
 *     handler
 *   );
 * 
 * @param permission - Название разрешения (например, 'users.write')
 * @returns Middleware функция
 */
export function requirePermission(permission: string) {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    // Сначала проверяем что админ авторизован
    if (!req.admin) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Супер-админ имеет все разрешения
    if (req.admin.role === 'super_admin') {
      next();
      return;
    }

    // Проверяем наличие разрешения
    if (!req.admin.permissions.includes(permission)) {
      res.status(403).json({ 
        error: 'Forbidden', 
        message: `Missing permission: ${permission}` 
      });
      return;
    }

    // Все ок, продолжаем
    next();
  };
}

/**
 * Middleware для проверки роли админа
 * 
 * Для джуна: Проверяет что админ имеет одну из указанных ролей.
 * 
 * @param roles - Массив разрешенных ролей
 * @returns Middleware функция
 */
export function requireRole(...roles: string[]) {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.admin.role)) {
      res.status(403).json({ 
        error: 'Forbidden', 
        message: `Required role: ${roles.join(' or ')}` 
      });
      return;
    }

    next();
  };
}


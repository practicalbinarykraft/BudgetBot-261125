/**
 * Admin Authentication Routes
 * 
 * Junior-Friendly Guide:
 * =====================
 * Эти роуты обрабатывают вход/выход админов в админ-панель.
 * Отделены от обычной авторизации пользователей для безопасности.
 * 
 * Endpoints:
 * - POST /api/admin/auth/login - вход админа
 * - POST /api/admin/auth/logout - выход админа
 * - GET /api/admin/auth/me - информация о текущем админе
 * 
 * Использование:
 *   import adminAuthRouter from './admin-auth.routes';
 *   app.use('/api/admin/auth', adminAuthRouter);
 */

import { Router, Request, Response } from 'express';
import { requireAdmin, AdminRequest } from '../middleware/admin-auth.middleware';
import { findAdminByEmail, verifyPassword, updateLastLogin } from '../services/admin-auth.service';
import { logAdminAction } from '../services/admin-audit-log.service';
import { authRateLimiter } from '../middleware/rate-limit';
import { getErrorMessage } from '../lib/errors';
import { z } from 'zod';

const router = Router();

/**
 * Схема валидации для login
 */
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/admin/auth/login
 * 
 * Вход админа в систему
 * 
 * Для джуна: Проверяет email и пароль, создает сессию админа.
 * Пароль проверяется через bcrypt.compare (безопасно).
 * 
 * Request Body:
 *   { email: string, password: string }
 * 
 * Response:
 *   { id: number, email: string, role: string, permissions: string[] }
 */
router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    // Логируем тело запроса для отладки
    console.log('[ADMIN AUTH] Login request body:', JSON.stringify(req.body));
    console.log('[ADMIN AUTH] Content-Type:', req.get('Content-Type'));
    
    // Валидация входных данных
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.log('[ADMIN AUTH] Validation failed:', validationResult.error.errors);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.error.errors 
      });
    }

    const { email, password } = validationResult.data;

    // Ищем админа по email
    const admin = await findAdminByEmail(email);
    
    if (!admin) {
      // Не говорим что админ не найден (безопасность)
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Проверяем что админ активен
    if (!admin.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Проверяем пароль
    const isValid = await verifyPassword(password, admin.passwordHash);
    
    if (!isValid) {
      // Логируем попытку входа с неверным паролем
      await logAdminAction({
        adminId: admin.id,
        action: 'login.failed',
        entityType: 'admin',
        entityId: admin.id.toString(),
        changes: { reason: 'invalid_password' },
        req,
      });

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Проверяем IP whitelist если настроен
    if (admin.ipWhitelist && admin.ipWhitelist.length > 0) {
      const clientIp = req.ip || req.socket.remoteAddress || '';
      const isAllowed = admin.ipWhitelist.some(allowedIp => {
        // Простая проверка (можно улучшить для CIDR)
        return clientIp === allowedIp || clientIp.startsWith(allowedIp);
      });

      if (!isAllowed) {
        await logAdminAction({
          adminId: admin.id,
          action: 'login.failed',
          entityType: 'admin',
          entityId: admin.id.toString(),
          changes: { reason: 'ip_not_whitelisted', ip: clientIp },
          req,
        });

        return res.status(403).json({ error: 'IP address not allowed' });
      }
    }

    // Создаем сессию админа
    // Используем отдельное поле в сессии для админов
    if (!req.session) {
      return res.status(500).json({ error: 'Session not available' });
    }

    req.session.adminId = admin.id;

    // Обновляем время последнего входа
    await updateLastLogin(admin.id);

    // Логируем успешный вход
    await logAdminAction({
      adminId: admin.id,
      action: 'login',
      entityType: 'admin',
      entityId: admin.id.toString(),
      req,
    });

    // Возвращаем данные админа (без пароля!)
    res.json({
      id: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions || [],
    });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * POST /api/admin/auth/logout
 * 
 * Выход админа из системы
 * 
 * Для джуна: Удаляет adminId из сессии, логирует выход.
 * 
 * Response:
 *   { success: true }
 */
router.post('/logout', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const adminId = req.admin?.id;

    // Удаляем сессию админа
    if (req.session) {
      delete req.session.adminId;
    }

    // Логируем выход
    if (adminId) {
      await logAdminAction({
        adminId,
        action: 'logout',
        entityType: 'admin',
        entityId: adminId.toString(),
        req,
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * GET /api/admin/auth/me
 * 
 * Получает информацию о текущем админе
 * 
 * Для джуна: Использует requireAdmin middleware для проверки авторизации.
 * Возвращает данные админа из req.admin (установлено middleware).
 * 
 * Response:
 *   { id: number, email: string, role: string, permissions: string[] }
 */
router.get('/me', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json({
      id: req.admin.id,
      email: req.admin.email,
      role: req.admin.role,
      permissions: req.admin.permissions,
    });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;


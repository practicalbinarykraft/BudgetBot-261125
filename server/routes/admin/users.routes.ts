/**
 * Admin Users Routes
 * 
 * Junior-Friendly Guide:
 * =====================
 * Эти роуты позволяют админам управлять пользователями:
 * просматривать список, детали, транзакции, timeline и выполнять действия.
 * 
 * Endpoints:
 * - GET /api/admin/users - список пользователей с фильтрами
 * - GET /api/admin/users/:id - детали пользователя
 * - GET /api/admin/users/:id/transactions - транзакции пользователя
 * - GET /api/admin/users/:id/timeline - timeline активности
 * - PATCH /api/admin/users/:id - обновление пользователя
 * 
 * Использование:
 *   import usersRouter from './admin/users.routes';
 *   app.use('/api/admin/users', requireAdmin, usersRouter);
 */

import { Router, Request, Response } from 'express';
import { requireAdmin, AdminRequest } from '../../middleware/admin-auth.middleware';
import {
  getUsersList,
  getUserDetails,
  getUserTransactions,
  getUserTimeline,
} from '../../services/admin-users.service';
import { logAdminAction } from '../../services/admin-audit-log.service';
import { userRepository } from '../../repositories/user.repository';
import { grantMessages } from '../../services/credits.service';
import { getErrorMessage } from '../../lib/errors';
import { getAdminT } from '../../lib/admin-i18n';
import { AdminAuditAction, AdminAuditEntityType } from '../../lib/admin-audit-constants';
import { z } from 'zod';
import type { InsertUser } from '@shared/schema';
import bcrypt from 'bcryptjs';

const router = Router();

/**
 * GET /api/admin/users
 * 
 * Получает список пользователей с фильтрами и пагинацией
 * 
 * Query params:
 * - page: номер страницы (default: 1)
 * - limit: количество на странице (default: 20, max: 100)
 * - search: поиск по имени или email
 * - sortBy: поле для сортировки (created_at, name, email)
 * - sortOrder: порядок сортировки (asc, desc)
 * 
 * Response:
 * {
 *   users: [...],
 *   total: 150,
 *   page: 1,
 *   limit: 20,
 *   totalPages: 8
 * }
 */
const usersQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  plan: z.enum(['free', 'starter', 'pro']).optional(),
  sortBy: z.enum(['created_at', 'name', 'email']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

router.get('/', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const t = getAdminT(req);
    const validationResult = usersQuerySchema.safeParse(req.query);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: t('admin.errors.invalid_query_parameters'),
        details: validationResult.error.errors,
      });
    }

    const params = validationResult.data;

    const result = await getUsersList(params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * GET /api/admin/users/:id
 * 
 * Получает детальную информацию о пользователе
 * 
 * Response:
 * {
 *   id: number,
 *   email: string,
 *   name: string,
 *   stats: { ... }
 * }
 */
router.get('/:id', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    console.error('[DEBUG] GET /api/admin/users/:id - entry', { userId, rawId: req.params.id });
    if (isNaN(userId)) {
      const t = getAdminT(req);
      return res.status(400).json({ error: t('admin.errors.validation_failed') });
    }

    console.error('[DEBUG] Before getUserDetails call', { userId });
    const userDetails = await getUserDetails(userId);
    console.error('[DEBUG] After getUserDetails call', { userId, hasDetails: !!userDetails });
    if (!userDetails) {
      const t = getAdminT(req);
      return res.status(404).json({ error: t('admin.errors.user_not_found') });
    }

    // Убеждаемся что credits всегда присутствует
    if (!userDetails.credits || typeof userDetails.credits !== 'object') {
      console.error('[DEBUG] WARNING: userDetails.credits is missing or invalid, adding defaults');
      userDetails.credits = {
        totalGranted: 0,
        totalUsed: 0,
        messagesRemaining: 0,
      };
    }

    // Логируем что именно отправляем
    console.error('[DEBUG] Sending userDetails to client:', {
      hasCredits: !!userDetails.credits,
      creditsKeys: userDetails.credits ? Object.keys(userDetails.credits) : [],
      creditsValue: JSON.stringify(userDetails.credits),
      allKeys: Object.keys(userDetails),
    });

    // Явно сериализуем для проверки
    const jsonString = JSON.stringify(userDetails);
    const parsed = JSON.parse(jsonString);
    console.error('[DEBUG] After JSON serialization - hasCredits:', !!parsed.credits, 'creditsValue:', parsed.credits);

    res.json(userDetails);
  } catch (error) {
    console.error('[DEBUG] Error in GET /api/admin/users/:id', { 
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined 
    });
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * GET /api/admin/users/:id/transactions
 * 
 * Получает транзакции пользователя с фильтрами
 * 
 * Query params:
 * - page: номер страницы (default: 1)
 * - limit: количество на странице (default: 50, max: 100)
 * - type: фильтр по типу (income, expense)
 * - sortBy: поле для сортировки (date, amount)
 * - sortOrder: порядок сортировки (asc, desc)
 */
router.get('/:id/transactions', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      const t = getAdminT(req);
      return res.status(400).json({ error: t('admin.errors.validation_failed') });
    }

    const { page, limit, type, sortBy, sortOrder } = req.query;

    const params = {
      userId,
      page: page ? parseInt(String(page)) : undefined,
      limit: limit ? parseInt(String(limit)) : undefined,
      type: type as 'income' | 'expense' | undefined,
      sortBy: sortBy as 'date' | 'amount' | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    };

    const result = await getUserTransactions(params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * GET /api/admin/users/:id/timeline
 * 
 * Получает timeline активности пользователя
 * 
 * Query params:
 * - limit: количество событий (default: 50)
 */
router.get('/:id/timeline', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      const t = getAdminT(req);
      return res.status(400).json({ error: t('admin.errors.validation_failed') });
    }

    const limit = req.query.limit ? parseInt(String(req.query.limit)) : 50;
    const timeline = await getUserTimeline(userId, limit);
    res.json({ events: timeline });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * PATCH /api/admin/users/:id
 * 
 * Обновляет информацию о пользователе
 * 
 * Body:
 * {
 *   name?: string,
 *   email?: string
 * }
 */
router.patch('/:id', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      const t = getAdminT(req);
      return res.status(400).json({ error: t('admin.errors.validation_failed') });
    }

    // Валидация входных данных
    const updateSchema = z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      password: z.string().min(6).optional(), // Новый пароль (будет захеширован)
      isBlocked: z.boolean().optional(),
    });

    const validationResult = updateSchema.safeParse(req.body);
    const t = getAdminT(req);
    if (!validationResult.success) {
      return res.status(400).json({
        error: t('admin.errors.validation_failed'),
        details: validationResult.error.errors,
      });
    }

    const { name, email, password, isBlocked } = validationResult.data;

    // Проверяем что пользователь существует
    const user = await userRepository.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: t('admin.errors.user_not_found') });
    }

    // Обновляем пользователя
    const updateData: Partial<InsertUser> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked;
    
    // Хешируем пароль, если он указан
    if (password !== undefined) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    const updatedUser = await userRepository.updateUser(userId, updateData);

    // Логируем действие
    const changes: any = {
      before: { name: user.name, email: user.email, isBlocked: user.isBlocked || false },
      after: { name: updatedUser.name, email: updatedUser.email, isBlocked: updatedUser.isBlocked || false },
    };
    
    // Добавляем информацию о смене пароля (без самого пароля)
    if (password !== undefined) {
      changes.passwordChanged = true;
    }
    
    await logAdminAction({
      adminId: req.admin?.id,
      action: AdminAuditAction.USER_UPDATE,
      entityType: AdminAuditEntityType.USER,
      entityId: userId.toString(),
      changes,
      req,
    });

    res.json({ success: true, message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * POST /api/admin/users/:id/grant-credits
 * 
 * Начисляет кредиты пользователю
 * 
 * Body:
 * {
 *   amount: number - количество кредитов для начисления
 * }
 */
router.post('/:id/grant-credits', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      const t = getAdminT(req);
      return res.status(400).json({ error: t('admin.errors.validation_failed') });
    }

    // Валидация
    const grantSchema = z.object({
      amount: z.number().int().positive().max(10000),
    });

    const validationResult = grantSchema.safeParse(req.body);
    const t = getAdminT(req);
    if (!validationResult.success) {
      return res.status(400).json({
        error: t('admin.errors.validation_failed'),
        details: validationResult.error.errors,
      });
    }

    const { amount } = validationResult.data;

    // Проверяем что пользователь существует
    const user = await userRepository.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: t('admin.errors.user_not_found') });
    }

    // Начисляем кредиты
    const reason = `Admin granted ${amount} credits (Admin ID: ${req.admin?.id})`;
    console.error('[DEBUG] POST /grant-credits - Before grantMessages', { userId, amount });
    await grantMessages(userId, amount, reason);
    console.error('[DEBUG] POST /grant-credits - After grantMessages', { userId, amount });

    // Небольшая задержка чтобы убедиться что транзакция завершилась
    await new Promise(resolve => setTimeout(resolve, 100));

    // Проверяем что кредиты действительно сохранились
    const { getCreditBalance } = await import('../../services/credits.service');
    let balanceAfter;
    try {
      balanceAfter = await getCreditBalance(userId);
      console.error('[DEBUG] POST /grant-credits - Balance after grant:', JSON.stringify(balanceAfter));
      
      if (!balanceAfter || typeof balanceAfter !== 'object') {
        console.error('[DEBUG] POST /grant-credits - ERROR: Invalid balanceAfter:', balanceAfter);
        balanceAfter = { messagesRemaining: 0, totalGranted: 0, totalUsed: 0 };
      }
      
      if (balanceAfter.messagesRemaining === 0 && amount > 0) {
        console.error('[DEBUG] POST /grant-credits - WARNING: Credits were granted but balance is 0!');
      }
    } catch (error) {
      console.error('[DEBUG] POST /grant-credits - ERROR getting balance after grant:', error);
      balanceAfter = { messagesRemaining: 0, totalGranted: 0, totalUsed: 0 };
    }

    // Логируем действие
    await logAdminAction({
      adminId: req.admin?.id,
      action: AdminAuditAction.USER_GRANT_CREDITS,
      entityType: AdminAuditEntityType.USER,
      entityId: userId.toString(),
      changes: {
        amount,
        reason: 'Admin granted credits',
      },
      req,
    });

    res.json({ 
      success: true, 
      message: `Granted ${amount} credits to user`,
      balance: balanceAfter // Добавляем баланс в ответ для отладки
    });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * POST /api/admin/users/:id/block
 * 
 * Блокирует пользователя
 * 
 * Для джуна: В текущей схеме БД нет поля для блокировки.
 * Это заглушка для будущей реализации. Можно добавить поле
 * isBlocked в таблицу users или создать отдельную таблицу.
 */
router.post('/:id/block', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      const t = getAdminT(req);
      return res.status(400).json({ error: t('admin.errors.validation_failed') });
    }

    const user = await userRepository.getUserById(userId);
    if (!user) {
      const t = getAdminT(req);
      return res.status(404).json({ error: t('admin.errors.user_not_found') });
    }

    // Обновляем пользователя - блокируем
    const updatedUser = await userRepository.updateUser(userId, { isBlocked: true });

    // Логируем действие
    await logAdminAction({
      adminId: req.admin?.id,
      action: AdminAuditAction.USER_BLOCK,
      entityType: AdminAuditEntityType.USER,
      entityId: userId.toString(),
      changes: {
        before: { isBlocked: user.isBlocked || false },
        after: { isBlocked: true },
        reason: 'User blocked by admin',
      },
      req,
    });

    res.json({ success: true, message: 'User blocked successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * POST /api/admin/users/:id/unblock
 * 
 * Разблокирует пользователя
 */
router.post('/:id/unblock', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      const t = getAdminT(req);
      return res.status(400).json({ error: t('admin.errors.validation_failed') });
    }

    const user = await userRepository.getUserById(userId);
    if (!user) {
      const t = getAdminT(req);
      return res.status(404).json({ error: t('admin.errors.user_not_found') });
    }

    // Обновляем пользователя - разблокируем
    const updatedUser = await userRepository.updateUser(userId, { isBlocked: false });

    // Логируем действие
    await logAdminAction({
      adminId: req.admin?.id,
      action: AdminAuditAction.USER_UNBLOCK,
      entityType: AdminAuditEntityType.USER,
      entityId: userId.toString(),
      changes: {
        before: { isBlocked: user.isBlocked || false },
        after: { isBlocked: false },
        reason: 'User unblocked by admin',
      },
      req,
    });

    res.json({ success: true, message: 'User unblocked successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;


/**
 * Admin Support Routes
 * 
 * Junior-Friendly Guide:
 * =====================
 * Эти роуты предоставляют API для работы с поддержкой пользователей.
 * Админы могут общаться с пользователями через support чаты.
 * 
 * Endpoints:
 * - GET /api/admin/support/chats - список чатов
 * - GET /api/admin/support/chats/:id/messages - сообщения чата
 * - POST /api/admin/support/chats/:id/messages - отправка сообщения
 * - PATCH /api/admin/support/chats/:id - обновление статуса чата
 * - POST /api/admin/support/chats/:id/read - отметить сообщения как прочитанные
 * 
 * Использование:
 *   import supportRouter from './admin/support.routes';
 *   app.use('/api/admin/support', requireAdmin, supportRouter);
 */

import { Router, Request, Response } from 'express';
import { requireAdmin, AdminRequest } from '../../middleware/admin-auth.middleware';
import {
  getSupportChatsList,
  getChatMessages,
  sendSupportMessage,
  updateChatStatus,
  markMessagesAsRead,
} from '../../services/admin-support.service';
import { logAdminAction } from '../../services/admin-audit-log.service';
import { getErrorMessage } from '../../lib/errors';
import { getAdminT } from '../../lib/admin-i18n';
import { AdminAuditAction, AdminAuditEntityType } from '../../lib/admin-audit-constants';
import { z } from 'zod';

const router = Router();

// Валидация отправки сообщения
const sendMessageSchema = z.object({
  message: z.string().min(1).max(4000),
});

// Валидация обновления статуса чата
const updateChatStatusSchema = z.object({
  status: z.enum(['open', 'closed', 'pending', 'resolved']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assignedTo: z.number().int().positive().nullable().optional(),
  subject: z.string().nullable().optional(),
});

/**
 * GET /api/admin/support/chats
 * 
 * Получает список чатов поддержки с пагинацией
 * 
 * Query params:
 * - page: номер страницы (default: 1)
 * - limit: количество на странице (default: 20)
 * - status: фильтр по статусу (open, closed, pending, resolved)
 * - priority: фильтр по приоритету (low, normal, high, urgent)
 * - assignedTo: фильтр по назначенному админу (admin ID)
 * - unreadOnly: только чаты с непрочитанными сообщениями (true/false)
 * 
 * Response:
 * {
 *   chats: [
 *     {
 *       id: 1,
 *       userId: 123,
 *       userName: "John Doe",
 *       userEmail: "john@example.com",
 *       status: "open",
 *       priority: "normal",
 *       unreadCount: 3,
 *       lastMessageAt: "2026-01-07T10:00:00Z",
 *       ...
 *     },
 *     ...
 *   ],
 *   total: 100,
 *   page: 1,
 *   limit: 20,
 *   totalPages: 5
 * }
 */
router.get('/chats', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const status = req.query.status as
      | 'open'
      | 'closed'
      | 'pending'
      | 'resolved'
      | undefined;
    const priority = req.query.priority as
      | 'low'
      | 'normal'
      | 'high'
      | 'urgent'
      | undefined;
    const assignedTo = req.query.assignedTo
      ? parseInt(req.query.assignedTo as string, 10)
      : undefined;
    const unreadOnly = req.query.unreadOnly === 'true';

    const result = await getSupportChatsList({
      page,
      limit,
      status,
      priority,
      assignedTo,
      unreadOnly,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * GET /api/admin/support/chats/:id/messages
 * 
 * Получает сообщения чата
 * 
 * Query params:
 * - limit: максимальное количество сообщений (default: 100, max: 500)
 * 
 * Response:
 * {
 *   messages: [
 *     {
 *       id: 1,
 *       chatId: 1,
 *       senderType: "user",
 *       senderId: 123,
 *       senderName: "John Doe",
 *       message: "Hello!",
 *       isRead: true,
 *       createdAt: "2026-01-07T10:00:00Z"
 *     },
 *     ...
 *   ],
 *   total: 50
 * }
 */
const supportMessagesQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(str => Math.min(parseInt(str, 10), 500)).optional(),
});

router.get('/chats/:id/messages', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const t = getAdminT(req);
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: t('admin.errors.validation_failed') });
    }

    const validationResult = supportMessagesQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      return res.status(400).json({
        error: t('admin.errors.validation_failed'),
        details: validationResult.error.errors,
      });
    }

    const limit = validationResult.data.limit || 100;

    const result = await getChatMessages(id, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * POST /api/admin/support/chats/:id/messages
 * 
 * Отправляет сообщение от админа в чат
 * 
 * Body:
 * {
 *   message: "Ответ на вопрос пользователя"
 * }
 * 
 * Response:
 * {
 *   id: 1,
 *   chatId: 1,
 *   senderType: "admin",
 *   senderId: 1,
 *   message: "...",
 *   isRead: false,
 *   createdAt: "2026-01-07T10:00:00Z"
 * }
 */
router.post('/chats/:id/messages', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    if (!req.admin) {
      const t = getAdminT(req);
      return res.status(401).json({ error: t('admin.errors.unauthorized') });
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      const t = getAdminT(req);
      return res.status(400).json({ error: t('admin.errors.validation_failed') });
    }

    const body = sendMessageSchema.parse(req.body);

    const message = await sendSupportMessage(id, req.admin.id, body.message);

    await logAdminAction({
      adminId: req.admin.id,
      action: AdminAuditAction.SUPPORT_MESSAGE,
      entityType: AdminAuditEntityType.SUPPORT_CHAT,
      entityId: String(id),
      changes: { messageLength: body.message.length },
      req,
    });

    res.status(201).json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const t = getAdminT(req);
      return res.status(400).json({ error: t('admin.errors.validation_failed'), details: error.errors });
    }
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * PATCH /api/admin/support/chats/:id
 * 
 * Обновляет статус чата
 * 
 * Body:
 * {
 *   status: "resolved", // опционально
 *   priority: "high", // опционально
 *   assignedTo: 1, // опционально, ID админа или null
 *   subject: "Новая тема" // опционально
 * }
 * 
 * Response:
 * {
 *   id: 1,
 *   userId: 123,
 *   status: "resolved",
 *   priority: "high",
 *   ...
 * }
 */
router.patch('/chats/:id', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    if (!req.admin) {
      const t = getAdminT(req);
      return res.status(401).json({ error: t('admin.errors.unauthorized') });
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      const t = getAdminT(req);
      return res.status(400).json({ error: t('admin.errors.validation_failed') });
    }

    const body = updateChatStatusSchema.parse(req.body);

    const chat = await updateChatStatus(id, body);

    await logAdminAction({
      adminId: req.admin.id,
      action: AdminAuditAction.SUPPORT_CHAT_UPDATE,
      entityType: AdminAuditEntityType.SUPPORT_CHAT,
      entityId: String(id),
      changes: { updates: body },
      req,
    });

    res.json(chat);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const t = getAdminT(req);
      return res.status(400).json({ error: t('admin.errors.validation_failed'), details: error.errors });
    }
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * POST /api/admin/support/chats/:id/read
 * 
 * Отмечает все сообщения от пользователя в чате как прочитанные
 * 
 * Response:
 * {
 *   success: true
 * }
 */
router.post('/chats/:id/read', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      const t = getAdminT(req);
      return res.status(400).json({ error: t('admin.errors.validation_failed') });
    }

    await markMessagesAsRead(id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;


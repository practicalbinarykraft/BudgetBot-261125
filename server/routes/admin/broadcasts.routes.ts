/**
 * Admin Broadcasts Routes
 * 
 * Junior-Friendly Guide:
 * =====================
 * Эти роуты предоставляют API для создания и отправки рассылок пользователям.
 * 
 * Endpoints:
 * - GET /api/admin/broadcasts - список рассылок
 * - POST /api/admin/broadcasts - создание рассылки
 * - GET /api/admin/broadcasts/:id - детали рассылки
 * - POST /api/admin/broadcasts/:id/send - отправка рассылки
 * - GET /api/admin/broadcasts/templates - список шаблонов
 * - POST /api/admin/broadcasts/templates - создание шаблона
 * 
 * Использование:
 *   import broadcastsRouter from './admin/broadcasts.routes';
 *   app.use('/api/admin/broadcasts', requireAdmin, broadcastsRouter);
 */

import { Router, Request, Response } from 'express';
import { requireAdmin, AdminRequest } from '../../middleware/admin-auth.middleware';
import {
  getBroadcastsList,
  getBroadcastDetails,
  createBroadcast,
  sendBroadcast,
  getBroadcastTemplates,
  createBroadcastTemplate,
} from '../../services/admin-broadcasts.service';
import { logAdminAction } from '../../services/admin-audit-log.service';
import { AdminAuditAction, AdminAuditEntityType } from '../../lib/admin-audit-constants';
import { getErrorMessage } from '../../lib/errors';
import { getAdminT } from '../../lib/admin-i18n';
import { z } from 'zod';

const router = Router();

// Валидация создания рассылки
const createBroadcastSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(4000),
  templateId: z.string().optional(),
  targetSegment: z.enum(['all', 'active', 'new_users', 'at_risk', 'churned', 'power_users']).optional(),
  targetUserIds: z.array(z.number().int().positive()).optional(),
  scheduledAt: z.string().datetime().optional(),
});

// Валидация создания шаблона
const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(4000),
  description: z.string().optional(),
  variables: z.array(z.string()).optional(),
});

/**
 * GET /api/admin/broadcasts
 * 
 * Получает список рассылок с пагинацией
 * 
 * Query params:
 * - page: номер страницы (default: 1)
 * - limit: количество на странице (default: 20)
 * - status: фильтр по статусу (draft, scheduled, sending, completed, cancelled)
 * 
 * Response:
 * {
 *   broadcasts: [...],
 *   total: 100,
 *   page: 1,
 *   limit: 20,
 *   totalPages: 5
 * }
 */
const broadcastsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.enum(['draft', 'scheduled', 'sending', 'completed', 'cancelled']).optional(),
});

router.get('/', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const validationResult = broadcastsQuerySchema.safeParse(req.query);
    
    if (!validationResult.success) {
      const t = getAdminT(req);
      return res.status(400).json({
        error: t('admin.errors.invalid_query_parameters'),
        details: validationResult.error.errors,
      });
    }

    const { page, limit, status } = validationResult.data;

    const result = await getBroadcastsList({ page, limit, status });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * POST /api/admin/broadcasts
 * 
 * Создает новую рассылку
 * 
 * Body:
 * {
 *   title: "Заголовок",
 *   message: "Текст сообщения",
 *   targetSegment: "all" | "active" | "new_users" | "at_risk" | "churned" | "power_users",
 *   targetUserIds: [1, 2, 3], // опционально, конкретные пользователи
 *   scheduledAt: "2026-01-08T10:00:00Z" // опционально, для отложенной отправки
 * }
 */
router.post('/', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    if (!req.admin) {
      const t = getAdminT(req);
      return res.status(401).json({ error: t('admin.errors.unauthorized') });
    }

    const body = createBroadcastSchema.parse(req.body);

    const broadcast = await createBroadcast(body, req.admin.id);

    await logAdminAction({
      adminId: req.admin.id,
      action: AdminAuditAction.BROADCAST_CREATE,
      entityType: AdminAuditEntityType.BROADCAST,
      entityId: String(broadcast.id),
      changes: { title: broadcast.title, targetSegment: broadcast.targetSegment },
      req,
    });

    res.status(201).json(broadcast);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const t = getAdminT(req);
      return res.status(400).json({ error: t('admin.errors.validation_failed'), details: error.errors });
    }
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * GET /api/admin/broadcasts/:id
 * 
 * Получает детали рассылки
 * 
 * Response:
 * {
 *   id: 1,
 *   title: "...",
 *   message: "...",
 *   status: "completed",
 *   recipients: {
 *     total: 100,
 *     sent: 95,
 *     failed: 5,
 *     pending: 0
 *   },
 *   ...
 * }
 */
router.get('/:id', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      const t = getAdminT(req);
      return res.status(400).json({ error: t('admin.errors.invalid_broadcast_id') });
    }

    const broadcast = await getBroadcastDetails(id);

    if (!broadcast) {
      const t = getAdminT(req);
      return res.status(404).json({ error: t('admin.errors.broadcast_not_found') });
    }

    res.json(broadcast);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * POST /api/admin/broadcasts/:id/send
 * 
 * Отправляет рассылку всем получателям
 * 
 * Response:
 * {
 *   success: true,
 *   totalRecipients: 100,
 *   sentCount: 95,
 *   failedCount: 5
 * }
 */
router.post('/:id/send', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    if (!req.admin) {
      const t = getAdminT(req);
      return res.status(401).json({ error: t('admin.errors.unauthorized') });
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      const t = getAdminT(req);
      return res.status(400).json({ error: t('admin.errors.invalid_broadcast_id') });
    }

    const result = await sendBroadcast(id);

    await logAdminAction({
      adminId: req.admin.id,
      action: AdminAuditAction.BROADCAST_SEND,
      entityType: AdminAuditEntityType.BROADCAST,
      entityId: String(id),
      changes: {
        totalRecipients: result.totalRecipients,
        sentCount: result.sentCount,
        failedCount: result.failedCount,
      },
      req,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * GET /api/admin/broadcasts/templates
 * 
 * Получает список шаблонов рассылок
 * 
 * Response:
 * [
 *   {
 *     id: 1,
 *     name: "Welcome Message",
 *     title: "Добро пожаловать!",
 *     message: "...",
 *     variables: ["{name}", "{email}"],
 *     ...
 *   },
 *   ...
 * ]
 */
router.get('/templates', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const templates = await getBroadcastTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * POST /api/admin/broadcasts/templates
 * 
 * Создает новый шаблон рассылки
 * 
 * Body:
 * {
 *   name: "Welcome Message",
 *   title: "Добро пожаловать!",
 *   message: "Привет, {name}! ...",
 *   description: "Шаблон приветственного сообщения",
 *   variables: ["{name}", "{email}"]
 * }
 */
router.post('/templates', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    if (!req.admin) {
      const t = getAdminT(req);
      return res.status(401).json({ error: t('admin.errors.unauthorized') });
    }

    const body = createTemplateSchema.parse(req.body);

    const template = await createBroadcastTemplate(body, req.admin.id);

    await logAdminAction({
      adminId: req.admin.id,
      action: AdminAuditAction.BROADCAST_TEMPLATE_CREATE,
      entityType: AdminAuditEntityType.BROADCAST_TEMPLATE,
      entityId: String(template.id),
      changes: { name: template.name },
      req,
    });

    res.status(201).json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const t = getAdminT(req);
      return res.status(400).json({ error: t('admin.errors.validation_failed'), details: error.errors });
    }
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;


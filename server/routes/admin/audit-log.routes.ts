/**
 * Admin Audit Log Routes
 *
 * API endpoints for admins to view audit logs
 */

import { Router, Request, Response } from "express";
import { requireAdmin, AdminRequest } from "../../middleware/admin-auth.middleware";
import { getRecentAuditLogs, getUserAuditLogs } from "../../services/audit-log.service";
import { getAdminT } from "../../lib/admin-i18n";
import { z } from "zod";
import { BadRequestError } from "../../lib/errors";

const router = Router();

/**
 * GET /api/admin/audit-logs
 * Get all audit logs (admin only)
 * Query params: limit, offset, userId, action, entityType, fromDate, toDate
 */
router.get("/", requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const { limit, offset, userId, action, entityType, fromDate, toDate } = req.query;

    // If userId is provided, get logs for that user
    if (userId) {
      const validated = z.object({
        userId: z.string().regex(/^\d+$/),
        limit: z.string().regex(/^\d+$/).optional(),
        offset: z.string().regex(/^\d+$/).optional(),
        fromDate: z.string().datetime().optional(),
        toDate: z.string().datetime().optional(),
        action: z.string().optional(),
        entityType: z.string().optional(),
      }).safeParse({
        userId,
        limit,
        offset,
        fromDate,
        toDate,
        action,
        entityType,
      });

      if (!validated.success) {
        const t = getAdminT(req);
        throw new BadRequestError(t('admin.errors.invalid_query_parameters'), validated.error.errors);
      }

      const logs = await getUserAuditLogs({
        userId: parseInt(validated.data.userId),
        limit: validated.data.limit ? parseInt(validated.data.limit) : undefined,
        offset: validated.data.offset ? parseInt(validated.data.offset) : undefined,
        fromDate: validated.data.fromDate ? new Date(validated.data.fromDate) : undefined,
        toDate: validated.data.toDate ? new Date(validated.data.toDate) : undefined,
        action: validated.data.action,
        entityType: validated.data.entityType,
      });

      return res.json(logs);
    }

    // Otherwise, get recent logs for all users
    const validated = z.object({
      limit: z.string().regex(/^\d+$/).optional(),
      offset: z.string().regex(/^\d+$/).optional(),
    }).safeParse({ limit, offset });

    if (!validated.success) {
      const t = getAdminT(req);
      throw new BadRequestError(t('admin.errors.invalid_query_parameters'), validated.error.errors);
    }

    const logs = await getRecentAuditLogs({
      limit: validated.data.limit ? parseInt(validated.data.limit) : undefined,
      offset: validated.data.offset ? parseInt(validated.data.offset) : undefined,
    });

    res.json(logs);
  } catch (error: unknown) {
    if (error instanceof BadRequestError) {
      return res.status(400).json({ error: error.message, details: error.details });
    }
    throw error;
  }
});

export default router;


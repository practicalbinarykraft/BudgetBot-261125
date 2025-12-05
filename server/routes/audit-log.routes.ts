/**
 * Audit Log Routes
 *
 * API endpoints for querying audit logs
 */

import { Router } from "express";
import { withAuth } from "../middleware/auth-utils";
import { getUserAuditLogs, getEntityAuditLogs } from "../services/audit-log.service";
import { z } from "zod";
import { BadRequestError, getErrorMessage } from "../lib/errors";

const router = Router();

/**
 * GET /api/audit-logs
 * Get audit logs for the authenticated user
 */
router.get("/", withAuth(async (req, res) => {
  try {
    const { limit, offset, fromDate, toDate, action, entityType } = req.query;

    // Validate query parameters
    const querySchema = z.object({
      limit: z.string().regex(/^\d+$/).optional(),
      offset: z.string().regex(/^\d+$/).optional(),
      fromDate: z.string().datetime().optional(),
      toDate: z.string().datetime().optional(),
      action: z.string().optional(),
      entityType: z.string().optional(),
    });

    const validated = querySchema.safeParse({
      limit,
      offset,
      fromDate,
      toDate,
      action,
      entityType,
    });

    if (!validated.success) {
      throw new BadRequestError("Invalid query parameters", validated.error.errors);
    }

    const logs = await getUserAuditLogs({
      userId: req.user.id,
      limit: limit ? parseInt(String(limit)) : undefined,
      offset: offset ? parseInt(String(offset)) : undefined,
      fromDate: fromDate ? new Date(String(fromDate)) : undefined,
      toDate: toDate ? new Date(String(toDate)) : undefined,
      action: action ? String(action) : undefined,
      entityType: entityType ? String(entityType) : undefined,
    });

    res.json(logs);
  } catch (error: unknown) {
    throw error;
  }
}));

/**
 * GET /api/audit-logs/:entityType/:entityId
 * Get audit logs for a specific entity
 */
router.get("/:entityType/:entityId", withAuth(async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { limit } = req.query;

    // Validate entity ID
    if (!/^\d+$/.test(entityId)) {
      throw new BadRequestError("Invalid entity ID");
    }

    const logs = await getEntityAuditLogs({
      entityType,
      entityId: parseInt(entityId),
      limit: limit ? parseInt(String(limit)) : undefined,
    });

    // Filter to only return logs for the authenticated user
    const userLogs = logs.filter(log => log.userId === req.user.id);

    res.json(userLogs);
  } catch (error: unknown) {
    throw error;
  }
}));

export default router;

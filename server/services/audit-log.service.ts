/**
 * Audit Log Service
 *
 * Tracks all important user actions for security, debugging, and compliance.
 * Logs: create, update, delete operations on transactions, wallets, budgets, etc.
 */

import { db } from '../db';
import { auditLog, type InsertAuditLog } from '@shared/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import type { Request } from 'express';
import logger from '../lib/logger';

/**
 * Action types that can be logged
 */
export enum AuditAction {
  // Authentication
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  PASSWORD_CHANGE = 'password_change',

  // CRUD operations
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',

  // Bulk operations
  BULK_DELETE = 'bulk_delete',
  BULK_UPDATE = 'bulk_update',

  // Special operations
  EXPORT = 'export',
  IMPORT = 'import',
  SETTINGS_CHANGE = 'settings_change',
}

/**
 * Entity types that can be audited
 */
export enum AuditEntityType {
  TRANSACTION = 'transaction',
  WALLET = 'wallet',
  BUDGET = 'budget',
  CATEGORY = 'category',
  USER = 'user',
  SETTINGS = 'settings',
  API_KEY = 'api_key',
}

/**
 * Extract IP address from request
 */
function getIpAddress(req: Request): string | undefined {
  // Check for proxy headers first
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
    return ips[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return typeof realIp === 'string' ? realIp : realIp[0];
  }

  return req.ip || req.socket.remoteAddress;
}

/**
 * Extract user agent from request
 */
function getUserAgent(req: Request): string | undefined {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua : ua?.[0];
}

/**
 * Log an audit event
 */
export async function logAuditEvent(params: {
  userId?: number;
  action: AuditAction | string;
  entityType: AuditEntityType | string;
  entityId?: number;
  metadata?: Record<string, any>;
  req?: Request;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    const {
      userId,
      action,
      entityType,
      entityId,
      metadata,
      req,
      ipAddress,
      userAgent,
    } = params;

    // Extract IP and user agent from request if provided
    const finalIpAddress = ipAddress || (req ? getIpAddress(req) : undefined);
    const finalUserAgent = userAgent || (req ? getUserAgent(req) : undefined);

    // Prepare audit log entry
    const auditEntry: InsertAuditLog = {
      userId,
      action,
      entityType,
      entityId,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
      ipAddress: finalIpAddress,
      userAgent: finalUserAgent,
    };

    // Insert into database
    await db.insert(auditLog).values(auditEntry);

    // Also log to Winston for immediate visibility
    logger.info('Audit event logged', {
      userId,
      action,
      entityType,
      entityId,
      ip: finalIpAddress,
    });
  } catch (error: any) {
    // Don't throw - audit logging should never break the main flow
    logger.error('Failed to log audit event', {
      error: error.message,
      action: params.action,
      entityType: params.entityType,
    });
  }
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(params: {
  userId: number;
  limit?: number;
  offset?: number;
  fromDate?: Date;
  toDate?: Date;
  action?: string;
  entityType?: string;
}) {
  const {
    userId,
    limit = 50,
    offset = 0,
    fromDate,
    toDate,
    action,
    entityType,
  } = params;

  // Build query conditions
  const conditions = [eq(auditLog.userId, userId)];

  if (fromDate) {
    conditions.push(gte(auditLog.createdAt, fromDate));
  }

  if (toDate) {
    conditions.push(lte(auditLog.createdAt, toDate));
  }

  if (action) {
    conditions.push(eq(auditLog.action, action));
  }

  if (entityType) {
    conditions.push(eq(auditLog.entityType, entityType));
  }

  // Execute query
  const logs = await db
    .select()
    .from(auditLog)
    .where(and(...conditions))
    .orderBy(desc(auditLog.createdAt))
    .limit(limit)
    .offset(offset);

  // Parse metadata JSON
  return logs.map(log => ({
    ...log,
    metadata: log.metadata ? JSON.parse(log.metadata) : null,
  }));
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditLogs(params: {
  entityType: string;
  entityId: number;
  limit?: number;
}) {
  const { entityType, entityId, limit = 50 } = params;

  const logs = await db
    .select()
    .from(auditLog)
    .where(
      and(
        eq(auditLog.entityType, entityType),
        eq(auditLog.entityId, entityId)
      )
    )
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);

  // Parse metadata JSON
  return logs.map(log => ({
    ...log,
    metadata: log.metadata ? JSON.parse(log.metadata) : null,
  }));
}

/**
 * Get recent audit logs (admin view)
 */
export async function getRecentAuditLogs(params: {
  limit?: number;
  offset?: number;
}) {
  const { limit = 100, offset = 0 } = params;

  const logs = await db
    .select()
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit)
    .offset(offset);

  // Parse metadata JSON
  return logs.map(log => ({
    ...log,
    metadata: log.metadata ? JSON.parse(log.metadata) : null,
  }));
}

/**
 * Delete old audit logs (for cleanup)
 */
export async function deleteOldAuditLogs(olderThanDays: number): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await db
    .delete(auditLog)
    .where(lte(auditLog.createdAt, cutoffDate));

  logger.info(`Deleted old audit logs`, {
    olderThanDays,
    cutoffDate: cutoffDate.toISOString(),
  });

  return 0; // Drizzle doesn't return count, would need raw SQL
}

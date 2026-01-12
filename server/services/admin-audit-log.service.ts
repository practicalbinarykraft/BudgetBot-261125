/**
 * Admin Audit Log Service
 * 
 * Junior-Friendly Guide:
 * =====================
 * Этот сервис логирует все действия админов в таблицу admin_audit_log.
 * Это важно для безопасности и отслеживания кто что делал.
 * 
 * Использование:
 *   import { logAdminAction } from './admin-audit-log.service';
 *   await logAdminAction({
 *     adminId: req.admin.id,
 *     action: 'user.ban',
 *     entityType: 'user',
 *     entityId: '123',
 *     changes: { before: {...}, after: {...} },
 *     req
 *   });
 */

import { db } from '../db';
import { adminAuditLog, type InsertAdminAuditLog } from '@shared/schema';
import type { Request } from 'express';
import { logError } from '../lib/logger';

/**
 * Извлекает IP адрес из запроса
 */
function getIpAddress(req?: Request): string | undefined {
  if (!req) return undefined;

  // Проверяем заголовки прокси
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
 * Извлекает User-Agent из запроса
 */
function getUserAgent(req?: Request): string | undefined {
  if (!req) return undefined;
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua : ua?.[0];
}

/**
 * Логирует действие админа
 * 
 * @param params - Параметры действия
 */
export async function logAdminAction(params: {
  adminId?: number;
  action: string; // 'user.ban', 'plan.change', 'login', 'logout', etc.
  entityType?: string; // 'user', 'transaction', 'plan', etc.
  entityId?: string; // ID сущности (строка для гибкости)
  changes?: Record<string, any>; // before/after состояние или метаданные
  req?: Request;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    const {
      adminId,
      action,
      entityType,
      entityId,
      changes,
      req,
      ipAddress,
      userAgent,
    } = params;

    // Извлекаем IP и User-Agent из запроса если не переданы
    const finalIpAddress = ipAddress || getIpAddress(req);
    const finalUserAgent = userAgent || getUserAgent(req);

    // Подготавливаем данные для вставки
    const auditData: InsertAdminAuditLog = {
      adminId: adminId || null,
      action,
      entityType: entityType || undefined,
      entityId: entityId || undefined,
      changes: changes ? (changes as any) : null,
      ipAddress: finalIpAddress || undefined,
      userAgent: finalUserAgent || undefined,
    };

    // Вставляем запись в БД
    await db.insert(adminAuditLog).values(auditData);
  } catch (error) {
    // Логируем ошибку, но не прерываем выполнение
    // Аудит не должен ломать основную функциональность
    logError('Failed to log admin action', error as Error, params);
  }
}


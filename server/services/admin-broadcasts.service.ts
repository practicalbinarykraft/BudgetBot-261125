/**
 * Admin Broadcasts Service
 * 
 * Junior-Friendly Guide:
 * =====================
 * Этот сервис предоставляет функционал для создания и отправки рассылок пользователям.
 * Рассылки отправляются через Telegram бота.
 * 
 * Использование:
 *   import { createBroadcast, sendBroadcast, getBroadcastsList } from './admin-broadcasts.service';
 */

import { db } from '../db';
import { broadcasts, broadcastRecipients, broadcastTemplates, users } from '@shared/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { getTelegramBot } from '../telegram/bot';
import { logError, logInfo } from '../lib/logger';
import type { InsertBroadcast, Broadcast, InsertBroadcastRecipient } from '@shared/schema';

/**
 * Broadcast Status
 * 
 * Для джуна: Статусы рассылки:
 * - draft: черновик, еще не отправлена
 * - scheduled: запланирована на определенное время
 * - sending: в процессе отправки
 * - completed: успешно отправлена всем
 * - cancelled: отменена
 */

/**
 * Получить список рассылок
 * 
 * Для джуна: Возвращает все рассылки с пагинацией и фильтрацией по статусу.
 */
export interface BroadcastsListParams {
  page?: number;
  limit?: number;
  status?: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
}

export interface BroadcastsListResult {
  broadcasts: Broadcast[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getBroadcastsList(
  params: BroadcastsListParams = {}
): Promise<BroadcastsListResult> {
  try {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    // Строим условие WHERE
    const conditions = [];
    if (params.status) {
      conditions.push(eq(broadcasts.status, params.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Получаем рассылки
    const broadcastsList = await db
      .select()
      .from(broadcasts)
      .where(whereClause)
      .orderBy(desc(broadcasts.createdAt))
      .limit(limit)
      .offset(offset);

    // Получаем общее количество
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(broadcasts)
      .where(whereClause);

    const total = totalResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      broadcasts: broadcastsList,
      total,
      page,
      limit,
      totalPages,
    };
  } catch (error) {
    logError('Failed to get broadcasts list', error as Error);
    throw error;
  }
}

/**
 * Получить детали рассылки
 * 
 * Для джуна: Возвращает информацию о рассылке и статистику отправки.
 */
export interface BroadcastDetails extends Broadcast {
  recipients: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
}

export async function getBroadcastDetails(broadcastId: number): Promise<BroadcastDetails | null> {
  try {
    const [broadcast] = await db
      .select()
      .from(broadcasts)
      .where(eq(broadcasts.id, broadcastId))
      .limit(1);

    if (!broadcast) {
      return null;
    }

    // Получаем статистику получателей
    const recipients = await db
      .select({
        status: broadcastRecipients.status,
        count: sql<number>`count(*)`,
      })
      .from(broadcastRecipients)
      .where(eq(broadcastRecipients.broadcastId, broadcastId))
      .groupBy(broadcastRecipients.status);

    const stats = {
      total: 0,
      sent: 0,
      failed: 0,
      pending: 0,
    };

    recipients.forEach((r) => {
      const count = Number(r.count);
      stats.total += count;
      if (r.status === 'sent') stats.sent = count;
      else if (r.status === 'failed') stats.failed = count;
      else if (r.status === 'pending') stats.pending = count;
    });

    return {
      ...broadcast,
      recipients: stats,
    };
  } catch (error) {
    logError('Failed to get broadcast details', error as Error);
    throw error;
  }
}

/**
 * Создать новую рассылку
 * 
 * Для джуна: Создает рассылку в статусе 'draft'.
 * Для отправки нужно вызвать sendBroadcast().
 */
export async function createBroadcast(
  data: Omit<InsertBroadcast, 'status' | 'totalRecipients' | 'sentCount' | 'failedCount'>,
  adminId: number
): Promise<Broadcast> {
  try {
    const [broadcast] = await db
      .insert(broadcasts)
      .values({
        title: data.title,
        message: data.message,
        templateId: data.templateId || null,
        targetSegment: data.targetSegment || null,
        targetUserIds: data.targetUserIds || null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        status: 'draft',
        createdBy: adminId,
        totalRecipients: 0,
        sentCount: 0,
        failedCount: 0,
      })
      .returning();

    logInfo('Broadcast created', { broadcastId: broadcast.id, adminId });
    return broadcast;
  } catch (error) {
    logError('Failed to create broadcast', error as Error);
    throw error;
  }
}

/**
 * Определить список получателей рассылки
 * 
 * Для джуна: Определяет кому отправлять рассылку на основе targetSegment или targetUserIds.
 */
async function getBroadcastRecipients(broadcast: Broadcast): Promise<number[]> {
  // Если указаны конкретные пользователи
  if (broadcast.targetUserIds && broadcast.targetUserIds.length > 0) {
    return broadcast.targetUserIds;
  }

  // Если указан сегмент
  if (broadcast.targetSegment) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    let query = db.select({ id: users.id }).from(users).$dynamic();

    switch (broadcast.targetSegment) {
      case 'all':
        // Все пользователи с Telegram ID
        query = query.where(sql`${users.telegramId} IS NOT NULL`);
        break;

      case 'active':
        // Активные пользователи (транзакция за последние 30 дней)
        query = query.where(
          sql`${users.telegramId} IS NOT NULL AND EXISTS (
            SELECT 1 FROM transactions
            WHERE transactions.user_id = ${users.id}
            AND DATE(transactions.date) >= ${thirtyDaysAgo.toISOString().split('T')[0]}
          )`
        );
        break;

      case 'new_users':
        // Новые пользователи (зарегистрировались за последние 30 дней)
        query = query.where(
          sql`${users.telegramId} IS NOT NULL AND ${users.createdAt} >= ${thirtyDaysAgo.toISOString()}`
        );
        break;

      case 'at_risk':
        // В зоне риска (неактивны 30-60 дней)
        query = query.where(
          sql`${users.telegramId} IS NOT NULL AND EXISTS (
            SELECT 1 FROM transactions
            WHERE transactions.user_id = ${users.id}
            AND DATE(transactions.date) >= ${sixtyDaysAgo.toISOString().split('T')[0]}
            AND DATE(transactions.date) < ${thirtyDaysAgo.toISOString().split('T')[0]}
          )`
        );
        break;

      case 'churned':
        // Неактивные (60+ дней)
        query = query.where(
          sql`${users.telegramId} IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM transactions
            WHERE transactions.user_id = ${users.id}
            AND DATE(transactions.date) >= ${sixtyDaysAgo.toISOString().split('T')[0]}
          )`
        );
        break;

      case 'power_users':
        // Мощные пользователи (50+ транзакций, активны)
        query = query.where(
          sql`${users.telegramId} IS NOT NULL AND EXISTS (
            SELECT 1 FROM transactions
            WHERE transactions.user_id = ${users.id}
            AND DATE(transactions.date) >= ${thirtyDaysAgo.toISOString().split('T')[0]}
            GROUP BY transactions.user_id
            HAVING COUNT(*) >= 50
          )`
        );
        break;

      default:
        // По умолчанию все пользователи с Telegram
        query = query.where(sql`${users.telegramId} IS NOT NULL`);
    }

    const recipients = await query;
    return recipients.map((r) => r.id);
  }

  // По умолчанию все пользователи с Telegram ID
  const allUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`${users.telegramId} IS NOT NULL`);

  return allUsers.map((u) => u.id);
}

/**
 * Отправить рассылку
 * 
 * Для джуна: Отправляет рассылку всем получателям через Telegram бота.
 * Создает записи в broadcast_recipients для отслеживания статуса.
 */
export async function sendBroadcast(broadcastId: number): Promise<{
  success: boolean;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
}> {
  try {
    // Получаем рассылку
    const [broadcast] = await db
      .select()
      .from(broadcasts)
      .where(eq(broadcasts.id, broadcastId))
      .limit(1);

    if (!broadcast) {
      throw new Error('Broadcast not found');
    }

    if (broadcast.status === 'sending' || broadcast.status === 'completed') {
      throw new Error(`Broadcast already ${broadcast.status}`);
    }

    // Обновляем статус на 'sending'
    await db
      .update(broadcasts)
      .set({
        status: 'sending',
        sentAt: new Date(),
      })
      .where(eq(broadcasts.id, broadcastId));

    // Определяем получателей
    const recipientIds = await getBroadcastRecipients(broadcast);
    const totalRecipients = recipientIds.length;

    if (totalRecipients === 0) {
      await db
        .update(broadcasts)
        .set({
          status: 'completed',
          totalRecipients: 0,
        })
        .where(eq(broadcasts.id, broadcastId));

      return {
        success: true,
        totalRecipients: 0,
        sentCount: 0,
        failedCount: 0,
      };
    }

    // Получаем Telegram бота
    const bot = getTelegramBot();
    if (!bot) {
      throw new Error('Telegram bot not initialized');
    }

    // Получаем информацию о пользователях
    const usersList = await db
      .select({
        id: users.id,
        telegramId: users.telegramId,
      })
      .from(users)
      .where(inArray(users.id, recipientIds));

    // Создаем записи получателей
    const recipientRecords: InsertBroadcastRecipient[] = usersList.map((user) => ({
      broadcastId: broadcastId,
      userId: user.id,
      status: 'pending',
    }));

    if (recipientRecords.length > 0) {
      await db.insert(broadcastRecipients).values(recipientRecords as any);
    }

    // Отправляем сообщения
    let sentCount = 0;
    let failedCount = 0;

    const message = `*${broadcast.title}*\n\n${broadcast.message}`;

    for (const user of usersList) {
      if (!user.telegramId) {
        failedCount++;
        await db
          .update(broadcastRecipients)
          .set({
            status: 'failed',
            errorMessage: 'No Telegram ID',
          })
          .where(
            and(
              eq(broadcastRecipients.broadcastId, broadcastId),
              eq(broadcastRecipients.userId, user.id)
            )
          );
        continue;
      }

      try {
        await bot.sendMessage(user.telegramId, message, { parse_mode: 'Markdown' });
        sentCount++;
        await db
          .update(broadcastRecipients)
          .set({
            status: 'sent',
            sentAt: new Date(),
          })
          .where(
            and(
              eq(broadcastRecipients.broadcastId, broadcastId),
              eq(broadcastRecipients.userId, user.id)
            )
          );
      } catch (error: any) {
        failedCount++;
        logError('Failed to send broadcast message', error as Error, {
          userId: user.id,
          broadcastId,
        });
        await db
          .update(broadcastRecipients)
          .set({
            status: 'failed',
            errorMessage: error.message || 'Unknown error',
          })
          .where(
            and(
              eq(broadcastRecipients.broadcastId, broadcastId),
              eq(broadcastRecipients.userId, user.id)
            )
          );
      }
    }

    // Обновляем статус рассылки
    await db
      .update(broadcasts)
      .set({
        status: 'completed',
        totalRecipients,
        sentCount,
        failedCount,
      })
      .where(eq(broadcasts.id, broadcastId));

    logInfo('Broadcast sent', {
      broadcastId,
      totalRecipients,
      sentCount,
      failedCount,
    });

    return {
      success: true,
      totalRecipients,
      sentCount,
      failedCount,
    };
  } catch (error) {
    logError('Failed to send broadcast', error as Error, { broadcastId });

    // Обновляем статус на 'cancelled' при ошибке
    await db
      .update(broadcasts)
      .set({ status: 'cancelled' })
      .where(eq(broadcasts.id, broadcastId))
      .catch(() => {
        // Игнорируем ошибку обновления
      });

    throw error;
  }
}

/**
 * Получить список шаблонов рассылок
 * 
 * Для джуна: Возвращает все сохраненные шаблоны для быстрого создания рассылок.
 */
export async function getBroadcastTemplates(): Promise<typeof broadcastTemplates.$inferSelect[]> {
  try {
    return await db.select().from(broadcastTemplates).orderBy(desc(broadcastTemplates.createdAt));
  } catch (error) {
    logError('Failed to get broadcast templates', error as Error);
    throw error;
  }
}

/**
 * Создать шаблон рассылки
 * 
 * Для джуна: Создает новый шаблон для повторного использования.
 */
export async function createBroadcastTemplate(
  data: Omit<typeof broadcastTemplates.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>,
  adminId: number
): Promise<typeof broadcastTemplates.$inferSelect> {
  try {
    const [template] = await db
      .insert(broadcastTemplates)
      .values({
        ...data,
        createdBy: adminId,
      })
      .returning();

    logInfo('Broadcast template created', { templateId: template.id, adminId });
    return template;
  } catch (error) {
    logError('Failed to create broadcast template', error as Error);
    throw error;
  }
}


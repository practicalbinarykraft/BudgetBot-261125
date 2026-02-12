/**
 * Admin Bridge Routes
 *
 * Принимает запросы от админки и выполняет Telegram-операции через бота прод-сервера.
 * Админка НЕ использует Telegram Bot API напрямую — все сообщения идут через этот bridge.
 *
 * Аутентификация: заголовок X-Admin-API-Secret (общий секрет между админкой и прод-сервером).
 *
 * Endpoints:
 * - POST /broadcasts/:id/send — отправить рассылку получателям через Telegram
 * - POST /send-message — отправить одно сообщение пользователю
 */

import { Router, Request, Response } from "express";
import { db } from "../db";
import {
  broadcasts,
  broadcastRecipients,
  users,
} from "@shared/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { getTelegramBot } from "../telegram/bot";
import { logInfo, logError } from "../lib/logger";
import type { InsertBroadcastRecipient } from "@shared/schema";

const router = Router();

const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET;

/**
 * Middleware: проверка секрета
 */
function verifyAdminSecret(req: Request, res: Response): boolean {
  if (!ADMIN_API_SECRET) {
    res.status(503).json({ error: "ADMIN_API_SECRET not configured on prod server" });
    return false;
  }

  const secret = req.headers["x-admin-api-secret"];
  if (secret !== ADMIN_API_SECRET) {
    res.status(403).json({ error: "Invalid API secret" });
    return false;
  }

  return true;
}

/**
 * Определить получателей рассылки по сегменту
 */
async function getBroadcastRecipientIds(broadcast: typeof broadcasts.$inferSelect): Promise<number[]> {
  if (broadcast.targetUserIds && broadcast.targetUserIds.length > 0) {
    return broadcast.targetUserIds;
  }

  if (broadcast.targetSegment) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    let query = db.select({ id: users.id }).from(users).$dynamic();

    switch (broadcast.targetSegment) {
      case "all":
        query = query.where(sql`${users.telegramId} IS NOT NULL`);
        break;
      case "active":
        query = query.where(
          sql`${users.telegramId} IS NOT NULL AND EXISTS (
            SELECT 1 FROM transactions
            WHERE transactions.user_id = ${users.id}
            AND DATE(transactions.date) >= ${thirtyDaysAgo.toISOString().split("T")[0]}
          )`
        );
        break;
      case "new_users":
        query = query.where(
          sql`${users.telegramId} IS NOT NULL AND ${users.createdAt} >= ${thirtyDaysAgo.toISOString()}`
        );
        break;
      case "at_risk":
        query = query.where(
          sql`${users.telegramId} IS NOT NULL AND EXISTS (
            SELECT 1 FROM transactions
            WHERE transactions.user_id = ${users.id}
            AND DATE(transactions.date) >= ${sixtyDaysAgo.toISOString().split("T")[0]}
            AND DATE(transactions.date) < ${thirtyDaysAgo.toISOString().split("T")[0]}
          )`
        );
        break;
      case "churned":
        query = query.where(
          sql`${users.telegramId} IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM transactions
            WHERE transactions.user_id = ${users.id}
            AND DATE(transactions.date) >= ${sixtyDaysAgo.toISOString().split("T")[0]}
          )`
        );
        break;
      case "power_users":
        query = query.where(
          sql`${users.telegramId} IS NOT NULL AND EXISTS (
            SELECT 1 FROM transactions
            WHERE transactions.user_id = ${users.id}
            AND DATE(transactions.date) >= ${thirtyDaysAgo.toISOString().split("T")[0]}
            GROUP BY transactions.user_id
            HAVING COUNT(*) >= 50
          )`
        );
        break;
      default:
        query = query.where(sql`${users.telegramId} IS NOT NULL`);
    }

    const result = await query;
    return result.map((r) => r.id);
  }

  const allUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`${users.telegramId} IS NOT NULL`);

  return allUsers.map((u) => u.id);
}

/**
 * POST /broadcasts/:id/send
 *
 * Отправляет рассылку всем получателям через Telegram бота прод-сервера.
 */
router.post("/broadcasts/:id/send", async (req: Request, res: Response) => {
  if (!verifyAdminSecret(req, res)) return;

  const broadcastId = parseInt(req.params.id);
  if (isNaN(broadcastId)) {
    return res.status(400).json({ error: "Invalid broadcast ID" });
  }

  try {
    // Получаем рассылку
    const [broadcast] = await db
      .select()
      .from(broadcasts)
      .where(eq(broadcasts.id, broadcastId))
      .limit(1);

    if (!broadcast) {
      return res.status(404).json({ error: "Broadcast not found" });
    }

    if (broadcast.status === "sending" || broadcast.status === "completed") {
      return res.status(409).json({ error: `Broadcast already ${broadcast.status}` });
    }

    // Обновляем статус на 'sending'
    await db
      .update(broadcasts)
      .set({ status: "sending", sentAt: new Date() })
      .where(eq(broadcasts.id, broadcastId));

    // Определяем получателей
    const recipientIds = await getBroadcastRecipientIds(broadcast);
    const totalRecipients = recipientIds.length;

    if (totalRecipients === 0) {
      await db
        .update(broadcasts)
        .set({ status: "completed", totalRecipients: 0 })
        .where(eq(broadcasts.id, broadcastId));

      return res.json({ success: true, totalRecipients: 0, sentCount: 0, failedCount: 0 });
    }

    // Получаем Telegram бота
    const bot = getTelegramBot();
    if (!bot) {
      await db
        .update(broadcasts)
        .set({ status: "cancelled" })
        .where(eq(broadcasts.id, broadcastId));
      return res.status(503).json({ error: "Telegram bot not initialized" });
    }

    // Получаем информацию о пользователях
    const usersList = await db
      .select({ id: users.id, telegramId: users.telegramId })
      .from(users)
      .where(inArray(users.id, recipientIds));

    // Создаем записи получателей
    const recipientRecords: InsertBroadcastRecipient[] = usersList.map((user) => ({
      broadcastId,
      userId: user.id,
      status: "pending" as const,
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
          .set({ status: "failed", errorMessage: "No Telegram ID" })
          .where(
            and(
              eq(broadcastRecipients.broadcastId, broadcastId),
              eq(broadcastRecipients.userId, user.id)
            )
          );
        continue;
      }

      try {
        await bot.sendMessage(user.telegramId, message, { parse_mode: "Markdown" });
        sentCount++;
        await db
          .update(broadcastRecipients)
          .set({ status: "sent", sentAt: new Date() })
          .where(
            and(
              eq(broadcastRecipients.broadcastId, broadcastId),
              eq(broadcastRecipients.userId, user.id)
            )
          );
      } catch (error: any) {
        failedCount++;
        logError("Failed to send broadcast message via bridge", error, {
          userId: user.id,
          broadcastId,
        });
        await db
          .update(broadcastRecipients)
          .set({ status: "failed", errorMessage: error.message || "Unknown error" })
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
      .set({ status: "completed", totalRecipients, sentCount, failedCount })
      .where(eq(broadcasts.id, broadcastId));

    logInfo("Broadcast sent via admin-bridge", { broadcastId, totalRecipients, sentCount, failedCount });

    res.json({ success: true, totalRecipients, sentCount, failedCount });
  } catch (error: any) {
    logError("Failed to send broadcast via admin-bridge", error, { broadcastId });

    await db
      .update(broadcasts)
      .set({ status: "cancelled" })
      .where(eq(broadcasts.id, broadcastId))
      .catch(() => {});

    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * POST /send-message
 *
 * Отправляет одно сообщение пользователю через Telegram.
 * Body: { userId: number, message: string }
 */
router.post("/send-message", async (req: Request, res: Response) => {
  if (!verifyAdminSecret(req, res)) return;

  const { userId, message } = req.body;

  if (!userId || typeof userId !== "number") {
    return res.status(400).json({ error: "userId is required (number)" });
  }
  if (!message || typeof message !== "string" || message.length === 0) {
    return res.status(400).json({ error: "message is required (string)" });
  }

  try {
    const bot = getTelegramBot();
    if (!bot) {
      return res.status(503).json({ error: "Telegram bot not initialized" });
    }

    // Получаем telegram_id пользователя
    const [user] = await db
      .select({ telegramId: users.telegramId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.telegramId) {
      return res.status(400).json({ error: "User has no Telegram ID" });
    }

    await bot.sendMessage(user.telegramId, message);

    logInfo("Message sent via admin-bridge", { userId });

    res.json({ success: true });
  } catch (error: any) {
    logError("Failed to send message via admin-bridge", error, { userId });

    if (error?.response?.body?.description) {
      return res.status(400).json({ error: `Telegram: ${error.response.body.description}` });
    }

    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;

/**
 * Support Tickets Routes (for iOS app)
 *
 * API тикетов поддержки для мобильного приложения.
 * Авторизация через JWT (withMobileAuth).
 *
 * Endpoints:
 * - POST   /tickets           — создать тикет (или вернуть существующий открытый)
 * - GET    /tickets           — список тикетов пользователя
 * - GET    /tickets/:id/messages — сообщения в тикете
 * - POST   /tickets/:id/messages — написать сообщение в тикет
 */

import { Router, Request, Response } from "express";
import { db } from "../db";
import { supportChats, supportMessages, adminUsers } from "@shared/schema";
import { eq, and, desc, or, inArray, sql } from "drizzle-orm";
import { withMobileAuth } from "../middleware/mobile-auth";
import { logInfo, logError } from "../lib/logger";

const router = Router();

/**
 * POST /tickets
 *
 * Создать тикет или вернуть существующий открытый.
 * Body: { subject?: string }
 */
router.post(
  "/tickets",
  withMobileAuth(async (req, res) => {
    try {
      const userId = req.user.id;
      const { subject } = req.body || {};

      // Проверяем, есть ли уже открытый/pending чат
      const [existingChat] = await db
        .select()
        .from(supportChats)
        .where(
          and(
            eq(supportChats.userId, userId),
            or(eq(supportChats.status, "open"), eq(supportChats.status, "pending"))
          )
        )
        .limit(1);

      if (existingChat) {
        return res.json(existingChat);
      }

      // Создаем новый чат
      const [newChat] = await db
        .insert(supportChats)
        .values({
          userId,
          status: "open",
          priority: "normal",
          subject: subject || null,
        })
        .returning();

      logInfo("Support ticket created via mobile", { chatId: newChat.id, userId });
      res.status(201).json(newChat);
    } catch (error: any) {
      logError("Failed to create support ticket", error);
      res.status(500).json({ error: "Failed to create ticket" });
    }
  })
);

/**
 * GET /tickets
 *
 * Список тикетов текущего пользователя.
 */
router.get(
  "/tickets",
  withMobileAuth(async (req, res) => {
    try {
      const userId = req.user.id;

      const tickets = await db
        .select()
        .from(supportChats)
        .where(eq(supportChats.userId, userId))
        .orderBy(desc(supportChats.updatedAt));

      res.json({ tickets });
    } catch (error: any) {
      logError("Failed to get support tickets", error);
      res.status(500).json({ error: "Failed to get tickets" });
    }
  })
);

/**
 * GET /tickets/:id/messages
 *
 * Сообщения в тикете. Проверяет что тикет принадлежит пользователю.
 */
router.get(
  "/tickets/:id/messages",
  withMobileAuth(async (req, res) => {
    try {
      const userId = req.user.id;
      const chatId = parseInt(req.params.id);
      if (isNaN(chatId)) {
        return res.status(400).json({ error: "Invalid ticket ID" });
      }

      // Проверяем владельца
      const [chat] = await db
        .select()
        .from(supportChats)
        .where(and(eq(supportChats.id, chatId), eq(supportChats.userId, userId)))
        .limit(1);

      if (!chat) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      // Получаем сообщения
      const messages = await db
        .select({
          id: supportMessages.id,
          chatId: supportMessages.chatId,
          senderType: supportMessages.senderType,
          senderId: supportMessages.senderId,
          message: supportMessages.message,
          isRead: supportMessages.isRead,
          createdAt: supportMessages.createdAt,
        })
        .from(supportMessages)
        .where(eq(supportMessages.chatId, chatId))
        .orderBy(supportMessages.createdAt);

      // Получаем имена админов для admin-сообщений
      const adminIds = messages
        .filter((m) => m.senderType === "admin" && m.senderId)
        .map((m) => m.senderId!);

      const adminsList =
        adminIds.length > 0
          ? await db
              .select({ id: adminUsers.id, email: adminUsers.email })
              .from(adminUsers)
              .where(inArray(adminUsers.id, adminIds))
          : [];

      const adminsMap = new Map(adminsList.map((a) => [a.id, a.email || "Support"]));

      const messagesWithNames = messages.map((msg) => ({
        ...msg,
        senderName:
          msg.senderType === "admin"
            ? adminsMap.get(msg.senderId!) || "Support"
            : req.user.name || "You",
      }));

      // Отмечаем admin-сообщения как прочитанные
      await db
        .update(supportMessages)
        .set({ isRead: true })
        .where(
          and(
            eq(supportMessages.chatId, chatId),
            eq(supportMessages.senderType, "admin"),
            eq(supportMessages.isRead, false)
          )
        );

      res.json({ messages: messagesWithNames });
    } catch (error: any) {
      logError("Failed to get ticket messages", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  })
);

/**
 * POST /tickets/:id/messages
 *
 * Написать сообщение в тикет от имени пользователя.
 * Body: { message: string }
 */
router.post(
  "/tickets/:id/messages",
  withMobileAuth(async (req, res) => {
    try {
      const userId = req.user.id;
      const chatId = parseInt(req.params.id);
      if (isNaN(chatId)) {
        return res.status(400).json({ error: "Invalid ticket ID" });
      }

      const { message } = req.body || {};
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ error: "Message is required" });
      }
      if (message.length > 4000) {
        return res.status(400).json({ error: "Message too long (max 4000 chars)" });
      }

      // Проверяем владельца
      const [chat] = await db
        .select()
        .from(supportChats)
        .where(and(eq(supportChats.id, chatId), eq(supportChats.userId, userId)))
        .limit(1);

      if (!chat) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      if (chat.status === "closed" || chat.status === "resolved") {
        return res.status(400).json({ error: "Ticket is closed" });
      }

      // Создаем сообщение
      const [newMessage] = await db
        .insert(supportMessages)
        .values({
          chatId,
          senderType: "user",
          senderId: userId,
          message: message.trim(),
          isRead: false,
        })
        .returning();

      // Обновляем lastMessageAt и ставим статус open если был pending
      const updateData: Record<string, any> = {
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      };
      if (chat.status === "pending") {
        updateData.status = "open";
      }

      await db
        .update(supportChats)
        .set(updateData)
        .where(eq(supportChats.id, chatId));

      logInfo("Support message sent via mobile", { chatId, userId, messageId: newMessage.id });

      res.status(201).json(newMessage);
    } catch (error: any) {
      logError("Failed to send support message", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  })
);

export default router;

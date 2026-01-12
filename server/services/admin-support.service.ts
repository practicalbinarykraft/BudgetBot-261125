/**
 * Admin Support Service
 * 
 * Junior-Friendly Guide:
 * =====================
 * Этот сервис предоставляет функционал для работы с поддержкой пользователей.
 * Админы могут общаться с пользователями через support чаты.
 * 
 * Использование:
 *   import { getSupportChats, getChatMessages, sendMessage, updateChatStatus } from './admin-support.service';
 */

import { db } from '../db';
import { supportChats, supportMessages, users, adminUsers } from '@shared/schema';
import { eq, and, desc, sql, or, isNull, inArray } from 'drizzle-orm';
import { getTelegramBot } from '../telegram/bot';
import { logError, logInfo } from '../lib/logger';
import type { InsertSupportChat, InsertSupportMessage } from '@shared/schema';

/**
 * Support Chat Status
 * 
 * Для джуна: Статусы чата:
 * - open: открыт, ожидает ответа
 * - pending: в ожидании
 * - resolved: решен
 * - closed: закрыт
 */

/**
 * Получить список чатов поддержки
 * 
 * Для джуна: Возвращает все чаты с фильтрацией по статусу и приоритету.
 */
export interface SupportChatsListParams {
  page?: number;
  limit?: number;
  status?: 'open' | 'closed' | 'pending' | 'resolved';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: number; // Admin ID
  unreadOnly?: boolean; // Только чаты с непрочитанными сообщениями
}

export interface SupportChatWithUser {
  id: number;
  userId: number;
  userName: string;
  userEmail: string | null;
  userTelegramId: string | null;
  status: string;
  priority: string;
  subject: string | null;
  assignedTo: number | null;
  assignedToName: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportChatsListResult {
  chats: SupportChatWithUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getSupportChatsList(
  params: SupportChatsListParams = {}
): Promise<SupportChatsListResult> {
  try {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    // Строим условие WHERE
    const conditions = [];
    if (params.status) {
      conditions.push(eq(supportChats.status, params.status));
    }
    if (params.priority) {
      conditions.push(eq(supportChats.priority, params.priority));
    }
    if (params.assignedTo) {
      conditions.push(eq(supportChats.assignedTo, params.assignedTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Получаем чаты с информацией о пользователе и админе
    const chatsQuery = db
      .select({
        id: supportChats.id,
        userId: supportChats.userId,
        userName: users.name,
        userEmail: users.email,
        userTelegramId: users.telegramId,
        status: supportChats.status,
        priority: supportChats.priority,
        subject: supportChats.subject,
        assignedTo: supportChats.assignedTo,
        assignedToName: adminUsers.email, // Используем email как имя админа
        lastMessageAt: supportChats.lastMessageAt,
        createdAt: supportChats.createdAt,
        updatedAt: supportChats.updatedAt,
      })
      .from(supportChats)
      .leftJoin(users, eq(supportChats.userId, users.id))
      .leftJoin(adminUsers, eq(supportChats.assignedTo, adminUsers.id))
      .where(whereClause)
      .orderBy(desc(supportChats.lastMessageAt), desc(supportChats.createdAt))
      .limit(limit)
      .offset(offset);

    const chats = await chatsQuery;

    // Получаем количество непрочитанных сообщений для каждого чата
    const chatIds = chats.map((c) => c.id);
    const unreadCounts = chatIds.length > 0
      ? await db
          .select({
            chatId: supportMessages.chatId,
            count: sql<number>`count(*)`,
          })
          .from(supportMessages)
          .where(
            and(
              inArray(supportMessages.chatId, chatIds),
              eq(supportMessages.isRead, false),
              eq(supportMessages.senderType, 'user') // Только сообщения от пользователей
            )
          )
          .groupBy(supportMessages.chatId)
      : [];

    const unreadMap = new Map(
      unreadCounts.map((u) => [u.chatId, Number(u.count)])
    );

    // Фильтруем по unreadOnly если нужно
    let filteredChats = chats;
    if (params.unreadOnly) {
      filteredChats = chats.filter((c) => (unreadMap.get(c.id) || 0) > 0);
    }

    // Добавляем unreadCount к каждому чату
    const chatsWithUnread: SupportChatWithUser[] = filteredChats.map((chat) => ({
      id: chat.id,
      userId: chat.userId,
      userName: chat.userName || 'Unknown',
      userEmail: chat.userEmail,
      userTelegramId: chat.userTelegramId,
      status: chat.status || 'open',
      priority: chat.priority || 'normal',
      subject: chat.subject,
      assignedTo: chat.assignedTo,
      assignedToName: chat.assignedToName,
      lastMessageAt: chat.lastMessageAt,
      unreadCount: unreadMap.get(chat.id) || 0,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    }));

    // Получаем общее количество
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(supportChats)
      .where(whereClause);

    const total = totalResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      chats: chatsWithUnread,
      total,
      page,
      limit,
      totalPages,
    };
  } catch (error) {
    logError('Failed to get support chats list', error as Error);
    throw error;
  }
}

/**
 * Получить сообщения чата
 * 
 * Для джуна: Возвращает все сообщения в чате с информацией об отправителе.
 */
export interface ChatMessageWithSender {
  id: number;
  chatId: number;
  senderType: 'user' | 'admin';
  senderId: number | null;
  senderName: string | null;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface ChatMessagesResult {
  messages: ChatMessageWithSender[];
  total: number;
}

export async function getChatMessages(
  chatId: number,
  limit: number = 100
): Promise<ChatMessagesResult> {
  try {
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
      .orderBy(desc(supportMessages.createdAt))
      .limit(limit);

    // Получаем информацию об отправителях
    const userIds = messages
      .filter((m) => m.senderType === 'user' && m.senderId)
      .map((m) => m.senderId!);
    const adminIds = messages
      .filter((m) => m.senderType === 'admin' && m.senderId)
      .map((m) => m.senderId!);

    const usersList =
      userIds.length > 0
        ? await db
            .select({ id: users.id, name: users.name })
            .from(users)
            .where(inArray(users.id, userIds))
        : [];

    const adminsList =
      adminIds.length > 0
        ? await db
            .select({ id: adminUsers.id, email: adminUsers.email })
            .from(adminUsers)
            .where(inArray(adminUsers.id, adminIds))
        : [];

    const usersMap = new Map(usersList.map((u) => [u.id, u.name]));
    const adminsMap = new Map(adminsList.map((a) => [a.id, a.email || 'Admin']));

    // Формируем результат с именами отправителей
    const messagesWithSenders: ChatMessageWithSender[] = messages.map((msg) => ({
      id: msg.id,
      chatId: msg.chatId,
      senderType: (msg.senderType === 'user' ? 'user' : 'admin') as 'user' | 'admin',
      senderId: msg.senderId,
      senderName:
        msg.senderType === 'user'
          ? usersMap.get(msg.senderId!) || 'User'
          : adminsMap.get(msg.senderId!) || 'Admin',
      message: msg.message,
      isRead: msg.isRead,
      createdAt: msg.createdAt,
    }));

    return {
      messages: messagesWithSenders.reverse(), // Переворачиваем для хронологического порядка
      total: messagesWithSenders.length,
    };
  } catch (error) {
    logError('Failed to get chat messages', error as Error);
    throw error;
  }
}

/**
 * Отправить сообщение в чат
 * 
 * Для джуна: Отправляет сообщение от админа в чат и уведомляет пользователя через Telegram.
 */
export async function sendSupportMessage(
  chatId: number,
  adminId: number,
  message: string
): Promise<typeof supportMessages.$inferSelect> {
  try {
    // Проверяем что чат существует
    const [chat] = await db
      .select()
      .from(supportChats)
      .where(eq(supportChats.id, chatId))
      .limit(1);

    if (!chat) {
      throw new Error('Chat not found');
    }

    // Создаем сообщение
    const [newMessage] = await db
      .insert(supportMessages)
      .values({
        chatId,
        senderType: 'admin',
        senderId: adminId,
        message,
        isRead: false,
      })
      .returning();

    // Обновляем lastMessageAt в чате
    await db
      .update(supportChats)
      .set({
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supportChats.id, chatId));

    // Отправляем уведомление пользователю через Telegram
    const [user] = await db
      .select({ telegramId: users.telegramId })
      .from(users)
      .where(eq(users.id, chat.userId))
      .limit(1);

    if (user?.telegramId) {
      const bot = getTelegramBot();
      if (bot) {
        try {
          const notificationMessage = `💬 *Новое сообщение от поддержки*\n\n${message}`;
          await bot.sendMessage(user.telegramId, notificationMessage, {
            parse_mode: 'Markdown',
          });
        } catch (error) {
          logError('Failed to send Telegram notification', error as Error, {
            chatId,
            userId: chat.userId,
          });
        }
      }
    }

    logInfo('Support message sent', { chatId, adminId, messageId: newMessage.id });
    return newMessage;
  } catch (error) {
    logError('Failed to send support message', error as Error);
    throw error;
  }
}

/**
 * Обновить статус чата
 * 
 * Для джуна: Изменяет статус чата (open, closed, pending, resolved) и приоритет.
 */
export async function updateChatStatus(
  chatId: number,
  updates: {
    status?: 'open' | 'closed' | 'pending' | 'resolved';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    assignedTo?: number | null;
    subject?: string | null;
  }
): Promise<typeof supportChats.$inferSelect> {
  try {
    const [updatedChat] = await db
      .update(supportChats)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(supportChats.id, chatId))
      .returning();

    if (!updatedChat) {
      throw new Error('Chat not found');
    }

    logInfo('Chat status updated', { chatId, updates });
    return updatedChat;
  } catch (error) {
    logError('Failed to update chat status', error as Error);
    throw error;
  }
}

/**
 * Отметить сообщения как прочитанные
 * 
 * Для джуна: Отмечает все сообщения от пользователя в чате как прочитанные.
 */
export async function markMessagesAsRead(chatId: number): Promise<void> {
  try {
    await db
      .update(supportMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(supportMessages.chatId, chatId),
          eq(supportMessages.senderType, 'user')
        )
      );

    logInfo('Messages marked as read', { chatId });
  } catch (error) {
    logError('Failed to mark messages as read', error as Error);
    throw error;
  }
}

/**
 * Создать новый чат поддержки
 * 
 * Для джуна: Создает новый чат поддержки для пользователя.
 * Обычно вызывается когда пользователь отправляет первое сообщение.
 */
export async function createSupportChat(
  userId: number,
  subject?: string
): Promise<typeof supportChats.$inferSelect> {
  try {
    // Проверяем, есть ли уже открытый чат для этого пользователя
    const [existingChat] = await db
      .select()
      .from(supportChats)
      .where(
        and(
          eq(supportChats.userId, userId),
          or(
            eq(supportChats.status, 'open'),
            eq(supportChats.status, 'pending')
          )
        )
      )
      .limit(1);

    if (existingChat) {
      return existingChat;
    }

    // Создаем новый чат
    const [newChat] = await db
      .insert(supportChats)
      .values({
        userId,
        status: 'open',
        priority: 'normal',
        subject: subject || null,
      })
      .returning();

    logInfo('Support chat created', { chatId: newChat.id, userId });
    return newChat;
  } catch (error) {
    logError('Failed to create support chat', error as Error);
    throw error;
  }
}


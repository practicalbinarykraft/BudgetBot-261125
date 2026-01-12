/**
 * Middleware для авторизации пользователей в Telegram боте
 *
 * Для джуна: Этот файл решает проблему повторяющегося кода
 * 1. Во многих хендлерах нужно получить пользователя из БД по telegramId
 * 2. Этот middleware делает это автоматически
 * 3. Если пользователь не найден — показывает ошибку
 *
 * @example
 * // Вместо:
 * const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
 * if (!user) { await bot.sendMessage(chatId, 'User not found'); return; }
 *
 * // Теперь можно:
 * await withUser(bot, msg, async (user) => {
 *   // user уже получен из БД
 * });
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../db';
import { users, type User } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getUserLanguageByTelegramId } from '../language';
import { t } from '@shared/i18n';

/**
 * Получить пользователя по Telegram ID
 *
 * Для джуна: Простая функция для получения пользователя из БД
 * Возвращает null если пользователь не найден
 */
export async function findUserByTelegramId(telegramId: string): Promise<User | null> {
  // Используем явное указание полей, исключая isBlocked, так как колонка может отсутствовать
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      password: users.password,
      name: users.name,
      telegramId: users.telegramId,
      telegramUsername: users.telegramUsername,
      telegramFirstName: users.telegramFirstName,
      telegramPhotoUrl: users.telegramPhotoUrl,
      twoFactorEnabled: users.twoFactorEnabled,
      twoFactorSecret: users.twoFactorSecret,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1);

  // Добавляем значение по умолчанию для isBlocked
  if (user) {
    return { ...user, isBlocked: false } as User;
  }
  return null;
}

/**
 * Тип хендлера с пользователем
 * Принимает bot, chatId и user — всё что нужно для работы
 */
export type UserHandler = (
  bot: TelegramBot,
  chatId: number,
  user: User
) => Promise<void>;

/**
 * Тип хендлера с пользователем для callback query
 */
export type UserCallbackHandler = (
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  user: User
) => Promise<void>;

/**
 * Middleware для обработки сообщений с авторизованным пользователем
 *
 * Для джуна: Оборачивает хендлер и автоматически:
 * 1. Получает telegramId из сообщения
 * 2. Ищет пользователя в БД
 * 3. Если найден — вызывает твой хендлер с user
 * 4. Если не найден — показывает ошибку
 *
 * @param bot - Экземпляр Telegram бота
 * @param msg - Сообщение от Telegram
 * @param handler - Твой хендлер, который получит user
 * @returns Promise<boolean> - true если пользователь найден и хендлер выполнен
 */
export async function withUser(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  handler: UserHandler
): Promise<boolean> {
  const telegramId = msg.from?.id.toString();
  if (!telegramId) return false;

  const user = await findUserByTelegramId(telegramId);

  if (!user) {
    const lang = await getUserLanguageByTelegramId(telegramId);
    await bot.sendMessage(
      msg.chat.id,
      t('error.not_connected', lang)
    );
    return false;
  }

  await handler(bot, msg.chat.id, user);
  return true;
}

/**
 * Middleware для обработки callback query с авторизованным пользователем
 *
 * Для джуна: То же самое что withUser, но для inline-кнопок
 *
 * @param bot - Экземпляр Telegram бота
 * @param query - Callback query от нажатия кнопки
 * @param handler - Твой хендлер
 * @returns Promise<boolean> - true если успешно
 */
export async function withUserCallback(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  handler: UserCallbackHandler
): Promise<boolean> {
  const telegramId = query.from.id.toString();
  const chatId = query.message?.chat.id;

  if (!chatId) return false;

  const user = await findUserByTelegramId(telegramId);

  if (!user) {
    const lang = await getUserLanguageByTelegramId(telegramId);
    const errorText = lang === 'ru'
      ? 'Пользователь не найден. Используй /verify для подключения.'
      : 'User not found. Use /verify to connect.';

    await bot.answerCallbackQuery(query.id, {
      text: errorText,
      show_alert: true
    });
    return false;
  }

  await handler(bot, query, user);
  return true;
}

/**
 * Получить chatId из callback query безопасно
 *
 * Для джуна: Хелпер для извлечения chatId из query
 */
export function getChatIdFromQuery(query: TelegramBot.CallbackQuery): number | null {
  return query.message?.chat.id || null;
}

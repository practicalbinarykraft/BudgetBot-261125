/**
 * /status Command Handler
 *
 * Показывает статус подключения Telegram аккаунта
 * Отображает имя пользователя, username и выбранный язык
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { t } from '@shared/i18n';
import { getUserLanguageByTelegramId, getUserLanguageByUserId } from '../language';
import { logError } from '../../lib/logger';

export async function handleStatusCommand(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  if (!telegramId) {
    await bot.sendMessage(chatId, t('verify.no_telegram_id', 'en'));
    return;
  }

  let lang = await getUserLanguageByTelegramId(telegramId);

  try {
    // Используем явное указание полей, исключая isBlocked
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        telegramId: users.telegramId,
        telegramUsername: users.telegramUsername,
      })
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (!user) {
      await bot.sendMessage(chatId, t('status.not_connected', lang), { parse_mode: 'Markdown' });
      return;
    }

    lang = await getUserLanguageByUserId(user.id);

    const languageDisplay = lang === 'en' ? 'English 🇬🇧' : 'Русский 🇷🇺';
    const username = user.telegramUsername || telegramId;

    const message = t('status.connected', lang)
      .replace('{name}', user.name)
      .replace('{username}', username)
      .replace('{language}', languageDisplay);

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    logError('Status command error:', error);
    const lang = await getUserLanguageByTelegramId(telegramId);
    await bot.sendMessage(chatId, t('error.generic', lang));
  }
}

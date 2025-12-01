/**
 * /start Command Handler
 *
 * Приветственная команда для Telegram бота
 * Показывает welcome message и главное меню для верифицированных пользователей
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getWelcomeMessage } from '@shared/i18n';
import { getUserLanguageByTelegramId } from '../language';

export async function handleStartCommand(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  const lang = telegramId ? await getUserLanguageByTelegramId(telegramId) : 'en';

  // ALWAYS send welcome message first (for both verified and unverified users)
  await bot.sendMessage(chatId, getWelcomeMessage(lang), { parse_mode: 'Markdown' });

  // Show main menu ONLY if user is already verified
  if (telegramId) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (user) {
      const { getMainMenuKeyboard, getMainMenuHint } = await import('../menu/keyboards');

      await bot.sendMessage(chatId, getMainMenuHint(lang), {
        parse_mode: 'Markdown',
        reply_markup: getMainMenuKeyboard()
      });
    }
  }
}

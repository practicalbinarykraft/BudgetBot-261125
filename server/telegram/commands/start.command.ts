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

  if (!telegramId) {
    await bot.sendMessage(chatId, getWelcomeMessage('en'), { parse_mode: 'Markdown' });
    return;
  }

  // Check if user exists
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1);

  // New user - show language selection
  if (!user) {
    await bot.sendMessage(
      chatId,
      '👋 Welcome to Budget Buddy!\nПриветствуем в Budget Buddy!\n\n🌍 Please select your language / Выберите ваш язык:',
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🇬🇧 English', callback_data: 'select_language:en' },
              { text: '🇷🇺 Русский', callback_data: 'select_language:ru' }
            ]
          ]
        }
      }
    );
    return;
  }

  // Existing user - show welcome and menu
  const lang = await getUserLanguageByTelegramId(telegramId);
  await bot.sendMessage(chatId, getWelcomeMessage(lang), { parse_mode: 'Markdown' });

  const { getMainMenuKeyboard, getMainMenuHint } = await import('../menu/keyboards');
  await bot.sendMessage(chatId, getMainMenuHint(lang), {
    parse_mode: 'Markdown',
    reply_markup: getMainMenuKeyboard()
  });
}

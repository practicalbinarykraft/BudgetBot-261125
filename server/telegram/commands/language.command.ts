/**
 * /language Command Handler
 *
 * Позволяет пользователю выбрать язык интерфейса
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { t } from '@shared/i18n';
import { getUserLanguageByTelegramId, getUserLanguageByUserId } from '../language';

export async function handleLanguageCommand(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  let lang = telegramId ? await getUserLanguageByTelegramId(telegramId) : 'en';

  if (!telegramId) {
    await bot.sendMessage(chatId, t('verify.no_telegram_id', lang));
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (!user) {
      await bot.sendMessage(chatId, t('verify.not_verified', lang), { parse_mode: 'Markdown' });
      return;
    }

    lang = await getUserLanguageByUserId(user.id);

    await bot.sendMessage(chatId, `${t('language.current', lang)}: ${t(`language.${lang}`, lang)}\n\n${t('language.choose', lang)}`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: t('language.en', lang), callback_data: 'set_language:en' },
            { text: t('language.ru', lang), callback_data: 'set_language:ru' }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Language command error:', error);
    await bot.sendMessage(chatId, t('error.generic', lang));
  }
}

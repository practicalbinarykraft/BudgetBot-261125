/**
 * /help Command Handler
 *
 * Показывает справку по командам бота
 */

import TelegramBot from 'node-telegram-bot-api';
import { getHelpMessage } from '@shared/i18n';
import { getUserLanguageByTelegramId } from '../language';

export async function handleHelpCommand(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  const lang = telegramId ? await getUserLanguageByTelegramId(telegramId) : 'en';

  await bot.sendMessage(chatId, getHelpMessage(lang), { parse_mode: 'Markdown' });
}

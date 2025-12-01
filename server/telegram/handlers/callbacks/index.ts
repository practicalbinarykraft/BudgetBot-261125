/**
 * Роутер callback-запросов
 *
 * Для джуна: Этот файл направляет callback к нужному хендлеру
 * 1. Получает data от нажатой кнопки
 * 2. По префиксу определяет категорию (settings:*, transactions:*, ai_chat:*)
 * 3. Вызывает соответствующий хендлер
 *
 * @example
 * // Кнопка с data="settings:language:ru"
 * // → handleSettingsCallback()
 *
 * // Кнопка с data="transactions:filter:income"
 * // → handleTransactionsCallback()
 */

import TelegramBot from 'node-telegram-bot-api';
import { type User } from '@shared/schema';
import { handleSettingsCallback } from './settings';
import { handleTransactionsCallback } from './transactions';
import { handleAiChatCallback } from './ai-chat';
import { handleCallbackQuery } from '../../commands/index';
import { handleCurrencyCallback } from '../../currency-command';
import { getMainMenuKeyboard, getMainMenuHint } from '../../menu/keyboards';
import { getUserLanguageByUserId } from '../../language';

/**
 * Обработать callback query
 *
 * Для джуна: Главная функция роутинга. Пробует каждый хендлер по очереди.
 * Если хендлер вернул true — callback обработан, выходим.
 * Если все вернули false — пробуем legacy хендлер.
 *
 * @param bot - Экземпляр бота
 * @param query - Callback query от Telegram
 * @param user - Авторизованный пользователь
 */
export async function routeCallback(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  user: User
): Promise<void> {
  const data = query.data;
  const chatId = query.message?.chat.id;

  if (!data || !chatId) return;

  // Главное меню (особый случай)
  if (data === 'main_menu') {
    const lang = await getUserLanguageByUserId(user.id);
    await bot.sendMessage(chatId, getMainMenuHint(lang), {
      parse_mode: 'Markdown',
      reply_markup: getMainMenuKeyboard()
    });
    await bot.answerCallbackQuery(query.id);
    return;
  }

  // Пробуем хендлеры по категориям
  // Порядок важен: сначала специфичные, потом общие

  // 1. AI Chat callbacks (ai_chat:*)
  if (await handleAiChatCallback(bot, query, user)) return;

  // 2. Settings callbacks (settings:*)
  if (await handleSettingsCallback(bot, query, user)) return;

  // 3. Transactions callbacks (transactions:*)
  if (await handleTransactionsCallback(bot, query, user)) return;

  // 4. Legacy currency callback (currency:*)
  if (data.startsWith('currency:')) {
    await handleCurrencyCallback(bot, query);
    return;
  }

  // 5. Fallback: legacy handler для остальных callbacks
  await handleCallbackQuery(bot, query);
}

/**
 * Экспорт отдельных хендлеров для тестирования
 */
export { handleSettingsCallback } from './settings';
export { handleTransactionsCallback } from './transactions';
export { handleAiChatCallback } from './ai-chat';

/**
 * Обработчики callback-кнопок AI чата
 *
 * Для джуна: Этот файл обрабатывает кнопки AI-ассистента:
 * - ai_chat:end → завершить сессию AI чата
 */

import TelegramBot from 'node-telegram-bot-api';
import { type User } from '@shared/schema';
import { endAiChat } from '../../menu/ai-chat-handler';

/**
 * Обработать callback AI чата
 *
 * Для джуна: Пока только одна кнопка — завершение чата
 * В будущем можно добавить:
 * - ai_chat:clear_history — очистить историю
 * - ai_chat:export — экспорт чата
 *
 * @returns true если callback обработан
 */
export async function handleAiChatCallback(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  user: User
): Promise<boolean> {
  const data = query.data;
  const chatId = query.message?.chat.id;

  if (!data || !chatId) return false;

  // Завершить AI чат
  if (data === 'ai_chat:end') {
    await endAiChat(bot, chatId, user.id);
    await bot.answerCallbackQuery(query.id);
    return true;
  }

  return false;
}

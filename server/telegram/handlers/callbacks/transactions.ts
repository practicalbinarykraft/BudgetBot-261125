/**
 * Обработчики callback-кнопок транзакций
 *
 * Для джуна: Этот файл обрабатывает фильтры транзакций:
 * - transactions:filter:all → показать все транзакции
 * - transactions:filter:income → только доходы
 * - transactions:filter:expense → только расходы
 */

import TelegramBot from 'node-telegram-bot-api';
import { type User } from '@shared/schema';
import { showTransactions } from '../../menu/transactions-handler';

/**
 * Тип фильтра транзакций
 */
type TransactionFilter = 'all' | 'income' | 'expense';

/**
 * Обработать callback транзакций
 *
 * Для джуна: Проверяет префикс и вызывает showTransactions с нужным фильтром
 *
 * @returns true если callback обработан
 */
export async function handleTransactionsCallback(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  user: User
): Promise<boolean> {
  const data = query.data;
  const chatId = query.message?.chat.id;

  if (!data || !chatId) return false;

  // Фильтр транзакций (transactions:filter:all)
  if (data.startsWith('transactions:filter:')) {
    const filter = data.split(':')[2] as TransactionFilter;
    await showTransactions(bot, chatId, user.id, filter);
    await bot.answerCallbackQuery(query.id);
    return true;
  }

  return false;
}

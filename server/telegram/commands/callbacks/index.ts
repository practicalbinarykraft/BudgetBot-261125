/**
 * Callback Query Router
 *
 * Главный обработчик callback queries
 * Маршрутизирует на один из специализированных обработчиков:
 * 1. Language callbacks - изменение языка
 * 2. Receipt callbacks - подтверждение/отмена чеков OCR
 * 3. Income callbacks - подтверждение/отмена доходов
 * 4. Transaction callbacks - удаление/редактирование транзакций
 */

import TelegramBot from 'node-telegram-bot-api';
import { getUserLanguageByTelegramId } from '../../language';
import { t } from '@shared/i18n';
import { handleLanguageCallback } from './language.callback';
import { handleReceiptCallback } from './receipt.callback';
import { handleIncomeCallback } from './income.callback';
import { handleTransactionCallback } from './transaction.callback';
import { logError } from '../../../lib/logger';

export async function handleCallbackQuery(bot: TelegramBot, query: TelegramBot.CallbackQuery) {
  const chatId = query.message?.chat.id;
  const telegramId = query.from.id.toString();

  if (!chatId || !query.data) {
    return;
  }

  try {
    // Route 1: Language callbacks
    if (query.data.startsWith('set_language:')) {
      await handleLanguageCallback(bot, query, telegramId, chatId);
      return;
    }

    // Route 2: Receipt callbacks
    if (query.data === 'cancel_receipt' || query.data.startsWith('confirm_receipt:')) {
      const handled = await handleReceiptCallback(bot, query, telegramId, chatId);
      if (handled) return;
    }

    // Route 3: Income callbacks
    if (query.data === 'cancel_income' || query.data.startsWith('confirm_income:')) {
      const handled = await handleIncomeCallback(bot, query, telegramId, chatId);
      if (handled) return;
    }

    // Route 4: Transaction callbacks (delete, edit, cancel)
    if (
      query.data.startsWith('delete_transaction:') ||
      query.data.startsWith('confirm_delete:') ||
      query.data.startsWith('cancel_delete:') ||
      query.data.startsWith('edit_transaction:') ||
      query.data === 'cancel_edit'
    ) {
      const handled = await handleTransactionCallback(bot, query, telegramId, chatId);
      if (handled) return;
    }

  } catch (error) {
    logError('Callback query handling error:', error);
    const lang = await getUserLanguageByTelegramId(telegramId);
    await bot.answerCallbackQuery(query.id, { text: t('error.generic', lang) });
  }
}

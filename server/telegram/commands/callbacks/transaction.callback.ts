/**
 * Transaction Callback Handler
 *
 * Обрабатывает callback для операций с транзакциями
 * - delete_transaction:id
 * - confirm_delete:id
 * - cancel_delete:id
 * - edit_transaction:id
 * - cancel_edit
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../../db';
import { users, transactions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { t } from '@shared/i18n';
import { getUserLanguageByTelegramId, getUserLanguageByUserId } from '../../language';
import { formatTransactionMessage } from '../utils/format-transaction-message';
import { pendingEdits } from '../../pending-edits';
import { deleteTransactionAndReverseBalance } from '../../../services/transaction-delete.service';

export async function handleTransactionCallback(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  telegramId: string,
  chatId: number
): Promise<boolean> {
  let lang = await getUserLanguageByTelegramId(telegramId);

  // Handle delete_transaction - Show confirmation
  if (query.data?.startsWith('delete_transaction:')) {
    const transactionId = parseInt(query.data.substring('delete_transaction:'.length));

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (!user) {
      await bot.answerCallbackQuery(query.id, { text: t('error.user_not_found', lang) });
      return true;
    }

    lang = await getUserLanguageByUserId(user.id);

    await bot.editMessageText(t('transaction.delete_confirm', lang), {
      chat_id: chatId,
      message_id: query.message?.message_id,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: t('transaction.delete_yes', lang), callback_data: `confirm_delete:${transactionId}` },
            { text: t('transaction.delete_no', lang), callback_data: `cancel_delete:${transactionId}` }
          ]
        ]
      }
    });

    await bot.answerCallbackQuery(query.id);
    return true;
  }

  // Handle confirm_delete - Actually delete transaction
  if (query.data?.startsWith('confirm_delete:')) {
    const transactionId = parseInt(query.data.substring('confirm_delete:'.length));

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (!user) {
      await bot.answerCallbackQuery(query.id, { text: t('error.user_not_found', lang) });
      return true;
    }

    lang = await getUserLanguageByUserId(user.id);

    await deleteTransactionAndReverseBalance({
      transactionId,
      userId: user.id,
    });

    await bot.editMessageText(t('transaction.deleted', lang), {
      chat_id: chatId,
      message_id: query.message?.message_id,
    });

    await bot.answerCallbackQuery(query.id, { text: t('transaction.deleted', lang) });
    return true;
  }

  // Handle cancel_delete - Remove confirmation message
  if (query.data?.startsWith('cancel_delete:')) {
    await bot.deleteMessage(chatId, query.message?.message_id || 0);
    await bot.answerCallbackQuery(query.id);
    return true;
  }

  // Handle edit_transaction - Start edit flow
  if (query.data?.startsWith('edit_transaction:')) {
    const transactionId = parseInt(query.data.substring('edit_transaction:'.length));

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (!user) {
      await bot.answerCallbackQuery(query.id, { text: t('error.user_not_found', lang) });
      return true;
    }

    lang = await getUserLanguageByUserId(user.id);

    // Get transaction
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.id, transactionId),
        eq(transactions.userId, user.id)
      ))
      .limit(1);

    if (!transaction) {
      await bot.answerCallbackQuery(query.id, { text: t('error.generic', lang) });
      return true;
    }

    // Store pending edit
    pendingEdits.store(telegramId, {
      transactionId,
      userId: user.id,
      oldTransaction: {
        amount: transaction.amount,
        amountUsd: transaction.amountUsd || '0',
        currency: transaction.currency || 'USD',
        type: transaction.type as 'income' | 'expense',
        walletId: transaction.walletId,
        originalAmount: transaction.originalAmount || transaction.amount,
        exchangeRate: transaction.exchangeRate || '1',
      },
      chatId,
      messageId: query.message?.message_id || 0,
    });

    // Send edit prompt - use original amount/currency that user entered
    const promptMessage = t('transaction.edit_prompt', lang)
      .replace('{amount}', transaction.originalAmount || transaction.amount)
      .replace('{currency}', transaction.originalCurrency || transaction.currency || 'USD')
      .replace('{description}', transaction.description || 'N/A');

    await bot.editMessageText(promptMessage, {
      chat_id: chatId,
      message_id: query.message?.message_id,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: t('transaction.delete_no', lang), callback_data: 'cancel_edit' }
          ]
        ]
      }
    });

    await bot.answerCallbackQuery(query.id);
    return true;
  }

  // Handle cancel_edit - Restore original message
  if (query.data === 'cancel_edit') {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (!user) {
      await bot.answerCallbackQuery(query.id, { text: t('error.user_not_found', lang) });
      return true;
    }

    lang = await getUserLanguageByUserId(user.id);

    // Get pending edit before deleting it
    const pendingEdit = pendingEdits.get(telegramId);

    if (!pendingEdit) {
      await bot.editMessageText(t('transaction.edit_cancelled', lang), {
        chat_id: chatId,
        message_id: query.message?.message_id,
      });
      await bot.answerCallbackQuery(query.id);
      return true;
    }

    const transactionId = pendingEdit.transactionId;
    pendingEdits.delete(telegramId);

    // Get transaction to restore original message with buttons
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.id, transactionId),
        eq(transactions.userId, user.id)
      ))
      .limit(1);

    if (!transaction) {
      await bot.editMessageText(t('transaction.edit_cancelled', lang), {
        chat_id: chatId,
        message_id: query.message?.message_id,
      });
      await bot.answerCallbackQuery(query.id);
      return true;
    }

    // Restore original transaction message with buttons
    const amount = parseFloat(transaction.originalAmount || transaction.amount);
    const currency = (transaction.originalCurrency || transaction.currency || 'USD') as 'USD' | 'RUB' | 'IDR';
    const amountUsd = parseFloat(transaction.amountUsd || '0');

    const { message, reply_markup } = await formatTransactionMessage(
      user.id,
      transaction.id,
      amount,
      currency,
      amountUsd,
      transaction.description || '',
      transaction.categoryId,
      transaction.type as 'income' | 'expense',
      lang
    );

    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: query.message?.message_id,
      parse_mode: 'Markdown',
      reply_markup
    });

    await bot.answerCallbackQuery(query.id, { text: t('transaction.edit_cancelled', lang) });
    return true;
  }

  return false;
}

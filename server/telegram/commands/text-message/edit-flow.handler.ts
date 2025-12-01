/**
 * Edit Flow Handler
 *
 * Обрабатывает редактирование существующей транзакции
 * Валидирует старые данные, обновляет транзакцию и баланс кошелька
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../../db';
import { transactions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { parseTransactionText } from '../../parser';
import { t, type Language } from '@shared/i18n';
import { convertToUSD, getUserExchangeRates } from '../../../services/currency-service';
import { resolveCategoryId } from '../../../services/category-resolution.service';
import { updateWalletBalance } from '../../../services/wallet.service';
import { pendingEdits } from '../../pending-edits';
import { formatTransactionMessage } from '../utils/format-transaction-message';

export async function handleEditFlow(
  bot: TelegramBot,
  chatId: number,
  telegramId: string,
  text: string,
  userId: number,
  defaultCurrency: 'USD' | 'RUB' | 'IDR',
  lang: Language
): Promise<boolean> {
  const pendingEdit = pendingEdits.get(telegramId);

  if (!pendingEdit) {
    return false; // Not an edit flow
  }

  const parsed = parseTransactionText(text, defaultCurrency);

  if (!parsed) {
    await bot.sendMessage(chatId, t('transaction.parse_error', lang), {
      parse_mode: 'Markdown'
    });
    return true; // Handled (even if error)
  }

  // Get user's exchange rates
  const rates = await getUserExchangeRates(userId);
  const newAmountUsd = convertToUSD(parsed.amount, parsed.currency, rates);
  const newExchangeRate = parsed.currency === 'USD' ? 1 : rates[parsed.currency] || 1;

  // Resolve category
  const categoryId = await resolveCategoryId(userId, parsed.category);

  // CRITICAL: Validate old USD amount BEFORE updating transaction
  // This prevents data corruption if validation fails after DB update
  let oldAmountUsd: number | null = null;

  if (pendingEdit.oldTransaction.walletId) {
    // Strategy 1: Recalculate from originalAmount and exchangeRate (most accurate)
    if (pendingEdit.oldTransaction.originalAmount && pendingEdit.oldTransaction.exchangeRate) {
      const oldOriginalAmount = parseFloat(pendingEdit.oldTransaction.originalAmount);
      const oldExchangeRate = parseFloat(pendingEdit.oldTransaction.exchangeRate);

      if (!isNaN(oldOriginalAmount) && !isNaN(oldExchangeRate) && oldExchangeRate > 0) {
        oldAmountUsd = pendingEdit.oldTransaction.currency === 'USD'
          ? oldOriginalAmount
          : oldOriginalAmount / oldExchangeRate;
      }
    }

    // Strategy 2: Use stored amountUsd (legacy transactions)
    if (oldAmountUsd === null && pendingEdit.oldTransaction.amountUsd) {
      const parsedUsd = parseFloat(pendingEdit.oldTransaction.amountUsd);
      if (!isNaN(parsedUsd) && parsedUsd > 0) {
        oldAmountUsd = parsedUsd;
      }
    }

    // Strategy 3: Fallback to amount (assume USD if no conversion data)
    if (oldAmountUsd === null && pendingEdit.oldTransaction.amount) {
      const parsedAmount = parseFloat(pendingEdit.oldTransaction.amount);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        oldAmountUsd = parsedAmount;
      }
    }

    // Abort edit if we cannot safely calculate old USD amount
    if (oldAmountUsd === null || isNaN(oldAmountUsd) || !isFinite(oldAmountUsd)) {
      console.error('Cannot calculate old USD amount for transaction:', pendingEdit.transactionId);
      pendingEdits.delete(telegramId);
      await bot.sendMessage(chatId, t('error.transaction', lang));
      return true;
    }
  }

  // Update transaction in database (only after validation passes)
  await db
    .update(transactions)
    .set({
      type: parsed.type,
      amount: parsed.amount.toString(),
      description: parsed.description,
      categoryId,
      currency: parsed.currency,
      amountUsd: newAmountUsd.toFixed(2),
      originalAmount: parsed.amount.toString(),
      originalCurrency: parsed.currency,
      exchangeRate: newExchangeRate.toFixed(4),
    })
    .where(and(
      eq(transactions.id, pendingEdit.transactionId),
      eq(transactions.userId, userId)
    ));

  // Update wallet balance: reverse old transaction, apply new one
  // Note: walletId is not changed during Telegram edit - transaction stays in same wallet
  // This is intentional as Telegram parser doesn't support wallet selection
  if (pendingEdit.oldTransaction.walletId && oldAmountUsd !== null) {
    const walletId = pendingEdit.oldTransaction.walletId;

    // Reverse old transaction effect (use old type and validated old amount)
    const reverseType = pendingEdit.oldTransaction.type === 'income' ? 'expense' : 'income';
    await updateWalletBalance(walletId, userId, oldAmountUsd, reverseType);

    // Apply new transaction effect (use new type and new amount from parsed input)
    await updateWalletBalance(walletId, userId, newAmountUsd, parsed.type);
  }

  // Clear pending edit
  pendingEdits.delete(telegramId);

  // Send success message with transaction details
  const { message, reply_markup } = await formatTransactionMessage(
    userId,
    pendingEdit.transactionId,
    parsed.amount,
    parsed.currency,
    newAmountUsd,
    parsed.description,
    categoryId,
    parsed.type,
    lang
  );

  await bot.editMessageText(message, {
    chat_id: pendingEdit.chatId,
    message_id: pendingEdit.messageId,
    parse_mode: 'Markdown',
    reply_markup
  });

  await bot.sendMessage(chatId, t('transaction.edit_success', lang));
  return true; // Handled successfully
}

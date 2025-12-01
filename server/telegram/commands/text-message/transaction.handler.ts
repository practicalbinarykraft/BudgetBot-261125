/**
 * Normal Transaction Handler
 *
 * Обрабатывает обычную транзакцию из текстового сообщения
 * Парсит текст, создает транзакцию и обновляет баланс
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../../db';
import { transactions } from '@shared/schema';
import { format } from 'date-fns';
import { parseTransactionText } from '../../parser';
import { t, type Language } from '@shared/i18n';
import { convertToUSD, getUserExchangeRates } from '../../../services/currency-service';
import { resolveCategoryId } from '../../../services/category-resolution.service';
import { getPrimaryWallet, updateWalletBalance } from '../../../services/wallet.service';
import { formatTransactionMessage } from '../utils/format-transaction-message';

export async function handleNormalTransaction(
  bot: TelegramBot,
  chatId: number,
  text: string,
  userId: number,
  defaultCurrency: 'USD' | 'RUB' | 'IDR',
  lang: Language
): Promise<void> {
  const trimmedText = text.trim();

  // NORMAL TRANSACTION: Pre-parse validation for better error messages
  // Check 1: Empty text
  if (trimmedText.length === 0) {
    await bot.sendMessage(chatId, t('transaction.parse_error_empty', lang), {
      parse_mode: 'Markdown'
    });
    return;
  }

  // Check 2: No amount found
  const amountRegex = /(\d+(?:[.,]\d+)?)/;
  if (!amountRegex.test(trimmedText)) {
    await bot.sendMessage(chatId, t('transaction.parse_error_no_amount', lang), {
      parse_mode: 'Markdown'
    });
    return;
  }

  const parsed = parseTransactionText(text, defaultCurrency);

  // Check 3: Invalid amount (negative or zero)
  if (!parsed) {
    await bot.sendMessage(chatId, t('transaction.parse_error_invalid_amount', lang), {
      parse_mode: 'Markdown'
    });
    return;
  }

  // Resolve category using category resolution service
  const categoryId = await resolveCategoryId(userId, parsed.category);

  // Get primary wallet for transaction
  const primaryWallet = await getPrimaryWallet(userId);

  // Get user's custom exchange rates
  const rates = await getUserExchangeRates(userId);
  const amountUsd = convertToUSD(parsed.amount, parsed.currency, rates);
  const exchangeRate = parsed.currency === 'USD' ? 1 : rates[parsed.currency] || 1;

  const [transaction] = await db
    .insert(transactions)
    .values({
      userId,
      date: format(new Date(), 'yyyy-MM-dd'),
      type: parsed.type,
      amount: parsed.amount.toString(),
      description: parsed.description,
      categoryId,
      currency: parsed.currency,
      amountUsd: amountUsd.toFixed(2),
      originalAmount: parsed.amount.toString(),
      originalCurrency: parsed.currency,
      exchangeRate: exchangeRate.toFixed(4),
      source: 'telegram',
      walletId: primaryWallet.id,
    })
    .returning();

  // Update wallet balance
  await updateWalletBalance(
    primaryWallet.id,
    userId,
    amountUsd,
    parsed.type
  );

  const { message, reply_markup } = await formatTransactionMessage(
    userId,
    transaction.id,
    parsed.amount,
    parsed.currency,
    amountUsd,
    parsed.description,
    categoryId,
    parsed.type,
    lang
  );

  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup
  });
}

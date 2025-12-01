/**
 * Income Callback Handler
 *
 * Обрабатывает callback для подтверждения/отмены доходов
 * - confirm_income:jsonData
 * - cancel_income
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../../db';
import { users, transactions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { t } from '@shared/i18n';
import { getUserLanguageByTelegramId, getUserLanguageByUserId } from '../../language';
import { convertToUSD, getUserExchangeRates } from '../../../services/currency-service';
import { getPrimaryWallet, updateWalletBalance } from '../../../services/wallet.service';
import { formatTransactionMessage } from '../utils/format-transaction-message';

export async function handleIncomeCallback(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  telegramId: string,
  chatId: number
): Promise<boolean> {
  let lang = await getUserLanguageByTelegramId(telegramId);

  // Handle cancel_income
  if (query.data === 'cancel_income') {
    await bot.editMessageText(t('income.cancelled', lang), {
      chat_id: chatId,
      message_id: query.message?.message_id,
    });
    await bot.answerCallbackQuery(query.id);
    return true;
  }

  // Handle confirm_income
  if (query.data?.startsWith('confirm_income:')) {
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

    const dataStr = query.data.substring('confirm_income:'.length);
    const { parsed, categoryId, userId } = JSON.parse(dataStr);

    // Get primary wallet for transaction
    const primaryWallet = await getPrimaryWallet(user.id);

    // Recalculate with fresh user rates
    const rates = await getUserExchangeRates(user.id);
    const amountUsd = convertToUSD(parsed.amount, parsed.currency, rates);
    const exchangeRate = parsed.currency === 'USD' ? 1 : rates[parsed.currency] || 1;

    const [transaction] = await db
      .insert(transactions)
      .values({
        userId: user.id,
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'income',
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
      user.id,
      amountUsd,
      'income'
    );

    const { message, reply_markup } = await formatTransactionMessage(
      user.id,
      transaction.id,
      parsed.amount,
      parsed.currency,
      amountUsd,
      parsed.description,
      categoryId,
      'income',
      lang
    );

    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: query.message?.message_id,
      parse_mode: 'Markdown',
      reply_markup
    });

    await bot.answerCallbackQuery(query.id, { text: t('transaction.income_added', lang) });
    return true;
  }

  return false;
}

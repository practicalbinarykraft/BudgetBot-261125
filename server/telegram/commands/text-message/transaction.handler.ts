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
import { logInfo, logError, logWarning } from '../../../lib/logger';

export async function handleNormalTransaction(
  bot: TelegramBot,
  chatId: number,
  text: string,
  userId: number,
  defaultCurrency: 'USD' | 'RUB' | 'IDR',
  lang: Language
): Promise<void> {
  logInfo('Processing normal transaction', { userId, text, defaultCurrency, lang, chatId });
  
  try {
    const trimmedText = text.trim();

    // NORMAL TRANSACTION: Pre-parse validation for better error messages
    // Check 1: Empty text
    if (trimmedText.length === 0) {
      logInfo('Transaction parse error: empty text', { userId, text });
      await bot.sendMessage(chatId, t('transaction.parse_error_empty', lang), {
        parse_mode: 'Markdown'
      });
      return;
    }

    // Check 2: No amount found
    const amountRegex = /(\d+(?:[.,]\d+)?)/;
    if (!amountRegex.test(trimmedText)) {
      logInfo('Transaction parse error: no amount found', { userId, text });
      await bot.sendMessage(chatId, t('transaction.parse_error_no_amount', lang), {
        parse_mode: 'Markdown'
      });
      return;
    }

    logInfo('Parsing transaction text', { userId, text, defaultCurrency });
    const parsed = parseTransactionText(text, defaultCurrency);
    logInfo('Transaction parsed', { userId, parsed: parsed ? {
      amount: parsed.amount,
      currency: parsed.currency,
      description: parsed.description,
      category: parsed.category,
      type: parsed.type,
    } : null });

    // Check 3: Invalid amount (negative or zero)
    if (!parsed) {
      logInfo('Transaction parse error: invalid amount', { userId, text });
      await bot.sendMessage(chatId, t('transaction.parse_error_invalid_amount', lang), {
        parse_mode: 'Markdown'
      });
      return;
    }

    // Resolve category using category resolution service
    logInfo('Resolving category', { userId, category: parsed.category });
    let categoryId: number | null;
    try {
      categoryId = await resolveCategoryId(userId, parsed.category);
      logInfo('Category resolved', { userId, categoryId, category: parsed.category });
    } catch (error) {
      logError('Error resolving category', error as Error, { userId, category: parsed.category });
      categoryId = null; // Продолжаем без категории
    }

    // Get primary wallet for transaction
    logInfo('Getting primary wallet', { userId });
    let primaryWallet;
    try {
      primaryWallet = await getPrimaryWallet(userId);
      const balanceUsd = parseFloat(primaryWallet.balanceUsd || '0');
      const balance = parseFloat(primaryWallet.balance || '0');
      logInfo('Primary wallet retrieved', { 
        userId, 
        walletId: primaryWallet.id, 
        walletName: primaryWallet.name,
        balance: balance,
        balanceUsd: balanceUsd,
        currency: primaryWallet.currency,
        isPrimary: primaryWallet.isPrimary
      });
      
      // Warn if wallet has zero balance
      if (balanceUsd === 0) {
        logWarning('Primary wallet has zero balance', {
          userId,
          walletId: primaryWallet.id,
          walletName: primaryWallet.name,
        });
      }
    } catch (error) {
      logError('Error getting primary wallet', error as Error, { userId });
      throw new Error('Failed to get wallet for transaction');
    }

    // Get user's custom exchange rates
    logInfo('Getting exchange rates', { userId, currency: parsed.currency });
    let rates: Record<string, number>;
    try {
      rates = await getUserExchangeRates(userId);
      logInfo('Exchange rates retrieved', { userId, currency: parsed.currency, rate: rates[parsed.currency] || 1 });
    } catch (error) {
      logError('Error getting exchange rates', error as Error, { userId, currency: parsed.currency });
      // Используем fallback rates
      rates = { USD: 1, RUB: 92.5, IDR: 15750, EUR: 0.92 };
      logInfo('Using fallback exchange rates', { userId, currency: parsed.currency });
    }
    
    let amountUsd: number;
    let exchangeRate: number;
    try {
      amountUsd = convertToUSD(parsed.amount, parsed.currency, rates);
      exchangeRate = parsed.currency === 'USD' ? 1 : rates[parsed.currency] || 1;
      logInfo('Amount converted to USD', { userId, originalAmount: parsed.amount, originalCurrency: parsed.currency, amountUsd, exchangeRate });
    } catch (error) {
      logError('Error converting to USD', error as Error, { userId, amount: parsed.amount, currency: parsed.currency });
      throw new Error('Failed to convert amount to USD');
    }

    // Create transaction
    logInfo('Creating transaction in database', { userId, amount: parsed.amount, currency: parsed.currency, amountUsd });
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

    logInfo('Transaction created successfully', { userId, transactionId: transaction.id });

    // Update wallet balance
    logInfo('Updating wallet balance', { userId, walletId: primaryWallet.id, amountUsd, type: parsed.type });
    try {
      await updateWalletBalance(
        primaryWallet.id,
        userId,
        amountUsd,
        parsed.type
      );
      logInfo('Wallet balance updated', { userId, walletId: primaryWallet.id });
    } catch (error) {
      logError('Error updating wallet balance', error as Error, {
        userId,
        walletId: primaryWallet.id,
        amountUsd,
        type: parsed.type,
      });
      // Если ошибка "Insufficient balance", пробрасываем её дальше
      if (error instanceof Error && error.message.includes('Insufficient balance')) {
        throw error;
      }
      // Для других ошибок тоже пробрасываем
      throw new Error('Failed to update wallet balance');
    }

    // Format and send confirmation message
    logInfo('Formatting transaction message', { userId, transactionId: transaction.id });
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

    logInfo('Sending transaction confirmation', { userId, transactionId: transaction.id, chatId });
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup
    });
    
    logInfo('Transaction processed successfully', { userId, transactionId: transaction.id });
  } catch (error) {
    logError('Error in handleNormalTransaction', error as Error, {
      userId,
      text,
      defaultCurrency,
      lang,
      chatId,
    });
    throw error; // Пробросить дальше для обработки в index.ts
  }
}

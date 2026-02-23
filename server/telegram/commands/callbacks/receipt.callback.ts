/**
 * Receipt Callback Handler
 *
 * Обрабатывает callback для подтверждения/отмены чеков OCR
 * - confirm_receipt:receiptId
 * - cancel_receipt
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { t } from '@shared/i18n';
import { getUserLanguageByTelegramId, getUserLanguageByUserId } from '../../language';
import { convertToUSD, getUserExchangeRates } from '../../../services/currency-service';
import { resolveCategoryId } from '../../../services/category-resolution.service';
import { getPrimaryWallet } from '../../../services/wallet.service';
import { createTransactionAtomic } from '../../../services/transaction-create-atomic.service';
import { ReceiptItemsRepository } from '../../../repositories/receipt-items.repository';
import { formatTransactionMessage } from '../utils/format-transaction-message';
import { pendingReceipts } from '../../pending-receipts';
import { processReceiptItems } from '../../../services/product-catalog.service';
import { storage } from '../../../storage';
import { logInfo, logError } from '../../../lib/logger';

export async function handleReceiptCallback(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  telegramId: string,
  chatId: number
): Promise<boolean> {
  let lang = await getUserLanguageByTelegramId(telegramId);

  // Handle cancel_receipt
  if (query.data === 'cancel_receipt') {
    await bot.editMessageText(t('receipt.cancelled', lang), {
      chat_id: chatId,
      message_id: query.message?.message_id,
    });
    await bot.answerCallbackQuery(query.id);
    return true;
  }

  // Handle confirm_receipt
  if (query.data?.startsWith('confirm_receipt:')) {
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

    const receiptId = query.data.substring('confirm_receipt:'.length);
    const receiptData = pendingReceipts.get(receiptId);

    if (!receiptData) {
      await bot.answerCallbackQuery(query.id, { text: t('receipt.expired', lang) });
      return true;
    }

    // Security: Verify receipt belongs to this user
    if (receiptData.userId !== user.id) {
      pendingReceipts.delete(receiptId);
      await bot.answerCallbackQuery(query.id, { text: t('receipt.expired', lang) });
      return true;
    }

    const { parsed, categoryId } = receiptData;
    pendingReceipts.delete(receiptId);

    // Get primary wallet for transaction
    const primaryWallet = await getPrimaryWallet(user.id);

    // Recalculate with fresh user rates
    const rates = await getUserExchangeRates(user.id);

    // Ensure currency is set (fallback to USD if OCR didn't extract)
    const currency = parsed.currency || 'USD';
    const amountUsd = convertToUSD(parsed.amount, currency, rates);
    const exchangeRate = currency === 'USD' ? 1 : rates[currency] || 1;

    // Capture items array once (for type narrowing inside closures)
    const receiptItems = ('items' in parsed && parsed.items && parsed.items.length > 0)
      ? parsed.items
      : null;

    // Atomic: insert transaction + receipt items + update wallet balance
    const transaction = await createTransactionAtomic({
      data: {
        userId: user.id,
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'expense',
        amount: parsed.amount.toString(),
        description: parsed.description,
        categoryId,
        currency: currency,
        amountUsd: amountUsd.toFixed(2),
        originalAmount: parsed.amount.toString(),
        originalCurrency: currency,
        exchangeRate: exchangeRate.toFixed(4),
        source: 'ocr',
        walletId: primaryWallet.id,
      },
      type: 'expense',
      withinTx: receiptItems ? async (transactionId, tx) => {
        const receiptItemsRepo = new ReceiptItemsRepository();
        const itemsToSave = receiptItems.map((item: any) => {
          const itemTotalUsd = convertToUSD(
            parseFloat(item.totalPrice),
            currency,
            rates
          );
          return {
            transactionId,
            itemName: item.name,
            normalizedName: item.normalizedName,
            quantity: item.quantity?.toString(),
            pricePerUnit: item.pricePerUnit.toString(),
            totalPrice: item.totalPrice.toString(),
            currency: currency,
            merchantName: parsed.description,
            amountUsd: itemTotalUsd.toFixed(2),
          };
        });
        await receiptItemsRepo.createBulk(itemsToSave, tx);
        logInfo(`Saved ${itemsToSave.length} receipt items in tx for transaction ${transactionId}`);
      } : undefined,
    });

    // Side effect: Add items to Product Catalog (outside tx — failure is non-critical)
    if (receiptItems) {
      try {
        const userSettings = await storage.getSettingsByUserId(user.id);
        const purchaseDate = ('date' in parsed && typeof parsed.date === 'string')
          ? parsed.date
          : format(new Date(), 'yyyy-MM-dd');

        const getItemCurrency = (item: any): string => {
          return item.currency || parsed.currency || 'USD';
        };

        await processReceiptItems({
          receiptItems: receiptItems.map((item: any) => {
            const itemTotalPrice = typeof item.totalPrice === 'number'
              ? item.totalPrice
              : (parseFloat(item.totalPrice) || 0);

            return {
              name: item.name || item.normalizedName || 'Unknown',
              price: itemTotalPrice,
              currency: getItemCurrency(item),
              quantity: item.quantity || 1
            };
          }),
          userId: user.id,
          storeName: parsed.description || 'Unknown Store',
          purchaseDate,
          exchangeRates: rates,
          anthropicApiKey: userSettings?.anthropicApiKey || undefined
        });

        logInfo(`Product catalog updated from Telegram receipt (user ${user.id}, ${receiptItems.length} items)`);
      } catch (error) {
        logError('Failed to update product catalog from Telegram:', error);
      }
    }

    const { message, reply_markup } = await formatTransactionMessage(
      user.id,
      transaction.id,
      parsed.amount,
      currency,
      amountUsd,
      parsed.description,
      categoryId,
      'expense',
      lang,
      'items' in parsed ? parsed.items : undefined  // Pass receipt items
    );

    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: query.message?.message_id,
      parse_mode: 'Markdown',
      reply_markup
    });

    await bot.answerCallbackQuery(query.id, { text: t('receipt.added', lang) });
    return true;
  }

  return false;
}

/**
 * Receipt Callback Handler
 *
 * Обрабатывает callback для подтверждения/отмены чеков OCR
 * - confirm_receipt:receiptId
 * - cancel_receipt
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../../db';
import { users, transactions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { t } from '@shared/i18n';
import { getUserLanguageByTelegramId, getUserLanguageByUserId } from '../../language';
import { convertToUSD, getUserExchangeRates } from '../../../services/currency-service';
import { resolveCategoryId } from '../../../services/category-resolution.service';
import { getPrimaryWallet, updateWalletBalance } from '../../../services/wallet.service';
import { ReceiptItemsRepository } from '../../../repositories/receipt-items.repository';
import { formatTransactionMessage } from '../utils/format-transaction-message';
import { pendingReceipts } from '../../pending-receipts';
import { processReceiptItems } from '../../../services/product-catalog.service';
import { storage } from '../../../storage';

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

    const [transaction] = await db
      .insert(transactions)
      .values({
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
      })
      .returning();

    // Save receipt items if available (with USD conversion for analytics)
    if ('items' in parsed && parsed.items && parsed.items.length > 0) {
      try {
        const receiptItemsRepo = new ReceiptItemsRepository();
        const itemsToSave = parsed.items.map((item: any) => {
          // Convert item total price to USD
          const itemTotalUsd = convertToUSD(
            parseFloat(item.totalPrice),
            currency,
            rates
          );

          return {
            transactionId: transaction.id,
            itemName: item.name,
            normalizedName: item.normalizedName,
            quantity: item.quantity?.toString(),
            pricePerUnit: item.pricePerUnit.toString(),
            totalPrice: item.totalPrice.toString(),
            currency: currency,
            merchantName: parsed.description,
            amountUsd: itemTotalUsd.toFixed(2)  // USD conversion for analytics
          };
        });

        await receiptItemsRepo.createBulk(itemsToSave);
        console.log(`✅ Saved ${itemsToSave.length} items from receipt for transaction ${transaction.id}`);
      } catch (error) {
        console.error('Failed to save receipt items:', error);
        // Don't fail the transaction if items fail to save
      }
    }

    // Add items to Product Catalog
    if ('items' in parsed && parsed.items && parsed.items.length > 0) {
      try {
        const userSettings = await storage.getSettingsByUserId(user.id);
        const purchaseDate = ('date' in parsed && typeof parsed.date === 'string')
          ? parsed.date
          : format(new Date(), 'yyyy-MM-dd');

        // Per-item currency resolution (matches web upload logic)
        const getItemCurrency = (item: any): string => {
          return item.currency       // 1. Per-item currency (future mixed-currency)
            || parsed.currency       // 2. Receipt-level currency (from OCR)
            || 'USD';                // 3. Fallback
        };

        // Передать товары с исходной валютой (НЕ конвертировать в USD!)
        await processReceiptItems({
          receiptItems: parsed.items.map((item: any) => {
            const itemTotalPrice = typeof item.totalPrice === 'number'
              ? item.totalPrice
              : (parseFloat(item.totalPrice) || 0);

            return {
              name: item.name || item.normalizedName || 'Unknown',
              price: itemTotalPrice,       // ИСХОДНАЯ цена из чека
              currency: getItemCurrency(item), // Per-item currency с приоритетом
              quantity: item.quantity || 1
            };
          }),
          userId: user.id,
          storeName: parsed.description || 'Unknown Store',
          purchaseDate,
          exchangeRates: rates, // Передать курсы для конвертации в сервисе
          anthropicApiKey: userSettings?.anthropicApiKey || undefined
        });

        console.log(`✅ Product catalog updated from Telegram receipt (user ${user.id}, ${parsed.items.length} items, currency: ${parsed.currency})`);
      } catch (error) {
        console.error('❌ Failed to update product catalog from Telegram:', error);
        // Don't fail the transaction if catalog update fails
      }
    }

    // Update wallet balance
    await updateWalletBalance(
      primaryWallet.id,
      user.id,
      amountUsd,
      'expense'
    );

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

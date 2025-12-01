/**
 * Shopping List Handler
 *
 * Обрабатывает список покупок из текстового сообщения
 * Создает транзакцию и сохраняет товары в receipt_items
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../../db';
import { transactions } from '@shared/schema';
import { format } from 'date-fns';
import { isShoppingList, parseShoppingList } from '../../shopping-list-parser';
import { type Language } from '@shared/i18n';
import { convertToUSD, getUserExchangeRates } from '../../../services/currency-service';
import { resolveCategoryId } from '../../../services/category-resolution.service';
import { getPrimaryWallet, updateWalletBalance } from '../../../services/wallet.service';
import { ReceiptItemsRepository } from '../../../repositories/receipt-items.repository';
import { formatTransactionMessage } from '../utils/format-transaction-message';

export async function handleShoppingList(
  bot: TelegramBot,
  chatId: number,
  text: string,
  userId: number,
  defaultCurrency: 'USD' | 'RUB' | 'IDR',
  lang: Language
): Promise<boolean> {
  const trimmedText = text.trim();

  if (!isShoppingList(trimmedText)) {
    return false; // Not a shopping list
  }

  const shoppingList = parseShoppingList(trimmedText, defaultCurrency);

  if (!shoppingList) {
    return false; // Parse failed
  }

  // Get primary wallet
  const primaryWallet = await getPrimaryWallet(userId);

  // Get exchange rates
  const rates = await getUserExchangeRates(userId);
  const amountUsd = convertToUSD(shoppingList.total, shoppingList.currency, rates);
  const exchangeRate = shoppingList.currency === 'USD' ? 1 : rates[shoppingList.currency] || 1;

  // Resolve category (use merchant name or default)
  const categoryId = await resolveCategoryId(userId, shoppingList.merchant);

  // Create transaction
  const [transaction] = await db
    .insert(transactions)
    .values({
      userId,
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'expense',
      amount: shoppingList.total.toString(),
      description: shoppingList.merchant,
      categoryId,
      currency: shoppingList.currency,
      amountUsd: amountUsd.toFixed(2),
      originalAmount: shoppingList.total.toString(),
      originalCurrency: shoppingList.currency,
      exchangeRate: exchangeRate.toFixed(4),
      source: 'telegram',
      walletId: primaryWallet.id,
    })
    .returning();

  // Save receipt items with USD conversion
  if (shoppingList.items.length > 0) {
    try {
      const receiptItemsRepo = new ReceiptItemsRepository();
      const itemsToSave = shoppingList.items.map(item => {
        // Convert item price to USD
        const itemUsd = convertToUSD(item.price, shoppingList.currency, rates);

        return {
          transactionId: transaction.id,
          itemName: item.name,
          normalizedName: item.normalizedName,
          quantity: '1',
          pricePerUnit: item.price.toString(),
          totalPrice: item.price.toString(),
          currency: shoppingList.currency,
          merchantName: shoppingList.merchant,
          amountUsd: itemUsd.toFixed(2)  // USD conversion for analytics
        };
      });

      await receiptItemsRepo.createBulk(itemsToSave);
      console.log(`✅ Saved ${itemsToSave.length} items from shopping list for transaction ${transaction.id}`);
    } catch (error) {
      console.error('Failed to save shopping list items:', error);
    }
  }

  // Update wallet balance
  await updateWalletBalance(
    primaryWallet.id,
    userId,
    amountUsd,
    'expense'
  );

  // Format response message
  const { message, reply_markup } = await formatTransactionMessage(
    userId,
    transaction.id,
    shoppingList.total,
    shoppingList.currency,
    amountUsd,
    shoppingList.merchant,
    categoryId,
    'expense',
    lang,
    shoppingList.items  // Pass items to show in message
  );

  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup
  });

  return true; // Handled successfully
}

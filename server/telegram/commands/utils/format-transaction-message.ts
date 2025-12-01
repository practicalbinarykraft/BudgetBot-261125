/**
 * Format Transaction Message Utility
 *
 * Форматирует сообщение о транзакции для Telegram бота
 * Включает информацию о бюджете, валюте, товарах из чека
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../../db';
import { wallets, categories, budgets, transactions } from '@shared/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { formatCurrency } from '../../parser';
import { t, type Language } from '@shared/i18n';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export async function formatTransactionMessage(
  userId: number,
  transactionId: number,
  amount: number,
  currency: string,
  amountUsd: number,
  description: string,
  categoryId: number | null,
  type: 'income' | 'expense',
  lang: Language,
  items?: any[]  // Receipt items (optional)
): Promise<{ message: string; reply_markup?: TelegramBot.InlineKeyboardMarkup }> {
  const userWallets = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId));

  const totalCapital = userWallets.reduce(
    (sum, w) => sum + parseFloat(w.balanceUsd as unknown as string || "0"),
    0
  );

  // Guard against division by zero
  const exchangeRate = currency === 'USD' ? 1 : (amountUsd > 0 ? (amount / amountUsd) : 1);

  let budgetInfo = '';
  let categoryName = t('transaction.no_category', lang);

  // Load category by ID if provided
  if (categoryId) {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(
        eq(categories.userId, userId),
        eq(categories.id, categoryId)
      ))
      .limit(1);

    if (category) {
      categoryName = category.name;

      const today = new Date();
      const budgetList = await db
        .select()
        .from(budgets)
        .where(and(
          eq(budgets.userId, userId),
          eq(budgets.categoryId, category.id)
        ));

      for (const budget of budgetList) {
        let startDate: Date, endDate: Date;

        if (budget.period === 'week') {
          startDate = startOfWeek(today, { weekStartsOn: 1 });
          endDate = endOfWeek(today, { weekStartsOn: 1 });
        } else if (budget.period === 'month') {
          startDate = startOfMonth(today);
          endDate = endOfMonth(today);
        } else {
          startDate = startOfYear(today);
          endDate = endOfYear(today);
        }

        const startStr = format(startDate, 'yyyy-MM-dd');
        const endStr = format(endDate, 'yyyy-MM-dd');

        const [result] = await db
          .select({
            total: sql<string>`COALESCE(SUM(CAST(${transactions.amountUsd} AS DECIMAL)), 0)`
          })
          .from(transactions)
          .where(and(
            eq(transactions.userId, userId),
            eq(transactions.categoryId, category.id),
            eq(transactions.type, 'expense'),
            gte(transactions.date, startStr),
            lte(transactions.date, endStr)
          ));

        const spent = parseFloat(result?.total || '0');
        const limit = parseFloat(budget.limitAmount);

        budgetInfo = `\n${t('transaction.budget_limit', lang)}: $${spent.toFixed(0)}/$${limit.toFixed(0)}`;
        break;
      }
    }
  }

  const typeLabel = type === 'income'
    ? t('transaction.income_added', lang)
    : t('transaction.expense_added', lang);

  let message = `${typeLabel}\n\n`;
  message += `${t('transaction.description', lang)}: ${description}\n`;
  message += `${t('transaction.category', lang)}: ${categoryName}\n`;
  message += `${t('transaction.amount', lang)}: ${formatCurrency(amount, currency)}\n`;

  // Show conversion only if we have valid USD amount
  if (currency !== 'USD' && amountUsd > 0) {
    message += `\n${t('transaction.conversion', lang)}: 1 USD = ${exchangeRate.toFixed(2)} ${currency}\n`;
    message += `${t('transaction.usd_amount', lang)}: ~$${amountUsd.toFixed(0)}`;
  }

  // Show capital change
  const delta = type === 'expense' ? -amountUsd : amountUsd;
  const deltaSign = delta > 0 ? '+' : '';
  message += `\n\n${t('transaction.total_capital', lang)}: $${totalCapital.toFixed(0)} (${deltaSign}$${delta.toFixed(0)})`;

  if (budgetInfo) {
    message += budgetInfo;
  }

  // Add receipt items if available
  if (items && items.length > 0) {
    message += '\n\n🛒 ' + (lang === 'ru' ? 'Товары' : 'Items') + ':\n';

    const displayItems = items.slice(0, 5);
    for (const item of displayItems) {
      const price = parseFloat(item.totalPrice || item.pricePerUnit || 0);
      // Use per-item currency if available (future mixed-currency receipts)
      const itemCurrency = item.currency || currency;
      message += `• ${item.name} - ${formatCurrency(price, itemCurrency)}\n`;
    }

    if (items.length > 5) {
      const remaining = items.length - 5;
      const andMore = lang === 'ru' ? `... и ещё ${remaining}` : `... and ${remaining} more`;
      message += andMore + '\n';
    }
  }

  const reply_markup: TelegramBot.InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: t('transaction.edit_button', lang), callback_data: `edit_transaction:${transactionId}` },
        { text: t('transaction.delete_button', lang), callback_data: `delete_transaction:${transactionId}` }
      ]
    ]
  };

  return { message, reply_markup };
}

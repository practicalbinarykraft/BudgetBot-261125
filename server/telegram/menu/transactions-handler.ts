/**
 * Transactions Handler
 * Показ последних транзакций с фильтрами в Telegram боте
 * 
 * Junior-Friendly: <200 строк, работа с транзакциями
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../db';
import { transactions, categories, wallets } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getTransactionsFiltersKeyboard } from './keyboards';
import { getUserLanguageByUserId } from '../language';
import { format } from 'date-fns';

/**
 * Показать раздел транзакций
 */
export async function showTransactions(
  bot: TelegramBot,
  chatId: number,
  userId: number,
  filter: 'all' | 'expense' | 'income' = 'all'
): Promise<void> {
  const lang = await getUserLanguageByUserId(userId);
  
  try {
    // Получить последние транзакции (20 штук) с фильтром
    const conditions = [eq(transactions.userId, userId)];
    
    if (filter === 'expense') {
      conditions.push(eq(transactions.type, 'expense'));
    } else if (filter === 'income') {
      conditions.push(eq(transactions.type, 'income'));
    }
    
    const userTransactions = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        currency: transactions.currency,
        amountUsd: transactions.amountUsd,
        type: transactions.type,
        description: transactions.description,
        date: transactions.date,
        categoryId: transactions.categoryId,
        walletId: transactions.walletId,
      })
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date))
      .limit(20);
    
    if (userTransactions.length === 0) {
      const message = lang === 'ru'
        ? '💸 *Транзакций не найдено*\n\n' +
          'Добавь первую транзакцию: просто напиши `кофе 100 рублей`'
        : '💸 *No transactions found*\n\n' +
          'Add first transaction: just write `coffee 100 rubles`';
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: getTransactionsFiltersKeyboard(filter, lang)
      });
      return;
    }
    
    // Получить категории и кошельки одним запросом
    const [userCategories, userWallets] = await Promise.all([
      db.select().from(categories).where(eq(categories.userId, userId)),
      db.select().from(wallets).where(eq(wallets.userId, userId))
    ]);
    
    const categoriesMap = new Map(userCategories.map(c => [c.id, c.name]));
    const walletsMap = new Map(userWallets.map(w => [w.id, w.name]));
    
    // Заголовок с фильтром
    const filterLabels = lang === 'ru'
      ? { all: 'Все транзакции', expense: 'Расходы', income: 'Доходы' }
      : { all: 'All transactions', expense: 'Expenses', income: 'Income' };
    
    const header = lang === 'ru'
      ? `💰 *${filterLabels[filter]}*\n\nПоказаны последние ${userTransactions.length} операций:`
      : `💰 *${filterLabels[filter]}*\n\nShowing last ${userTransactions.length} transactions:`;
    
    await bot.sendMessage(chatId, header, {
      parse_mode: 'Markdown'
    });
    
    // Отправить каждую транзакцию отдельным сообщением
    for (const tx of userTransactions) {
      const amount = parseFloat(tx.amount || '0');
      const amountUsd = parseFloat(tx.amountUsd || '0');
      const currency = tx.currency || 'USD';
      
      const emoji = tx.type === 'expense' ? '📤' : '📥';
      const sign = tx.type === 'expense' ? '-' : '+';
      
      const categoryName = tx.categoryId 
        ? categoriesMap.get(tx.categoryId) || '?'
        : (lang === 'ru' ? 'Без категории' : 'No category');
      
      const walletName = tx.walletId
        ? walletsMap.get(tx.walletId) || '?'
        : (lang === 'ru' ? 'Без кошелька' : 'No wallet');
      
      const dateStr = format(new Date(tx.date), 'dd.MM.yyyy');
      
      const message = lang === 'ru'
        ? `${emoji} *${tx.description}*\n\n` +
          `💵 Сумма: ${sign}${amount.toFixed(2)} ${currency}\n` +
          `💲 USD: ${sign}$${amountUsd.toFixed(2)}\n` +
          `📁 ${categoryName}\n` +
          `💳 ${walletName}\n` +
          `📅 ${dateStr}`
        : `${emoji} *${tx.description}*\n\n` +
          `💵 Amount: ${sign}${amount.toFixed(2)} ${currency}\n` +
          `💲 USD: ${sign}$${amountUsd.toFixed(2)}\n` +
          `📁 ${categoryName}\n` +
          `💳 ${walletName}\n` +
          `📅 ${dateStr}`;
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown'
      });
    }
    
    // Футер с кнопками фильтров
    const footer = lang === 'ru'
      ? `✅ Показаны последние ${userTransactions.length} операций`
      : `✅ Last ${userTransactions.length} transactions shown`;
    
    await bot.sendMessage(chatId, footer, {
      reply_markup: getTransactionsFiltersKeyboard(filter, lang)
    });
    
  } catch (error) {
    console.error('Transactions display error:', error);
    
    const errorMessage = lang === 'ru'
      ? '❌ Ошибка при загрузке транзакций'
      : '❌ Error loading transactions';
    
    await bot.sendMessage(chatId, errorMessage, {
      reply_markup: getTransactionsFiltersKeyboard(filter, lang)
    });
  }
}

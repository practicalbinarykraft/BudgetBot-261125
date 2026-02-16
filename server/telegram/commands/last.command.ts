/**
 * /last Command Handler
 *
 * Показывает последние 5 транзакций пользователя
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../db';
import { users, transactions } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { formatCurrency } from '../parser';
import { t } from '@shared/i18n';
import { getUserLanguageByTelegramId, getUserLanguageByUserId } from '../language';
import { format } from 'date-fns';
import { logError } from '../../lib/logger';

export async function handleLastCommand(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  if (!telegramId) {
    await bot.sendMessage(chatId, t('verify.no_telegram_id', 'en'));
    return;
  }

  let lang = await getUserLanguageByTelegramId(telegramId);

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (!user) {
      await bot.sendMessage(chatId, t('verify.not_verified', lang), { parse_mode: 'Markdown' });
      return;
    }

    lang = await getUserLanguageByUserId(user.id);

    const userTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, user.id))
      .orderBy(sql`${transactions.date} DESC, ${transactions.id} DESC`)
      .limit(5);

    if (userTransactions.length === 0) {
      await bot.sendMessage(chatId, t('last.no_transactions', lang), {
        parse_mode: 'Markdown'
      });
      return;
    }

    let message = `${t('last.title', lang)}\n\n`;

    for (const tx of userTransactions) {
      const typeText = tx.type === 'income' ? t('last.income', lang) : t('last.expense', lang);
      const formattedDate = format(new Date(tx.date), 'MMM dd');
      const amount = formatCurrency(parseFloat(tx.originalAmount || tx.amount), (tx.originalCurrency || tx.currency) as 'USD' | 'RUB' | 'IDR');

      message += `${typeText}\n`;
      message += `📅 ${formattedDate} • ${tx.description}\n`;
      message += `💵 ${amount}\n\n`;
    }

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    logError('Last command error:', error);
    const lang = await getUserLanguageByTelegramId(telegramId);
    await bot.sendMessage(chatId, t('error.generic', lang));
  }
}

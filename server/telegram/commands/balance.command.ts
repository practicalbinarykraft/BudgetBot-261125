/**
 * /balance Command Handler
 *
 * Показывает баланс всех кошельков пользователя
 * Отображает баланс в оригинальной валюте и общую сумму в USD
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../db';
import { users, wallets } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { formatCurrency } from '../parser';
import { t } from '@shared/i18n';
import { getUserLanguageByTelegramId, getUserLanguageByUserId } from '../language';
import { logError } from '../../lib/logger';

export async function handleBalanceCommand(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  let lang = telegramId ? await getUserLanguageByTelegramId(telegramId) : 'en';

  if (!telegramId) {
    await bot.sendMessage(chatId, t('verify.no_telegram_id', lang));
    return;
  }

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

    const userWallets = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, user.id));

    if (userWallets.length === 0) {
      await bot.sendMessage(chatId, `${t('balance.title', lang)}\n\n${t('balance.no_wallets', lang)}`, {
        parse_mode: 'Markdown'
      });
      return;
    }

    let message = `${t('balance.title', lang)}\n\n`;
    let totalUSD = 0;

    for (const wallet of userWallets) {
      const balance = parseFloat(wallet.balance);
      const currency = wallet.currency || 'USD';
      message += `📊 *${wallet.name}*\n`;
      message += `   ${formatCurrency(balance, currency as any)}\n\n`;

      totalUSD += parseFloat(wallet.balanceUsd || '0');
    }

    message += `\n${t('balance.total', lang)} $${totalUSD.toFixed(2)}`;

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    logError('Balance command error:', error);
    const lang = await getUserLanguageByTelegramId(telegramId);
    await bot.sendMessage(chatId, t('error.balance', lang));
  }
}

/**
 * Wallets Handler
 * Показ списка кошельков с балансами в Telegram боте
 * 
 * Junior-Friendly: <200 строк, работа с кошельками
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../db';
import { wallets } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getWalletsKeyboard } from './keyboards';
import { getUserLanguageByUserId } from '../language';

/**
 * Показать раздел кошельков
 */
export async function showWallets(
  bot: TelegramBot,
  chatId: number,
  userId: number
): Promise<void> {
  const lang = await getUserLanguageByUserId(userId);
  
  try {
    // Получить все кошельки пользователя
    const userWallets = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .orderBy(wallets.isPrimary); // Основной кошелёк первым
    
    if (userWallets.length === 0) {
      const message = lang === 'ru'
        ? '💳 *У тебя пока нет кошельков*\n\n' +
          'Создай первый кошелёк в веб-приложении!'
        : '💳 *You have no wallets yet*\n\n' +
          'Create your first wallet in the web app!';
      
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: getWalletsKeyboard(lang)
      });
      return;
    }
    
    // Подсчитать общий баланс
    const totalBalance = userWallets.reduce((sum, wallet) => {
      return sum + (parseFloat(wallet.balanceUsd || '0'));
    }, 0);
    
    // Первое сообщение: общий баланс + объяснение
    const introMessage = lang === 'ru'
      ? `💳 *Твои кошельки*\n\n` +
        `💰 Общий баланс: *$${totalBalance.toFixed(2)}*\n\n` +
        `📊 У тебя ${userWallets.length} ${getWalletWord(userWallets.length, lang)}`
      : `💳 *Your Wallets*\n\n` +
        `💰 Total balance: *$${totalBalance.toFixed(2)}*\n\n` +
        `📊 You have ${userWallets.length} wallet${userWallets.length > 1 ? 's' : ''}`;
    
    await bot.sendMessage(chatId, introMessage, {
      parse_mode: 'Markdown'
    });
    
    // Отправить каждый кошелёк отдельным сообщением
    for (const wallet of userWallets) {
      const balance = parseFloat(wallet.balance || '0');
      const balanceUsd = parseFloat(wallet.balanceUsd || '0');
      const currency = wallet.currency || 'USD';
      
      const isPrimaryBadge = wallet.isPrimary 
        ? (lang === 'ru' ? '⭐ Основной' : '⭐ Primary')
        : '';
      
      const walletMessage = lang === 'ru'
        ? `🏦 *${wallet.name}* ${isPrimaryBadge}\n\n` +
          `💵 Баланс: *${balance.toFixed(2)} ${currency}*\n` +
          `💲 В долларах: $${balanceUsd.toFixed(2)}`
        : `🏦 *${wallet.name}* ${isPrimaryBadge}\n\n` +
          `💵 Balance: *${balance.toFixed(2)} ${currency}*\n` +
          `💲 In USD: $${balanceUsd.toFixed(2)}`;
      
      await bot.sendMessage(chatId, walletMessage, {
        parse_mode: 'Markdown'
      });
    }
    
    // Финальное сообщение с кнопкой возврата
    const footer = lang === 'ru'
      ? '✅ Все кошельки показаны'
      : '✅ All wallets shown';
    
    await bot.sendMessage(chatId, footer, {
      reply_markup: getWalletsKeyboard(lang)
    });
    
  } catch (error) {
    console.error('Wallets display error:', error);
    
    const errorMessage = lang === 'ru'
      ? '❌ Ошибка при загрузке кошельков'
      : '❌ Error loading wallets';
    
    await bot.sendMessage(chatId, errorMessage, {
      reply_markup: getWalletsKeyboard(lang)
    });
  }
}

/**
 * Склонение слова "кошелёк" в зависимости от количества
 */
function getWalletWord(count: number, lang: 'en' | 'ru'): string {
  if (lang === 'en') {
    return count === 1 ? 'wallet' : 'wallets';
  }
  
  // Русские склонения
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'кошельков';
  }
  
  if (lastDigit === 1) {
    return 'кошелёк';
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'кошелька';
  }
  
  return 'кошельков';
}

/**
 * /income Command Handler
 *
 * Обрабатывает команду добавления дохода
 * Парсит текст и показывает подтверждение перед созданием транзакции
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../db';
import { users, settings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { parseTransactionText, formatCurrency } from '../parser';
import { t } from '@shared/i18n';
import { getUserLanguageByTelegramId, getUserLanguageByUserId } from '../language';
import { convertToUSD, getUserExchangeRates } from '../../services/currency-service';
import { resolveCategoryId } from '../../services/category-resolution.service';

export async function handleIncomeCommand(bot: TelegramBot, msg: TelegramBot.Message, text: string) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  if (!telegramId) {
    await bot.sendMessage(chatId, t('verify.no_telegram_id', 'en'));
    return;
  }

  let lang = await getUserLanguageByTelegramId(telegramId);

  if (!text || text.trim().length === 0) {
    await bot.sendMessage(chatId, t('income.usage', lang), { parse_mode: 'Markdown' });
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

    // Get user's default currency from settings
    const [userSettings] = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, user.id))
      .limit(1);

    const defaultCurrency = (userSettings?.currency || 'USD') as 'USD' | 'RUB' | 'IDR';

    const parsed = parseTransactionText(text, defaultCurrency);

    if (!parsed) {
      await bot.sendMessage(chatId, t('income.usage', lang), { parse_mode: 'Markdown' });
      return;
    }

    parsed.type = 'income';

    // Resolve category using category resolution service
    const categoryId = await resolveCategoryId(user.id, parsed.category);

    // Get user's custom exchange rates
    const rates = await getUserExchangeRates(user.id);
    const amountUsd = convertToUSD(parsed.amount, parsed.currency, rates);

    const dataPayload = {
      parsed,
      categoryId,
      amountUsd,
      userId: user.id // Pass userId to recalculate in callback
    };

    await bot.sendMessage(
      chatId,
      `💰 *${t('transaction.income', lang)}*\n\n` +
      `${t('transaction.amount', lang)}: ${formatCurrency(parsed.amount, parsed.currency)}\n` +
      `${t('transaction.description', lang)}: ${parsed.description}\n` +
      `${t('transaction.category', lang)}: ${parsed.category}\n\n` +
      `${t('income.confirm_question', lang)}`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: t('income.confirm_button', lang), callback_data: `confirm_income:${JSON.stringify(dataPayload)}` },
            { text: t('income.cancel_button', lang), callback_data: 'cancel_income' }
          ]]
        }
      }
    );
  } catch (error) {
    console.error('Income command error:', error);
    const lang = await getUserLanguageByTelegramId(telegramId);
    await bot.sendMessage(chatId, t('error.generic', lang));
  }
}

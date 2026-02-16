/**
 * /verify Command Handler
 *
 * Обрабатывает верификацию Telegram аккаунта через код
 * Связывает Telegram ID с аккаунтом пользователя
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../db';
import { users, telegramVerificationCodes } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { t } from '@shared/i18n';
import { getUserLanguageByTelegramId } from '../language';
import { logError } from '../../lib/logger';

export async function handleVerifyCommand(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  code: string
) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  const telegramUsername = msg.from?.username || null;

  // Try to get user's language (fallback to 'en' if not possible yet)
  let lang = telegramId ? await getUserLanguageByTelegramId(telegramId) : 'en';

  if (!telegramId) {
    await bot.sendMessage(chatId, t('verify.no_telegram_id', lang));
    return;
  }

  if (!code || code.length !== 6) {
    await bot.sendMessage(chatId, t('verify.invalid_format', lang), {
      parse_mode: 'Markdown'
    });
    return;
  }

  try {
    const [verificationRecord] = await db
      .select()
      .from(telegramVerificationCodes)
      .where(
        and(
          eq(telegramVerificationCodes.code, code),
          eq(telegramVerificationCodes.isUsed, false),
          sql`${telegramVerificationCodes.expiresAt} > NOW()`
        )
      )
      .limit(1);

    if (!verificationRecord) {
      await bot.sendMessage(chatId, t('verify.invalid_code', lang));
      return;
    }

    await db
      .update(users)
      .set({
        telegramId,
        telegramUsername,
      })
      .where(eq(users.id, verificationRecord.userId));

    await db
      .update(telegramVerificationCodes)
      .set({ isUsed: true })
      .where(eq(telegramVerificationCodes.id, verificationRecord.id));

    // Re-fetch settings after connection to get user's preferred language
    lang = await getUserLanguageByTelegramId(telegramId);

    await bot.sendMessage(chatId, t('verify.success', lang), { parse_mode: 'Markdown' });

    // Показать главное меню после успешной верификации
    const { getMainMenuKeyboard, getMainMenuHint } = await import('../menu/keyboards');

    await bot.sendMessage(chatId, getMainMenuHint(lang), {
      parse_mode: 'Markdown',
      reply_markup: getMainMenuKeyboard()
    });
  } catch (error) {
    logError('Verification error:', error);
    await bot.sendMessage(chatId, t('error.generic', lang));
  }
}

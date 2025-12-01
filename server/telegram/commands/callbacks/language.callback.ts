/**
 * Language Callback Handler
 *
 * Обрабатывает callback для изменения языка
 * - set_language:en
 * - set_language:ru
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../../db';
import { users, settings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { t, type Language } from '@shared/i18n';
import { getUserLanguageByTelegramId, getUserLanguageByUserId } from '../../language';

export async function handleLanguageCallback(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  telegramId: string,
  chatId: number
): Promise<void> {
  let lang = await getUserLanguageByTelegramId(telegramId);

  if (!query.data?.startsWith('set_language:')) {
    return;
  }

  const newLang = query.data.substring('set_language:'.length) as Language;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1);

  if (!user) {
    await bot.answerCallbackQuery(query.id, { text: t('error.user_not_found', lang) });
    return;
  }

  lang = await getUserLanguageByUserId(user.id);

  // Check if settings exist, create if not
  const [existingSettings] = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, user.id))
    .limit(1);

  if (existingSettings) {
    await db
      .update(settings)
      .set({ language: newLang })
      .where(eq(settings.userId, user.id));
  } else {
    await db
      .insert(settings)
      .values({
        userId: user.id,
        language: newLang,
      });
  }

  await bot.editMessageText(t('language.changed', newLang), {
    chat_id: chatId,
    message_id: query.message?.message_id,
  });
  await bot.answerCallbackQuery(query.id);
}

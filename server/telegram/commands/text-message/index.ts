/**
 * Text Message Handler - Router
 *
 * Главный обработчик текстовых сообщений
 * Маршрутизирует на один из трех типов:
 * 1. Edit flow - редактирование существующей транзакции
 * 2. Shopping list - список покупок
 * 3. Normal transaction - обычная транзакция
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../../db';
import { users, settings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { t } from '@shared/i18n';
import { getUserLanguageByTelegramId, getUserLanguageByUserId } from '../../language';
import { handleEditFlow } from './edit-flow.handler';
import { handleShoppingList } from './shopping-list.handler';
import { handleNormalTransaction } from './transaction.handler';

export async function handleTextMessage(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  const text = msg.text;

  if (!telegramId || !text) {
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

    // Get user's default currency from settings
    const [userSettings] = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, user.id))
      .limit(1);

    const defaultCurrency = (userSettings?.currency || 'USD') as 'USD' | 'RUB' | 'IDR';

    // Route 1: Check if user is editing a transaction
    const editHandled = await handleEditFlow(
      bot,
      chatId,
      telegramId,
      text,
      user.id,
      defaultCurrency,
      lang
    );

    if (editHandled) {
      return; // Edit flow handled
    }

    // Route 2: Try to handle as shopping list
    const shoppingListHandled = await handleShoppingList(
      bot,
      chatId,
      text,
      user.id,
      defaultCurrency,
      lang
    );

    if (shoppingListHandled) {
      return; // Shopping list handled
    }

    // Route 3: Handle as normal transaction
    await handleNormalTransaction(
      bot,
      chatId,
      text,
      user.id,
      defaultCurrency,
      lang
    );

  } catch (error) {
    console.error('Text message handling error:', error);
    const lang = await getUserLanguageByTelegramId(telegramId);
    await bot.sendMessage(chatId, t('error.transaction', lang));
  }
}

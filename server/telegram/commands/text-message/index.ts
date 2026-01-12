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
import { logError, logInfo } from '../../../lib/logger';

export async function handleTextMessage(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  const text = msg.text;

  if (!telegramId || !text) {
    return;
  }

  let lang = await getUserLanguageByTelegramId(telegramId);
  let user: typeof users.$inferSelect | undefined;
  let userSettings: typeof settings.$inferSelect | undefined;
  let defaultCurrency: 'USD' | 'RUB' | 'IDR' = 'USD';

  try {
    const [foundUser] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (!foundUser) {
      await bot.sendMessage(chatId, t('verify.not_verified', lang), { parse_mode: 'Markdown' });
      return;
    }

    user = foundUser;
    lang = await getUserLanguageByUserId(user.id);

    // Get user's default currency from settings
    const [foundSettings] = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, user.id))
      .limit(1);

    userSettings = foundSettings;
    defaultCurrency = (userSettings?.currency || 'USD') as 'USD' | 'RUB' | 'IDR';

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
    // Детальное логирование ошибки для диагностики
    logError('Text message handling error', error as Error, {
      chatId: msg.chat.id,
      telegramId: msg.from?.id.toString(),
      text: msg.text,
      messageId: msg.message_id,
      hasUser: !!user,
      userId: user?.id,
      defaultCurrency: user ? (userSettings?.currency || 'USD') : 'unknown',
    });
    
    // Отправляем сообщение об ошибке пользователю
    try {
      const lang = await getUserLanguageByTelegramId(telegramId);
      await bot.sendMessage(chatId, t('error.transaction', lang));
    } catch (sendError) {
      logError('Failed to send error message to user', sendError as Error, {
        chatId: msg.chat.id,
        telegramId: msg.from?.id.toString(),
      });
    }
  }
}

/**
 * Обработчики callback-кнопок настроек
 *
 * Для джуна: Этот файл обрабатывает нажатия на inline-кнопки настроек:
 * - settings → показать меню настроек
 * - settings:language → выбор языка
 * - settings:language:ru → сохранить русский язык
 * - settings:currency → выбор валюты
 * - settings:timezone → выбор часового пояса
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../../db';
import { settings as settingsTable, type User } from '@shared/schema';
import { showSettings, showLanguageMenu, showCurrencyMenu, showTimezoneMenu } from '../../menu/settings-handler';

/**
 * Обработать callback настроек
 *
 * Для джуна: Функция разбирает data кнопки и вызывает нужный хендлер
 * Формат data: "settings:action:value"
 *
 * @returns true если callback обработан, false если это не settings callback
 */
export async function handleSettingsCallback(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery,
  user: User
): Promise<boolean> {
  const data = query.data;
  const chatId = query.message?.chat.id;

  if (!data || !chatId) return false;

  // Главное меню настроек
  if (data === 'settings') {
    await showSettings(bot, chatId, user.id);
    await bot.answerCallbackQuery(query.id);
    return true;
  }

  // Меню выбора языка
  if (data === 'settings:language') {
    await showLanguageMenu(bot, chatId, user.id);
    await bot.answerCallbackQuery(query.id);
    return true;
  }

  // Сохранение языка (settings:language:ru или settings:language:en)
  if (data.startsWith('settings:language:')) {
    const newLang = data.split(':')[2] as 'en' | 'ru';

    await db
      .insert(settingsTable)
      .values({ userId: user.id, language: newLang })
      .onConflictDoUpdate({
        target: settingsTable.userId,
        set: { language: newLang }
      });

    await showSettings(bot, chatId, user.id);
    await bot.answerCallbackQuery(query.id, {
      text: newLang === 'ru' ? '✅ Язык изменён' : '✅ Language changed'
    });
    return true;
  }

  // Меню выбора валюты
  if (data === 'settings:currency') {
    await showCurrencyMenu(bot, chatId, user.id);
    await bot.answerCallbackQuery(query.id);
    return true;
  }

  // Сохранение валюты (settings:currency:USD)
  if (data.startsWith('settings:currency:')) {
    const newCurrency = data.split(':')[2] as 'USD' | 'RUB' | 'IDR';

    await db
      .insert(settingsTable)
      .values({ userId: user.id, currency: newCurrency })
      .onConflictDoUpdate({
        target: settingsTable.userId,
        set: { currency: newCurrency }
      });

    await showSettings(bot, chatId, user.id);
    await bot.answerCallbackQuery(query.id, {
      text: `✅ Currency: ${newCurrency}`
    });
    return true;
  }

  // Меню выбора часового пояса
  if (data === 'settings:timezone') {
    await showTimezoneMenu(bot, chatId, user.id);
    await bot.answerCallbackQuery(query.id);
    return true;
  }

  // Сохранение часового пояса (settings:timezone:Europe/Moscow)
  if (data.startsWith('settings:timezone:')) {
    const newTimezone = data.split(':')[2];

    await db
      .insert(settingsTable)
      .values({ userId: user.id, timezone: newTimezone })
      .onConflictDoUpdate({
        target: settingsTable.userId,
        set: { timezone: newTimezone }
      });

    await showSettings(bot, chatId, user.id);
    await bot.answerCallbackQuery(query.id, {
      text: `✅ Timezone: ${newTimezone}`
    });
    return true;
  }

  return false;
}

/**
 * Settings Handler
 * Управление настройками пользователя в Telegram боте
 * 
 * Junior-Friendly: <200 строк, работа с настройками
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../db';
import { settings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getSettingsKeyboard } from './keyboards';
import { getUserLanguageByUserId } from '../language';

/**
 * Показать раздел настроек
 */
export async function showSettings(
  bot: TelegramBot,
  chatId: number,
  userId: number
): Promise<void> {
  const lang = await getUserLanguageByUserId(userId);
  
  try {
    // Получить текущие настройки
    const [userSettings] = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, userId))
      .limit(1);
    
    const currentLang = userSettings?.language || 'en';
    const currentCurrency = userSettings?.currency || 'USD';
    const currentTimezone = userSettings?.timezone || 'UTC';
    const hasApiKey = !!(userSettings?.anthropicApiKey);
    
    const langLabels = {
      en: lang === 'ru' ? '🇺🇸 Английский' : '🇺🇸 English',
      ru: lang === 'ru' ? '🇷🇺 Русский' : '🇷🇺 Russian'
    };
    
    const currencyLabels = {
      USD: '🇺🇸 USD',
      RUB: '🇷🇺 RUB',
      IDR: '🇮🇩 IDR',
      KRW: '🇰🇷 KRW',
      EUR: '🇪🇺 EUR',
      CNY: '🇨🇳 CNY'
    };
    
    const message = lang === 'ru'
      ? `⚙️ *Настройки*\n\n` +
        `🌍 Язык: ${langLabels[currentLang as keyof typeof langLabels]}\n` +
        `💱 Валюта по умолчанию: ${currencyLabels[currentCurrency as keyof typeof currencyLabels]}\n` +
        `🕐 Часовой пояс: ${currentTimezone}\n` +
        `🔑 API ключ: ${hasApiKey ? '✅ Установлен' : '❌ Не установлен'}\n\n` +
        `💡 *Что можно настроить:*\n` +
        `• Язык интерфейса\n` +
        `• Валюту для быстрого ввода\n` +
        `• Часовой пояс для уведомлений\n\n` +
        `📝 API ключ можно добавить только на сайте`
      : `⚙️ *Settings*\n\n` +
        `🌍 Language: ${langLabels[currentLang as keyof typeof langLabels]}\n` +
        `💱 Default currency: ${currencyLabels[currentCurrency as keyof typeof currencyLabels]}\n` +
        `🕐 Timezone: ${currentTimezone}\n` +
        `🔑 API key: ${hasApiKey ? '✅ Set' : '❌ Not set'}\n\n` +
        `💡 *What you can configure:*\n` +
        `• Interface language\n` +
        `• Currency for quick input\n` +
        `• Timezone for notifications\n\n` +
        `📝 API key can only be added on the website`;
    
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: getSettingsKeyboard(lang)
    });
    
  } catch (error) {
    console.error('Settings display error:', error);
    
    const errorMessage = lang === 'ru'
      ? '❌ Ошибка при загрузке настроек'
      : '❌ Error loading settings';
    
    await bot.sendMessage(chatId, errorMessage, {
      reply_markup: getSettingsKeyboard(lang)
    });
  }
}

/**
 * Показать меню выбора языка
 */
export async function showLanguageMenu(
  bot: TelegramBot,
  chatId: number,
  userId: number
): Promise<void> {
  const lang = await getUserLanguageByUserId(userId);
  
  const message = lang === 'ru'
    ? '🌍 *Выбери язык интерфейса:*'
    : '🌍 *Choose interface language:*';
  
  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🇺🇸 English', callback_data: 'settings:language:en' },
          { text: '🇷🇺 Русский', callback_data: 'settings:language:ru' }
        ],
        [{ text: lang === 'ru' ? '🔙 Назад' : '🔙 Back', callback_data: 'settings' }]
      ]
    }
  });
}

/**
 * Показать меню выбора валюты
 * 
 * TODO: Загружать список валют из конфига вместо хардкода
 */
export async function showCurrencyMenu(
  bot: TelegramBot,
  chatId: number,
  userId: number
): Promise<void> {
  const lang = await getUserLanguageByUserId(userId);
  
  const message = lang === 'ru'
    ? '💱 *Выбери валюту по умолчанию:*\n\nОна будет использоваться когда ты не указываешь валюту явно.'
    : '💱 *Choose default currency:*\n\nIt will be used when you don\'t specify currency explicitly.';
  
  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🇺🇸 USD', callback_data: 'settings:currency:USD' },
          { text: '🇷🇺 RUB', callback_data: 'settings:currency:RUB' },
          { text: '🇮🇩 IDR', callback_data: 'settings:currency:IDR' }
        ],
        [
          { text: '🇰🇷 KRW', callback_data: 'settings:currency:KRW' },
          { text: '🇪🇺 EUR', callback_data: 'settings:currency:EUR' },
          { text: '🇨🇳 CNY', callback_data: 'settings:currency:CNY' }
        ],
        [{ text: lang === 'ru' ? '🔙 Назад' : '🔙 Back', callback_data: 'settings' }]
      ]
    }
  });
}

/**
 * Показать меню выбора часового пояса
 */
export async function showTimezoneMenu(
  bot: TelegramBot,
  chatId: number,
  userId: number
): Promise<void> {
  const lang = await getUserLanguageByUserId(userId);
  
  const message = lang === 'ru'
    ? '🕐 *Выбери часовой пояс:*\n\nИспользуется для ежедневных уведомлений.'
    : '🕐 *Choose timezone:*\n\nUsed for daily notifications.';
  
  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'UTC +0', callback_data: 'settings:timezone:UTC' },
          { text: 'MSK +3', callback_data: 'settings:timezone:Europe/Moscow' }
        ],
        [
          { text: 'WIB +7', callback_data: 'settings:timezone:Asia/Jakarta' },
          { text: 'PST -8', callback_data: 'settings:timezone:America/Los_Angeles' }
        ],
        [{ text: lang === 'ru' ? '🔙 Назад' : '🔙 Back', callback_data: 'settings' }]
      ]
    }
  });
}

/**
 * Currency Command Handler
 * Allows users to change their default currency via Telegram bot
 * 
 * Junior-Friendly: <200 lines, one responsibility
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../db';
import { settings, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getUserLanguageByTelegramId } from './language';
import { t } from '@shared/i18n';

/**
 * Handle /currency command - show currency selection inline keyboard
 */
export async function handleCurrencyCommand(
  bot: TelegramBot,
  msg: TelegramBot.Message
) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  if (!telegramId) {
    await bot.sendMessage(chatId, 'Error: Could not identify your account');
    return;
  }

  const lang = await getUserLanguageByTelegramId(telegramId);
  
  // Get user by telegramId
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1);

  if (!user) {
    await bot.sendMessage(chatId, t('error.not_verified', lang), {
      parse_mode: 'Markdown'
    });
    return;
  }

  // Get current currency from settings
  const [userSettings] = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, user.id))
    .limit(1);

  const currentCurrency = userSettings?.currency || 'USD';

  const keyboard: TelegramBot.InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: `🇺🇸 USD ${currentCurrency === 'USD' ? '✓' : ''}`, callback_data: 'currency:USD' },
        { text: `🇷🇺 RUB ${currentCurrency === 'RUB' ? '✓' : ''}`, callback_data: 'currency:RUB' },
      ],
      [
        { text: `🇮🇩 IDR ${currentCurrency === 'IDR' ? '✓' : ''}`, callback_data: 'currency:IDR' },
      ]
    ]
  };

  const message = lang === 'ru'
    ? `💰 *Выберите основную валюту:*\n\nТекущая: ${currentCurrency}\n\nВаша основная валюта используется когда вы не указываете валюту в сообщении.\n\nНапример:\n• \`5000 кофе\` → ${currentCurrency}\n• \`500₽ такси\` → RUB (явная валюта)`
    : `💰 *Choose your default currency:*\n\nCurrent: ${currentCurrency}\n\nYour default currency is used when you don't specify a currency in your message.\n\nExamples:\n• \`5000 coffee\` → ${currentCurrency}\n• \`500₽ taxi\` → RUB (explicit currency)`;

  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
}

/**
 * Handle currency selection callback
 */
export async function handleCurrencyCallback(
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery
) {
  if (!query.message || !query.data) return;

  const chatId = query.message.chat.id;
  const telegramId = query.from.id.toString();
  const selectedCurrency = query.data.split(':')[1] as 'USD' | 'RUB' | 'IDR';

  if (!['USD', 'RUB', 'IDR'].includes(selectedCurrency)) {
    await bot.answerCallbackQuery(query.id, { text: 'Invalid currency' });
    return;
  }

  const lang = await getUserLanguageByTelegramId(telegramId);
  
  // Get user by telegramId
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1);

  if (!user) {
    await bot.answerCallbackQuery(query.id, { text: 'User not found' });
    return;
  }

  // Upsert currency in settings (insert if missing, update otherwise)
  await db
    .insert(settings)
    .values({ 
      userId: user.id, 
      currency: selectedCurrency 
    })
    .onConflictDoUpdate({
      target: settings.userId,
      set: { currency: selectedCurrency }
    });

  const currencyName = {
    USD: lang === 'ru' ? 'Доллары США' : 'US Dollars',
    RUB: lang === 'ru' ? 'Рубли' : 'Russian Rubles',
    IDR: lang === 'ru' ? 'Индонезийские рупии' : 'Indonesian Rupiah',
  }[selectedCurrency];

  const successMessage = lang === 'ru'
    ? `✅ Основная валюта установлена: ${currencyName} (${selectedCurrency})\n\nТеперь когда вы пишете "5000 кофе", это будет ${selectedCurrency}.`
    : `✅ Default currency set: ${currencyName} (${selectedCurrency})\n\nNow when you write "5000 coffee", it will be ${selectedCurrency}.`;

  await bot.answerCallbackQuery(query.id, {
    text: lang === 'ru' ? `Валюта изменена на ${selectedCurrency}` : `Currency changed to ${selectedCurrency}`
  });

  await bot.sendMessage(chatId, successMessage);
}

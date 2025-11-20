import TelegramBot from 'node-telegram-bot-api';
import {
  handleStartCommand,
  handleVerifyCommand,
  handleHelpCommand,
  handleBalanceCommand,
  handleLanguageCommand,
  handleLastCommand,
  handleIncomeCommand,
  handleStatusCommand,
  handleTextMessage,
  handlePhotoMessage,
  handleCallbackQuery,
} from './commands';
import { handleCurrencyCommand, handleCurrencyCallback } from './currency-command';
import { handleVoiceMessage } from './voice-handler';
import { TELEGRAM_BOT_TOKEN } from './config';
import { getUserLanguageByTelegramId } from './language';
import { t } from '@shared/i18n';
import { isMainMenuButton, getMenuSection } from './menu/keyboards';
import { showAiChatWelcome, handleAiChatMessage, endAiChat, isAiChatActive } from './menu/ai-chat-handler';
import { showWallets } from './menu/wallets-handler';
import { showTransactions } from './menu/transactions-handler';
import { showSettings, showLanguageMenu, showCurrencyMenu, showTimezoneMenu } from './menu/settings-handler';
import { db } from '../db';
import { users, settings as settingsTable } from '@shared/schema';
import { eq } from 'drizzle-orm';

let bot: TelegramBot | null = null;

export function initTelegramBot(): TelegramBot | null {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN not set. Telegram bot will not start.');
    return null;
  }

  try {
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, {
      polling: {
        interval: 300,
        autoStart: true,
        params: {
          timeout: 10
        }
      }
    });

    console.log('✅ Telegram bot initialized successfully');

    bot.on('message', async (msg) => {
      try {
        if (msg.text?.startsWith('/')) {
          const parts = msg.text.split(' ');
          const command = parts[0].toLowerCase();
          const args = parts.slice(1);

          switch (command) {
            case '/start':
              await handleStartCommand(bot!, msg);
              break;
            case '/verify':
              await handleVerifyCommand(bot!, msg, args[0] || '');
              break;
            case '/help':
              await handleHelpCommand(bot!, msg);
              break;
            case '/balance':
              await handleBalanceCommand(bot!, msg);
              break;
            case '/language':
            case '/lang':
              await handleLanguageCommand(bot!, msg);
              break;
            case '/last':
              await handleLastCommand(bot!, msg);
              break;
            case '/income':
              await handleIncomeCommand(bot!, msg, args.join(' '));
              break;
            case '/status':
              await handleStatusCommand(bot!, msg);
              break;
            case '/currency':
              await handleCurrencyCommand(bot!, msg);
              break;
            default:
              // Get user's language for error message
              const telegramId = msg.from?.id.toString();
              const lang = telegramId ? await getUserLanguageByTelegramId(telegramId) : 'en';
              
              await bot!.sendMessage(
                msg.chat.id,
                t('error.unknown_command', lang)
              );
          }
        } else if (msg.photo && msg.photo.length > 0) {
          await handlePhotoMessage(bot!, msg);
        } else if (msg.voice || msg.audio) {
          await handleVoiceMessage(bot!, msg);
        } else if (msg.text) {
          // Получить userId для проверки состояния AI чата
          const telegramId = msg.from?.id.toString();
          if (!telegramId) return;
          
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.telegramId, telegramId))
            .limit(1);
          
          if (!user) {
            await handleTextMessage(bot!, msg);
            return;
          }
          
          // Проверка на кнопки главного меню
          if (isMainMenuButton(msg.text)) {
            const section = getMenuSection(msg.text);
            
            switch (section) {
              case 'ai_chat':
                await showAiChatWelcome(bot!, msg.chat.id, user.id);
                break;
              case 'wallets':
                await showWallets(bot!, msg.chat.id, user.id);
                break;
              case 'transactions':
                await showTransactions(bot!, msg.chat.id, user.id);
                break;
              case 'settings':
                await showSettings(bot!, msg.chat.id, user.id);
                break;
            }
            return;
          }
          
          // Если AI чат активен - отправить сообщение в AI
          if (await isAiChatActive(user.id)) {
            await handleAiChatMessage(bot!, msg.chat.id, user.id, msg.text);
            return;
          }
          
          // Обычная обработка (парсинг транзакций и т.д.)
          await handleTextMessage(bot!, msg);
        }
      } catch (error) {
        console.error('Error handling message:', error);
        try {
          const telegramId = msg.from?.id.toString();
          const lang = telegramId ? await getUserLanguageByTelegramId(telegramId) : 'en';
          
          await bot!.sendMessage(
            msg.chat.id,
            t('error.generic', lang)
          );
        } catch (sendError) {
          console.error('Error sending error message:', sendError);
        }
      }
    });

    bot.on('callback_query', async (query) => {
      try {
        const data = query.data;
        const chatId = query.message?.chat.id;
        const telegramId = query.from.id.toString();
        
        if (!chatId || !data) return;
        
        // Получить userId
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.telegramId, telegramId))
          .limit(1);
        
        if (!user) {
          // Get language from telegramId for error message
          const lang = await getUserLanguageByTelegramId(telegramId);
          const errorText = lang === 'ru' 
            ? 'Пользователь не найден. Используй /verify для подключения.'
            : 'User not found. Use /verify to connect.';
          
          await bot!.answerCallbackQuery(query.id, { text: errorText, show_alert: true });
          return;
        }
        
        // AI Chat callbacks
        if (data === 'ai_chat:end') {
          await endAiChat(bot!, chatId, user.id);
          await bot!.answerCallbackQuery(query.id);
          return;
        }
        
        // Главное меню
        if (data === 'main_menu') {
          const { getMainMenuKeyboard, getMainMenuHint } = await import('./menu/keyboards');
          const { getUserLanguageByUserId } = await import('./language');
          const lang = await getUserLanguageByUserId(user.id);
          
          await bot!.sendMessage(chatId, getMainMenuHint(lang), {
            parse_mode: 'Markdown',
            reply_markup: getMainMenuKeyboard()
          });
          await bot!.answerCallbackQuery(query.id);
          return;
        }
        
        // Транзакции фильтры
        if (data.startsWith('transactions:filter:')) {
          const filter = data.split(':')[2] as 'all' | 'expense' | 'income';
          await showTransactions(bot!, chatId, user.id, filter);
          await bot!.answerCallbackQuery(query.id);
          return;
        }
        
        // Настройки callbacks
        if (data === 'settings') {
          await showSettings(bot!, chatId, user.id);
          await bot!.answerCallbackQuery(query.id);
          return;
        }
        
        if (data === 'settings:language') {
          await showLanguageMenu(bot!, chatId, user.id);
          await bot!.answerCallbackQuery(query.id);
          return;
        }
        
        if (data === 'settings:currency') {
          await showCurrencyMenu(bot!, chatId, user.id);
          await bot!.answerCallbackQuery(query.id);
          return;
        }
        
        if (data === 'settings:timezone') {
          await showTimezoneMenu(bot!, chatId, user.id);
          await bot!.answerCallbackQuery(query.id);
          return;
        }
        
        // Сохранение настроек языка
        if (data.startsWith('settings:language:')) {
          const newLang = data.split(':')[2] as 'en' | 'ru';
          
          await db
            .insert(settingsTable)
            .values({ userId: user.id, language: newLang })
            .onConflictDoUpdate({
              target: settingsTable.userId,
              set: { language: newLang }
            });
          
          await showSettings(bot!, chatId, user.id);
          await bot!.answerCallbackQuery(query.id, { 
            text: newLang === 'ru' ? '✅ Язык изменён' : '✅ Language changed'
          });
          return;
        }
        
        // Сохранение настроек валюты
        if (data.startsWith('settings:currency:')) {
          const newCurrency = data.split(':')[2] as 'USD' | 'RUB' | 'IDR';
          
          await db
            .insert(settingsTable)
            .values({ userId: user.id, currency: newCurrency })
            .onConflictDoUpdate({
              target: settingsTable.userId,
              set: { currency: newCurrency }
            });
          
          await showSettings(bot!, chatId, user.id);
          await bot!.answerCallbackQuery(query.id, { 
            text: `✅ Currency: ${newCurrency}`
          });
          return;
        }
        
        // Сохранение часового пояса
        if (data.startsWith('settings:timezone:')) {
          const newTimezone = data.split(':')[2];
          
          await db
            .insert(settingsTable)
            .values({ userId: user.id, timezone: newTimezone })
            .onConflictDoUpdate({
              target: settingsTable.userId,
              set: { timezone: newTimezone }
            });
          
          await showSettings(bot!, chatId, user.id);
          await bot!.answerCallbackQuery(query.id, { 
            text: `✅ Timezone: ${newTimezone}`
          });
          return;
        }
        
        // Legacy currency callback (от старой команды /currency)
        if (data.startsWith('currency:')) {
          await handleCurrencyCallback(bot!, query);
          return;
        }
        
        // Другие callbacks
        await handleCallbackQuery(bot!, query);
      } catch (error) {
        console.error('Error handling callback query:', error);
      }
    });

    bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error);
    });

    bot.on('error', (error) => {
      console.error('Telegram bot error:', error);
    });

    return bot;
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
    return null;
  }
}

export function stopTelegramBot(): void {
  if (bot) {
    try {
      bot.stopPolling();
      console.log('🛑 Telegram bot stopped');
    } catch (error) {
      console.error('Error stopping Telegram bot:', error);
    }
  }
}

export function getTelegramBot(): TelegramBot | null {
  return bot;
}

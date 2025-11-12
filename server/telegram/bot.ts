import TelegramBot from 'node-telegram-bot-api';
import {
  handleStartCommand,
  handleVerifyCommand,
  handleHelpCommand,
  handleBalanceCommand,
  handleLanguageCommand,
  handleTextMessage,
  handlePhotoMessage,
  handleCallbackQuery,
} from './commands';
import { TELEGRAM_BOT_TOKEN } from './config';

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
            default:
              // Get user's language for error message
              const { t, getUserLanguage } = await import('./i18n');
              const { db } = await import('../db');
              const { users, settings } = await import('@shared/schema');
              const { eq } = await import('drizzle-orm');
              
              let lang: 'en' | 'ru' = 'en';
              const telegramId = msg.from?.id.toString();
              
              if (telegramId) {
                try {
                  const [user] = await db
                    .select()
                    .from(users)
                    .where(eq(users.telegramId, telegramId))
                    .limit(1);
                  
                  if (user) {
                    const [userSettings] = await db
                      .select()
                      .from(settings)
                      .where(eq(settings.userId, user.id))
                      .limit(1);
                    
                    lang = getUserLanguage(userSettings);
                  }
                } catch (err) {
                  console.error('Error fetching user language:', err);
                }
              }
              
              await bot!.sendMessage(
                msg.chat.id,
                t('error.unknown_command', lang)
              );
          }
        } else if (msg.photo && msg.photo.length > 0) {
          await handlePhotoMessage(bot!, msg);
        } else if (msg.text) {
          await handleTextMessage(bot!, msg);
        }
      } catch (error) {
        console.error('Error handling message:', error);
        try {
          const { t, getUserLanguage } = await import('./i18n');
          const { db } = await import('../db');
          const { users, settings } = await import('@shared/schema');
          const { eq } = await import('drizzle-orm');
          
          let lang: 'en' | 'ru' = 'en';
          const telegramId = msg.from?.id.toString();
          
          if (telegramId) {
            try {
              const [user] = await db
                .select()
                .from(users)
                .where(eq(users.telegramId, telegramId))
                .limit(1);
              
              if (user) {
                const [userSettings] = await db
                  .select()
                  .from(settings)
                  .where(eq(settings.userId, user.id))
                  .limit(1);
                
                lang = getUserLanguage(userSettings);
              }
            } catch (err) {
              console.error('Error fetching user language:', err);
            }
          }
          
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

/**
 * Главный модуль Telegram бота
 *
 * Для джуна: Этот файл отвечает ТОЛЬКО за:
 * 1. Инициализацию бота (polling или webhook)
 * 2. Подключение обработчиков сообщений
 * 3. Обработку ошибок
 *
 * Вся бизнес-логика вынесена в:
 * - handlers/command-registry.ts — команды (/start, /help, etc.)
 * - handlers/callbacks/ — inline-кнопки
 * - middleware/with-user.ts — авторизация
 */

import TelegramBot from 'node-telegram-bot-api';
import { TELEGRAM_BOT_TOKEN } from './config';
import { logInfo, logError, logWarning } from '../lib/logger';

// Хендлеры
import { dispatchCommand, isCommand, parseCommand } from './handlers/command-registry';
import { routeCallback } from './handlers/callbacks';
import { withUser, withUserCallback, findUserByTelegramId } from './middleware/with-user';
import { isUpdateProcessed, markUpdateProcessed } from './middleware/deduplication';

// Специализированные хендлеры
import { handleTextMessage, handlePhotoMessage } from './commands/index';
import { handleVoiceMessage } from './voice-handler';
import { getUserLanguageByTelegramId } from './language';
import { t } from '@shared/i18n';

// Меню
import { isMainMenuButton, getMenuSection } from './menu/keyboards';
import { showAiChatWelcome, handleAiChatMessage, isAiChatActive } from './menu/ai-chat-handler';
import { showWallets } from './menu/wallets-handler';
import { showTransactions } from './menu/transactions-handler';
import { showSettings } from './menu/settings-handler';

let bot: TelegramBot | null = null;

/**
 * Получить экземпляр бота
 *
 * Для джуна: Используется в webhook route для обработки входящих сообщений
 */
export function getTelegramBot(): TelegramBot | null {
  return bot;
}

/**
 * Инициализировать Telegram бота
 *
 * Для джуна: Два режима работы:
 * 1. Polling — бот сам опрашивает Telegram (dev)
 * 2. Webhook — Telegram отправляет сообщения нам (prod)
 */
export function initTelegramBot(): TelegramBot | null {
  // Проверка на отключение бота (для локальной разработки)
  if (process.env.DISABLE_TELEGRAM_BOT === 'true') {
    logWarning('⚠️  Telegram bot disabled (DISABLE_TELEGRAM_BOT=true)');
    return null;
  }

  if (!TELEGRAM_BOT_TOKEN) {
    logWarning('TELEGRAM_BOT_TOKEN not set. Telegram bot will not start.');
    return null;
  }

  try {
    bot = createBotInstance();
    if (bot) {
      setupMessageHandlers();
    }
    return bot;
  } catch (error) {
    logError('Failed to initialize Telegram bot', error as Error);
    return null;
  }
}

/**
 * Создать экземпляр бота (webhook или polling)
 */
function createBotInstance(): TelegramBot | null {
  const useWebhook = process.env.TELEGRAM_USE_WEBHOOK === 'true';
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;

  // Webhook режим (production)
  if (useWebhook && webhookUrl) {
    const instance = new TelegramBot(TELEGRAM_BOT_TOKEN!, { polling: false });
    const webhookPath = `/telegram/webhook/${TELEGRAM_BOT_TOKEN!.split(':')[1]}`;
    const fullWebhookUrl = `${webhookUrl}${webhookPath}`;

    // КРИТИЧНО: Проверить, не установлен ли уже webhook другим сервером
    instance.getWebHookInfo()
      .then((info) => {
        if (info.url && info.url !== fullWebhookUrl) {
          logWarning('Another webhook is already set!', {
            currentUrl: info.url,
            tryingToSet: fullWebhookUrl,
            warning: 'This may cause conflicts if both servers are running',
          });
        } else if (info.url === fullWebhookUrl) {
          logInfo('Webhook already set correctly', { url: fullWebhookUrl });
        }
      })
      .catch((error) => {
        logError('Failed to check webhook info', error as Error);
      });

    instance.setWebHook(fullWebhookUrl)
      .then(() => logInfo('Telegram webhook set successfully', { mode: 'webhook', url: fullWebhookUrl }))
      .catch((error) => logError('Failed to set Telegram webhook', error as Error));

    logInfo('Telegram bot initialized in WEBHOOK mode');
    return instance;
  }

  // Polling режим (development)
  // КРИТИЧНО: Проверить, не установлен ли webhook на прод сервере
  if (process.env.NODE_ENV === 'production') {
    logWarning('⚠️  Polling mode in production! This may conflict with webhook.');
  }
  
  // Проверяем, не установлен ли webhook (чтобы избежать конфликтов)
  const tempInstance = new TelegramBot(TELEGRAM_BOT_TOKEN!, { polling: false });
  tempInstance.getWebHookInfo()
    .then((info) => {
      if (info.url) {
        logWarning('Webhook is already set on another server!', {
          webhookUrl: info.url,
          warning: 'Polling may conflict with webhook. Consider using DISABLE_TELEGRAM_BOT=true on localhost',
        });
      }
    })
    .catch((error) => {
      logError('Failed to check webhook info before polling', error as Error);
    });

  const instance = new TelegramBot(TELEGRAM_BOT_TOKEN!, {
    polling: { interval: 300, autoStart: true, params: { timeout: 10 } }
  });

  logInfo('Telegram bot initialized in POLLING mode');
  return instance;
}

/**
 * Подключить обработчики сообщений
 *
 * Для джуна: Здесь подключаются все типы сообщений:
 * - Команды (/start, /help)
 * - Текст (парсинг транзакций)
 * - Фото (OCR чеков)
 * - Голос (распознавание речи)
 * - Callback (inline-кнопки)
 */
function setupMessageHandlers(): void {
  if (!bot) return;

  // Обработка входящих сообщений с дедупликацией
  bot.on('message', (msg, metadata) => {
    // metadata содержит update_id при polling режиме
    const updateId = (metadata as any)?.update_id;
    if (updateId && isUpdateProcessed(updateId)) {
      logWarning('Duplicate Telegram message detected in polling, skipping', {
        updateId,
        chatId: msg.chat.id,
        messageId: msg.message_id,
      });
      return;
    }
    if (updateId) {
      markUpdateProcessed(updateId);
    }
    handleIncomingMessage(msg);
  });

  // Обработка нажатий на inline-кнопки
  bot.on('callback_query', handleIncomingCallback);

  // Обработка ошибок
  bot.on('polling_error', (error) => logError('Telegram polling error', error as Error));
  bot.on('error', (error) => logError('Telegram bot error', error as Error));
}

/**
 * Обработать входящее сообщение
 *
 * Для джуна: Порядок проверок важен:
 * 1. Команда? → dispatchCommand
 * 2. Фото? → OCR
 * 3. Голос? → Speech-to-text
 * 4. Текст? → Меню или парсинг транзакции
 */
async function handleIncomingMessage(msg: TelegramBot.Message): Promise<void> {
  // Примечание: дедупликация по update_id происходит на уровне webhook/polling
  // Здесь мы просто обрабатываем сообщение
  try {
    // ВАЖНО: Порядок проверок критичен!
    // Сначала обрабатываем медиа (фото, голос), потом команды, потом текст
    
    // 1. Фото (OCR) - проверяем ПЕРВЫМ, даже если есть подпись
    if (msg.photo && msg.photo.length > 0) {
      logInfo('Processing photo message', {
        chatId: msg.chat.id,
        messageId: msg.message_id,
        hasCaption: !!msg.caption,
      });
      await handlePhotoMessage(bot!, msg);
      return;
    }

    // 2. Голосовые сообщения - проверяем ВТОРЫМ
    if (msg.voice || msg.audio) {
      logInfo('Processing voice/audio message', {
        chatId: msg.chat.id,
        messageId: msg.message_id,
        hasVoice: !!msg.voice,
        hasAudio: !!msg.audio,
      });
      await handleVoiceMessage(bot!, msg);
      return;
    }

    // 3. Команды - только если это ТОЛЬКО текст (без медиа)
    if (msg.text && isCommand(msg.text)) {
      logInfo('Processing command', {
        chatId: msg.chat.id,
        messageId: msg.message_id,
        command: msg.text,
      });
      const { command, args } = parseCommand(msg.text);
      await dispatchCommand(bot!, msg, command, args);
      return;
    }

    // 4. Текстовые сообщения (парсинг транзакций, меню, AI чат)
    if (msg.text) {
      logInfo('Processing text message', {
        chatId: msg.chat.id,
        messageId: msg.message_id,
        textLength: msg.text.length,
      });
      await handleTextMessageWithContext(msg);
      return;
    }

    // 5. Неизвестный тип сообщения
    logWarning('Unhandled message type', {
      chatId: msg.chat.id,
      messageId: msg.message_id,
      hasText: !!msg.text,
      hasPhoto: !!msg.photo,
      hasVoice: !!msg.voice,
      hasAudio: !!msg.audio,
      hasDocument: !!msg.document,
    });
  } catch (error) {
    await handleMessageError(msg, error as Error);
  }
}

/**
 * Обработать текстовое сообщение с учётом контекста
 *
 * Для джуна: Текст может быть:
 * - Кнопка главного меню → показать раздел
 * - Сообщение в AI чат → отправить в AI
 * - Обычный текст → парсить как транзакцию
 */
async function handleTextMessageWithContext(msg: TelegramBot.Message): Promise<void> {
  const telegramId = msg.from?.id.toString();
  if (!telegramId || !msg.text) return;

  const user = await findUserByTelegramId(telegramId);

  // Пользователь не авторизован → парсить как транзакцию
  if (!user) {
    await handleTextMessage(bot!, msg);
    return;
  }

  // Кнопка главного меню
  if (isMainMenuButton(msg.text)) {
    await handleMenuButton(msg, user.id);
    return;
  }

  // AI чат активен → отправить в AI
  if (await isAiChatActive(user.id)) {
    await handleAiChatMessage(bot!, msg.chat.id, user.id, msg.text);
    return;
  }

  // Обычная обработка (парсинг транзакций)
  await handleTextMessage(bot!, msg);
}

/**
 * Обработать нажатие кнопки меню
 */
async function handleMenuButton(msg: TelegramBot.Message, userId: number): Promise<void> {
  const section = getMenuSection(msg.text!);

  switch (section) {
    case 'ai_chat':
      await showAiChatWelcome(bot!, msg.chat.id, userId);
      break;
    case 'wallets':
      await showWallets(bot!, msg.chat.id, userId);
      break;
    case 'transactions':
      await showTransactions(bot!, msg.chat.id, userId);
      break;
    case 'settings':
      await showSettings(bot!, msg.chat.id, userId);
      break;
  }
}

/**
 * Handle language selection for new users
 */
async function handleLanguageSelection(query: TelegramBot.CallbackQuery): Promise<void> {
  const telegramId = query.from.id.toString();
  const chatId = query.message?.chat.id;
  const lang = query.data?.split(':')[1] as 'en' | 'ru';

  if (!chatId || !lang) return;

  try {
    // Import db and users schema
    const { db } = await import('../db');
    const { users } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (existingUser) {
      // User already exists, just update language in settings
      const { settings } = await import('@shared/schema');

      // Check if settings exist
      const [userSettings] = await db
        .select()
        .from(settings)
        .where(eq(settings.userId, existingUser.id))
        .limit(1);

      if (userSettings) {
        // Update existing settings
        await db
          .update(settings)
          .set({ language: lang })
          .where(eq(settings.userId, existingUser.id));
      } else {
        // Create new settings
        await db.insert(settings).values({
          userId: existingUser.id,
          language: lang,
          currency: 'USD',
        });
      }

      await bot!.answerCallbackQuery(query.id);

      const { getWelcomeMessage } = await import('@shared/i18n');
      const { getMainMenuKeyboard, getMainMenuHint } = await import('./menu/keyboards');

      await bot!.editMessageText(getWelcomeMessage(lang), {
        chat_id: chatId,
        message_id: query.message?.message_id,
        parse_mode: 'Markdown'
      });

      await bot!.sendMessage(chatId, getMainMenuHint(lang), {
        parse_mode: 'Markdown',
        reply_markup: getMainMenuKeyboard()
      });
      return;
    }

    // Create new user
    const name = query.from.first_name || query.from.username || 'User';
    const email = `${telegramId}@telegram.user`;

    const [newUser] = await db.insert(users).values({
      email,
      name,
      password: '',
      telegramId,
      telegramUsername: query.from.username || null,
    }).returning();

    // Create settings with selected language
    const { settings } = await import('@shared/schema');
    await db.insert(settings).values({
      userId: newUser.id,
      language: lang,
      currency: 'USD',
    });

    await bot!.answerCallbackQuery(query.id);

    const { getWelcomeMessage } = await import('@shared/i18n');
    const { getMainMenuKeyboard, getMainMenuHint } = await import('./menu/keyboards');

    await bot!.editMessageText(getWelcomeMessage(lang), {
      chat_id: chatId,
      message_id: query.message?.message_id,
      parse_mode: 'Markdown'
    });

    await bot!.sendMessage(chatId, getMainMenuHint(lang), {
      parse_mode: 'Markdown',
      reply_markup: getMainMenuKeyboard()
    });
  } catch (error) {
    logError('Error handling language selection', error as Error);
    await bot!.answerCallbackQuery(query.id, {
      text: 'Error creating user. Please try again.',
      show_alert: true
    });
  }
}

/**
 * Обработать callback query (inline-кнопки)
 */
async function handleIncomingCallback(query: TelegramBot.CallbackQuery): Promise<void> {
  try {
    // Handle language selection for new users (before auth check)
    if (query.data?.startsWith('select_language:')) {
      await handleLanguageSelection(query);
      return;
    }

    await withUserCallback(bot!, query, async (_, q, user) => {
      await routeCallback(bot!, q, user);
    });
  } catch (error) {
    logError('Error handling Telegram callback query', error as Error, {
      queryId: query.id,
      data: query.data,
    });
  }
}

/**
 * Обработать ошибку в сообщении
 */
async function handleMessageError(msg: TelegramBot.Message, error: Error): Promise<void> {
  logError('Error handling Telegram message', error, {
    chatId: msg.chat.id,
    messageId: msg.message_id,
  });

  try {
    const telegramId = msg.from?.id.toString();
    const lang = telegramId ? await getUserLanguageByTelegramId(telegramId) : 'en';
    await bot!.sendMessage(msg.chat.id, t('error.generic', lang));
  } catch (sendError) {
    logError('Error sending error message to user', sendError as Error);
  }
}

/**
 * Остановить Telegram бота
 */
export function stopTelegramBot(): void {
  if (bot) {
    try {
      bot.stopPolling();
      logInfo('Telegram bot stopped');
    } catch (error) {
      logError('Error stopping Telegram bot', error as Error);
    }
  }
}

/**
 * AI Chat Handler
 * Обработка AI чата в Telegram боте
 * 
 * Junior-Friendly: <200 строк, интеграция с AI сервисами
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../db';
import { users, settings, aiChatMessages } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { chatWithAI } from '../../services/ai/chat.service';
import { buildFinancialContext } from '../../services/ai/financial-context.service';
import { getAiChatKeyboard, getMainMenuKeyboard, getMainMenuHint } from './keyboards';
import { getUserLanguageByUserId } from '../language';
import { getApiKey } from '../../services/api-key-manager';
import { chargeCredits } from '../../services/billing.service';
import { BillingError } from '../../types/billing';

// REMOVED: In-memory activeChats Map (not reliable across bot restarts)
// AI chat active state is now determined by checking recent ai_chat_messages
// with source='telegram' and role='user' (sent in last 30 minutes)

/**
 * Проверка есть ли у пользователя API ключ или кредиты
 */
async function hasApiKey(userId: number): Promise<boolean> {
  try {
    // Try to get API key (BYOK or system with credits)
    await getApiKey(userId, 'financial_advisor');
    return true;
  } catch (error) {
    if (error instanceof BillingError && error.code === 'INSUFFICIENT_CREDITS') {
      return false;
    }
    // Other errors - assume no access
    return false;
  }
}

/**
 * Показать приветственное сообщение AI чата
 */
export async function showAiChatWelcome(
  bot: TelegramBot,
  chatId: number,
  userId: number
): Promise<void> {
  const lang = await getUserLanguageByUserId(userId);
  
  // Проверка API ключа
  const hasKey = await hasApiKey(userId);
  
  if (!hasKey) {
    const message = lang === 'ru'
      ? '🔑 *Для работы AI чата нужен API ключ*\n\n' +
        'Пожалуйста, добавь Anthropic API ключ в настройках на сайте.\n\n' +
        '📝 Как получить ключ:\n' +
        '1. Перейди на console.anthropic.com\n' +
        '2. Зарегистрируйся или войди\n' +
        '3. Получи API ключ\n' +
        '4. Добавь его в настройках на сайте Budget Buddy'
      : '🔑 *AI chat requires API key*\n\n' +
        'Please add your Anthropic API key in website settings.\n\n' +
        '📝 How to get a key:\n' +
        '1. Go to console.anthropic.com\n' +
        '2. Sign up or log in\n' +
        '3. Get API key\n' +
        '4. Add it in Budget Buddy website settings';
    
    await bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      reply_markup: getMainMenuKeyboard()
    });
    
    await bot.sendMessage(chatId, getMainMenuHint(lang), { 
      parse_mode: 'Markdown' 
    });
    
    return;
  }
  
  // AI chat is now "active" automatically when user sends messages
  // No need to track state - we check message recency instead
  
  const welcomeMessage = lang === 'ru'
    ? '👋 *Привет! Я твой AI финансовый советник.*\n\n' +
      '💡 *Что я могу:*\n' +
      '• Проанализировать твои расходы и найти где экономить\n' +
      '• Ответить на вопрос "Могу ли позволить покупку X?"\n' +
      '• Сравнить цены в магазинах (где купить дешевле?)\n' +
      '• Дать персональные советы по бюджету\n' +
      '• Помочь спланировать крупную покупку\n' +
      '• Ответить на любой финансовый вопрос\n\n' +
      '📊 *Я вижу:*\n' +
      '• Все твои транзакции\n' +
      '• Балансы кошельков\n' +
      '• Цели и планы\n' +
      '• Историю наших разговоров (из веба и Telegram!)\n\n' +
      '✨ *Просто задай вопрос!*'
    : '👋 *Hi! I\'m your AI financial advisor.*\n\n' +
      '💡 *What I can do:*\n' +
      '• Analyze your expenses and find savings\n' +
      '• Answer "Can I afford X?"\n' +
      '• Compare store prices (where to buy cheaper?)\n' +
      '• Give personalized budget advice\n' +
      '• Help plan big purchases\n' +
      '• Answer any financial question\n\n' +
      '📊 *I can see:*\n' +
      '• All your transactions\n' +
      '• Wallet balances\n' +
      '• Goals and plans\n' +
      '• Our conversation history (from web & Telegram!)\n\n' +
      '✨ *Just ask a question!*';
  
  await bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: getAiChatKeyboard(lang)
  });
}

/**
 * Обработка сообщения пользователя в AI чате
 */
export async function handleAiChatMessage(
  bot: TelegramBot,
  chatId: number,
  userId: number,
  messageText: string
): Promise<void> {
  const lang = await getUserLanguageByUserId(userId);

  try {
    // 🎯 Smart API key selection: BYOK or system key with credits
    let chatApiKey;
    let chatBillingMode;

    try {
      const apiKeyInfo = await getApiKey(userId, 'financial_advisor');
      chatApiKey = apiKeyInfo.key;
      chatBillingMode = apiKeyInfo;
    } catch (error) {
      if (error instanceof BillingError && error.code === 'INSUFFICIENT_CREDITS') {
        await bot.sendMessage(
          chatId,
          lang === 'ru'
            ? '❌ Кредиты закончились. Купи больше на /app/settings/billing или добавь свой Anthropic API ключ.'
            : '❌ No credits remaining. Purchase more at /app/settings/billing or add your own Anthropic API key.'
        );
        return;
      }
      throw error;
    }

    // Показать typing indicator
    await bot.sendChatAction(chatId, 'typing');

    // Сохранить сообщение пользователя
    await db.insert(aiChatMessages).values({
      userId,
      role: 'user',
      content: messageText,
      source: 'telegram',
      contextType: 'general'
    });

    // Загрузить историю чата (последние 20 сообщений из ВСЕХ источников)
    const history = await db
      .select()
      .from(aiChatMessages)
      .where(eq(aiChatMessages.userId, userId))
      .orderBy(desc(aiChatMessages.createdAt))
      .limit(20);

    // Построить финансовый контекст
    const financialContext = await buildFinancialContext({
      userId,
      includeTransactions: true,
      includeBudgets: true,
      includeWallets: true,
      transactionDays: 30
    });

    // Отправить в AI
    const aiResponse = await chatWithAI({
      apiKey: chatApiKey,
      messages: history.reverse().map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      contextData: financialContext
    });

    // 💳 Charge credits for AI chat
    if (chatBillingMode.shouldCharge && aiResponse.usage) {
      await chargeCredits(
        userId,
        'financial_advisor',
        chatBillingMode.provider,
        {
          input: aiResponse.usage.inputTokens || 2000,
          output: aiResponse.usage.outputTokens || 500
        },
        chatBillingMode.billingMode === 'free'
      );
    }

    // Сохранить ответ AI
    await db.insert(aiChatMessages).values({
      userId,
      role: 'assistant',
      content: aiResponse.message,
      source: 'telegram',
      contextType: 'general'
    });

    // Отправить ответ пользователю
    await bot.sendMessage(chatId, aiResponse.message, {
      parse_mode: 'Markdown',
      reply_markup: getAiChatKeyboard(lang)
    });
    
  } catch (error) {
    console.error('AI chat error:', error);
    
    const errorMessage = lang === 'ru'
      ? '❌ Ошибка при общении с AI. Проверь API ключ в настройках.'
      : '❌ Error communicating with AI. Check your API key in settings.';
    
    await bot.sendMessage(chatId, errorMessage, {
      reply_markup: getMainMenuKeyboard()
    });
  }
}

/**
 * Закончить AI чат
 */
export async function endAiChat(
  bot: TelegramBot,
  chatId: number,
  userId: number
): Promise<void> {
  const lang = await getUserLanguageByUserId(userId);
  
  const message = lang === 'ru'
    ? '👋 Чат завершён! Можешь вернуться в любое время.'
    : '👋 Chat ended! Come back anytime.';
  
  await bot.sendMessage(chatId, message, {
    reply_markup: getMainMenuKeyboard()
  });
  
  await bot.sendMessage(chatId, getMainMenuHint(lang), {
    parse_mode: 'Markdown'
  });
}

/**
 * Проверка активен ли AI чат у пользователя в Telegram
 * 
 * ВАЖНО: Проверяем только TELEGRAM сообщения (source='telegram')
 * Игнорируем web сообщения чтобы не сломать AI чат в Telegram
 * когда пользователь пишет в web интерфейсе
 * 
 * Чат активен если последнее TELEGRAM сообщение отправлено в последние 30 минут
 * 
 * TODO: Фильтровать по role='user' чтобы assistant ответы не продлевали сессию
 */
export async function isAiChatActive(userId: number): Promise<boolean> {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    // CRITICAL FIX: Filter by source='telegram' BEFORE ordering
    // Otherwise web messages break Telegram AI chat continuity
    const [recentTelegramMessage] = await db
      .select()
      .from(aiChatMessages)
      .where(
        and(
          eq(aiChatMessages.userId, userId),
          eq(aiChatMessages.source, 'telegram')
        )
      )
      .orderBy(desc(aiChatMessages.createdAt))
      .limit(1);
    
    if (!recentTelegramMessage) return false;
    
    // Активен если последнее TELEGRAM сообщение отправлено недавно
    return new Date(recentTelegramMessage.createdAt) > thirtyMinutesAgo;
  } catch (error) {
    console.error('Error checking AI chat active state:', error);
    return false;
  }
}

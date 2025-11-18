/**
 * Telegram Bot Keyboards
 * Генерация клавиатур для главного меню и подменю
 * 
 * Junior-Friendly: <200 строк, генерация UI элементов
 */

import TelegramBot from 'node-telegram-bot-api';

/**
 * Главное меню (Reply Keyboard - всегда видно)
 * 4 большие кнопки
 */
export function getMainMenuKeyboard(): TelegramBot.ReplyKeyboardMarkup {
  return {
    keyboard: [
      [{ text: '💬 AI Чат' }],
      [{ text: '💳 Кошельки' }],
      [{ text: '💰 Расходы и доходы' }],
      [{ text: '⚙️ Настройки' }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false, // Всегда показывать
  };
}

/**
 * Текст подсказки над главным меню
 * Показывается всегда чтобы напомнить про быстрый ввод
 */
export function getMainMenuHint(lang: 'en' | 'ru' = 'ru'): string {
  if (lang === 'ru') {
    return '💡 *Быстрое добавление:*\n' +
           'Просто напиши: `кофе 100 рублей`\n' +
           'Или отправь фото чека 📸';
  }
  
  return '💡 *Quick add:*\n' +
         'Just write: `coffee 100 rubles`\n' +
         'Or send receipt photo 📸';
}

/**
 * Кнопки для AI чата (Inline Keyboard)
 * Показываются под сообщениями в чате
 */
export function getAiChatKeyboard(lang: 'en' | 'ru' = 'ru'): TelegramBot.InlineKeyboardMarkup {
  const endChat = lang === 'ru' ? '🔚 Закончить чат' : '🔚 End chat';
  const backToMenu = lang === 'ru' ? '🔙 Главное меню' : '🔙 Main menu';
  
  return {
    inline_keyboard: [
      [
        { text: endChat, callback_data: 'ai_chat:end' },
        { text: backToMenu, callback_data: 'main_menu' },
      ]
    ]
  };
}

/**
 * Кнопки для раздела кошельков (Inline)
 */
export function getWalletsKeyboard(lang: 'en' | 'ru' = 'ru'): TelegramBot.InlineKeyboardMarkup {
  const backToMenu = lang === 'ru' ? '🔙 Главное меню' : '🔙 Main menu';
  
  return {
    inline_keyboard: [
      [{ text: backToMenu, callback_data: 'main_menu' }]
    ]
  };
}

/**
 * Кнопки фильтров для транзакций (Inline)
 */
export function getTransactionsFiltersKeyboard(
  currentFilter: 'all' | 'expense' | 'income',
  lang: 'en' | 'ru' = 'ru'
): TelegramBot.InlineKeyboardMarkup {
  const labels = lang === 'ru' 
    ? { all: 'Все', expense: 'Расходы', income: 'Доходы' }
    : { all: 'All', expense: 'Expenses', income: 'Income' };
  
  // Добавляем ✓ к активному фильтру
  const allText = currentFilter === 'all' ? `✓ ${labels.all}` : labels.all;
  const expenseText = currentFilter === 'expense' ? `✓ ${labels.expense}` : labels.expense;
  const incomeText = currentFilter === 'income' ? `✓ ${labels.income}` : labels.income;
  
  const backToMenu = lang === 'ru' ? '🔙 Главное меню' : '🔙 Main menu';
  
  return {
    inline_keyboard: [
      [
        { text: allText, callback_data: 'transactions:filter:all' },
        { text: expenseText, callback_data: 'transactions:filter:expense' },
        { text: incomeText, callback_data: 'transactions:filter:income' },
      ],
      [{ text: backToMenu, callback_data: 'main_menu' }]
    ]
  };
}

/**
 * Кнопки для настроек (Inline)
 */
export function getSettingsKeyboard(lang: 'en' | 'ru' = 'ru'): TelegramBot.InlineKeyboardMarkup {
  const labels = lang === 'ru'
    ? { language: '🌍 Язык', currency: '💱 Валюта', timezone: '🕐 Часовой пояс' }
    : { language: '🌍 Language', currency: '💱 Currency', timezone: '🕐 Timezone' };
  
  const backToMenu = lang === 'ru' ? '🔙 Главное меню' : '🔙 Main menu';
  
  return {
    inline_keyboard: [
      [{ text: labels.language, callback_data: 'settings:language' }],
      [{ text: labels.currency, callback_data: 'settings:currency' }],
      [{ text: labels.timezone, callback_data: 'settings:timezone' }],
      [{ text: backToMenu, callback_data: 'main_menu' }]
    ]
  };
}

/**
 * Убрать клавиатуру (для скрытия меню)
 */
export function getRemoveKeyboard(): TelegramBot.ReplyKeyboardRemove {
  return {
    remove_keyboard: true
  };
}

/**
 * Проверка является ли текст нажатием кнопки главного меню
 * 
 * TODO: Заменить на callback_data вместо emoji текста для i18n совместимости
 */
export function isMainMenuButton(text: string): boolean {
  const buttons = [
    '💬 AI Чат',
    '💳 Кошельки', 
    '💰 Расходы и доходы',
    '⚙️ Настройки'
  ];
  
  return buttons.includes(text);
}

/**
 * Получить идентификатор раздела по тексту кнопки
 */
export function getMenuSection(text: string): string | null {
  const mapping: Record<string, string> = {
    '💬 AI Чат': 'ai_chat',
    '💳 Кошельки': 'wallets',
    '💰 Расходы и доходы': 'transactions',
    '⚙️ Настройки': 'settings'
  };
  
  return mapping[text] || null;
}

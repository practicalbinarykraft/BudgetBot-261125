/**
 * i18n - Internationalization for Telegram Bot
 * Supports English (en) and Russian (ru)
 */

export type Language = 'en' | 'ru';

interface Translations {
  [key: string]: {
    en: string;
    ru: string;
  };
}

const translations: Translations = {
  // Welcome message
  'welcome.title': {
    en: '👋 Welcome to Budget Buddy!',
    ru: '👋 Добро пожаловать в Budget Buddy!',
  },
  'welcome.description': {
    en: 'Your personal finance assistant',
    ru: 'Ваш личный помощник по финансам',
  },
  'welcome.features': {
    en: '*Features:*\n• 💸 Track expenses\n• 📸 Scan receipts (OCR)\n• 💰 Check balances\n• 📊 Budget management',
    ru: '*Возможности:*\n• 💸 Учёт расходов\n• 📸 Сканирование чеков (OCR)\n• 💰 Проверка баланса\n• 📊 Управление бюджетом',
  },
  'welcome.getting_started': {
    en: '*Getting Started:*\n1. Connect: `/verify <code>`\n2. Add expense: `100 coffee` or `1500₽ taxi`\n3. Scan receipt: Send photo\n4. Check balance: `/balance`',
    ru: '*Начало работы:*\n1. Подключение: `/verify <код>`\n2. Добавить расход: `100 coffee` или `1500₽ такси`\n3. Сканировать чек: Отправить фото\n4. Проверить баланс: `/balance`',
  },
  'welcome.help': {
    en: 'Type `/help` for all commands.',
    ru: 'Введите `/help` для списка команд.',
  },

  // Help message
  'help.title': {
    en: '📖 *Available Commands*',
    ru: '📖 *Доступные команды*',
  },
  'help.commands': {
    en: '*/start* - Show welcome message\n*/verify <code>* - Connect your account\n*/balance* - Show wallet balances\n*/language* - Change language\n*/help* - Show this help',
    ru: '*/start* - Показать приветствие\n*/verify <код>* - Подключить аккаунт\n*/balance* - Показать балансы кошельков\n*/language* - Сменить язык\n*/help* - Показать эту справку',
  },
  'help.quick_add': {
    en: '*Quick Add:*\nJust send: `100 coffee` or `1500₽ taxi`',
    ru: '*Быстрое добавление:*\nПросто отправьте: `100 coffee` или `1500₽ такси`',
  },
  'help.receipt_scan': {
    en: '*Receipt Scan:*\nSend a photo of your receipt',
    ru: '*Сканирование чека:*\nОтправьте фото вашего чека',
  },

  // Verification
  'verify.success': {
    en: '✅ *Account connected successfully!*\n\nYou can now:\n• Add expenses: `100 coffee`\n• Scan receipts: Send photo\n• Check balance: `/balance`\n\nType `/help` for more info.',
    ru: '✅ *Аккаунт успешно подключён!*\n\nТеперь вы можете:\n• Добавлять расходы: `100 coffee`\n• Сканировать чеки: Отправить фото\n• Проверять баланс: `/balance`\n\nВведите `/help` для подробностей.',
  },
  'verify.not_verified': {
    en: '❌ *Not Connected*\n\nPlease connect your account first:\n1. Open Budget Buddy → Settings\n2. Copy verification code\n3. Send: `/verify <code>`',
    ru: '❌ *Не подключено*\n\nПожалуйста, подключите аккаунт:\n1. Откройте Budget Buddy → Настройки\n2. Скопируйте код проверки\n3. Отправьте: `/verify <код>`',
  },
  'verify.invalid_code': {
    en: '❌ Invalid or expired verification code.\n\nPlease generate a new code in Budget Buddy Settings.',
    ru: '❌ Неверный или истёкший код проверки.\n\nПожалуйста, создайте новый код в настройках Budget Buddy.',
  },
  'verify.invalid_format': {
    en: '❌ Invalid code format. Please use a 6-digit code.\n\nExample: `/verify 123456`',
    ru: '❌ Неверный формат кода. Используйте 6-значный код.\n\nПример: `/verify 123456`',
  },
  'verify.no_telegram_id': {
    en: '❌ Could not identify your Telegram account.',
    ru: '❌ Не удалось определить ваш Telegram аккаунт.',
  },

  // Balance
  'balance.title': {
    en: '💰 *Your Wallets*',
    ru: '💰 *Ваши кошельки*',
  },
  'balance.no_wallets': {
    en: 'No wallets found. Create one in Budget Buddy!',
    ru: 'Кошельки не найдены. Создайте их в Budget Buddy!',
  },
  'balance.total': {
    en: '💵 *Total (USD):*',
    ru: '💵 *Итого (USD):*',
  },

  // Transactions
  'transaction.income_added': {
    en: '💰 *Income added!*',
    ru: '💰 *Доход добавлен!*',
  },
  'transaction.expense_added': {
    en: '💸 *Expense added!*',
    ru: '💸 *Расход добавлен!*',
  },
  'transaction.amount': {
    en: 'Amount',
    ru: 'Сумма',
  },
  'transaction.description': {
    en: 'Description',
    ru: 'Описание',
  },
  'transaction.category': {
    en: 'Category',
    ru: 'Категория',
  },
  'transaction.parse_error': {
    en: '❌ Could not parse transaction.\n\nExample: `100 coffee` or `1500₽ taxi`',
    ru: '❌ Не удалось распознать транзакцию.\n\nПример: `100 coffee` или `1500₽ такси`',
  },

  // Receipt OCR
  'receipt.processing': {
    en: '🔍 Processing receipt...',
    ru: '🔍 Обработка чека...',
  },
  'receipt.extracted': {
    en: '📝 *Receipt extracted:*',
    ru: '📝 *Чек распознан:*',
  },
  'receipt.confirm_question': {
    en: 'Confirm to add this expense?',
    ru: 'Подтвердить добавление расхода?',
  },
  'receipt.confirm_button': {
    en: '✅ Confirm',
    ru: '✅ Подтвердить',
  },
  'receipt.cancel_button': {
    en: '❌ Cancel',
    ru: '❌ Отмена',
  },
  'receipt.cancelled': {
    en: '❌ Receipt cancelled.',
    ru: '❌ Чек отменён.',
  },
  'receipt.error': {
    en: '❌ Could not extract information from receipt.\n\nPlease try:\n• Better lighting\n• Clearer photo\n• Or enter manually: `100 coffee`',
    ru: '❌ Не удалось извлечь информацию из чека.\n\nПопробуйте:\n• Лучшее освещение\n• Более чёткое фото\n• Или введите вручную: `100 coffee`',
  },
  'receipt.added': {
    en: 'Transaction added!',
    ru: 'Транзакция добавлена!',
  },

  // Language
  'language.current': {
    en: '🌐 *Current Language*',
    ru: '🌐 *Текущий язык*',
  },
  'language.choose': {
    en: 'Choose your language:',
    ru: 'Выберите язык:',
  },
  'language.changed': {
    en: '✅ Language changed to English',
    ru: '✅ Язык изменён на Русский',
  },
  'language.en': {
    en: '🇬🇧 English',
    ru: '🇬🇧 Английский',
  },
  'language.ru': {
    en: '🇷🇺 Russian',
    ru: '🇷🇺 Русский',
  },

  // Errors
  'error.generic': {
    en: '❌ An error occurred. Please try again later.',
    ru: '❌ Произошла ошибка. Попробуйте позже.',
  },
  'error.balance': {
    en: '❌ An error occurred while fetching your balance.',
    ru: '❌ Произошла ошибка при получении баланса.',
  },
  'error.transaction': {
    en: '❌ An error occurred while processing your transaction.',
    ru: '❌ Произошла ошибка при обработке транзакции.',
  },
  'error.receipt': {
    en: '❌ An error occurred while processing your receipt.',
    ru: '❌ Произошла ошибка при обработке чека.',
  },
  'error.user_not_found': {
    en: 'User not found',
    ru: 'Пользователь не найден',
  },
  'error.unknown_command': {
    en: 'Unknown command. Type /help for available commands.',
    ru: 'Неизвестная команда. Введите /help для списка команд.',
  },
};

/**
 * Get translated message
 */
export function t(key: string, lang: Language = 'en'): string {
  const translation = translations[key];
  if (!translation) {
    console.warn(`Translation key not found: ${key}`);
    return key;
  }
  return translation[lang] || translation.en;
}

/**
 * Get user's language preference (default: 'en')
 */
export function getUserLanguage(settings: { language?: string | null } | null): Language {
  if (!settings || !settings.language) {
    return 'en';
  }
  return settings.language === 'ru' ? 'ru' : 'en';
}

/**
 * Format welcome message with all sections
 */
export function getWelcomeMessage(lang: Language = 'en'): string {
  return `${t('welcome.title', lang)}\n${t('welcome.description', lang)}\n\n${t('welcome.features', lang)}\n\n${t('welcome.getting_started', lang)}\n\n${t('welcome.help', lang)}`;
}

/**
 * Format help message with all commands
 */
export function getHelpMessage(lang: Language = 'en'): string {
  return `${t('help.title', lang)}\n\n${t('help.commands', lang)}\n\n${t('help.quick_add', lang)}\n\n${t('help.receipt_scan', lang)}`;
}

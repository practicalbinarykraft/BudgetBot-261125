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

  // Help message - Extended
  'help.title': {
    en: '📚 *BUDGET BUDDY GUIDE*',
    ru: '📚 *СПРАВКА BUDGET BUDDY*',
  },
  'help.shopping_lists': {
    en: '🛒 *SHOPPING LISTS*\n\n*Format 1 (comma-separated):*\n`Pepito: bread 5k, milk 12k, eggs 18k`\n\n*Format 2 (multiline):*\n`Moris:\nbread 5000\nmilk 12000\neggs 18000`\n\n*Format 3 (without colon):*\n`pepito\nbread 5000\nmilk 12000`',
    ru: '🛒 *СПИСКИ ПОКУПОК*\n\n*Формат 1 (через запятую):*\n`Pepito: хлеб 5к, молоко 12к, яйца 18к`\n\n*Формат 2 (многострочно):*\n`Moris:\nхлеб 5000\nмолоко 12000\nяйца 18000`\n\n*Формат 3 (без двоеточия):*\n`пепито\nхлеб 5000\nмолоко 12000`',
  },
  'help.currency_formats': {
    en: '💰 *PRICE FORMATS*\n\n*Rupiah (IDR):*\n- `5000` = 5 thousand\n- `5k` = 5 thousand\n- `5,000` = 5 thousand\n- `32.5k` = 32,500\n\n*Dollars (USD):*\n- `$6.70` = 6 dollars 70 cents\n- `$1000` or `1000 USD`\n\n*Rubles (RUB):*\n- `5000₽` or `5k RUB`\n\n*Tip:* Use "k" for thousands!\n`5k` is faster than `5000`',
    ru: '💰 *ФОРМАТЫ ЦЕН*\n\n*Рупии (IDR):*\n- `5000` = 5 тысяч\n- `5к` = 5 тысяч\n- `5,000` = 5 тысяч\n- `32.5к` = 32,500\n\n*Доллары (USD):*\n- `$6.70` = 6 долларов 70 центов\n- `$1000` или `1000 USD`\n\n*Рубли (RUB):*\n- `5000₽` или `5к RUB`\n\n*Совет:* Используй "к" вместо тысяч!\n`5к` быстрее чем `5000`',
  },
  'help.other_ways': {
    en: '📸 *OTHER WAYS TO ADD*\n\n*Receipt Photo:*\nSend photo - bot recognizes all items!\n\n*Quick Text:*\n`100 coffee` or `1500₽ taxi`\n\n*Quick Income:*\n`/income 100000 IDR salary`',
    ru: '📸 *ДРУГИЕ СПОСОБЫ*\n\n*Фото чека:*\nОтправь фото - бот распознает все товары!\n\n*Быстрый текст:*\n`100 coffee` или `1500₽ такси`\n\n*Быстрый доход:*\n`/income 100000 IDR зарплата`',
  },
  'help.commands': {
    en: '⚡️ *COMMANDS*\n\n/start - welcome message\n/verify <code> - connect account\n/balance - wallet balances\n/last - last 10 transactions\n/income <text> - add income\n/status - account status\n/language - change language\n/help - this guide',
    ru: '⚡️ *КОМАНДЫ*\n\n/start - приветствие\n/verify <код> - подключить аккаунт\n/balance - балансы кошельков\n/last - последние 10 транзакций\n/income <текст> - добавить доход\n/status - статус аккаунта\n/language - сменить язык\n/help - эта справка',
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
  'transaction.no_category': {
    en: 'No category',
    ru: 'Без категории',
  },
  'transaction.parse_error': {
    en: '❌ Could not parse transaction.\n\nExample: `100 coffee` or `1500₽ taxi`',
    ru: '❌ Не удалось распознать транзакцию.\n\nПример: `100 coffee` или `1500₽ такси`',
  },
  'transaction.parse_error_empty': {
    en: '❌ Message is empty.\n\nPlease send transaction text.\n\nExamples:\n• `50 RUB coffee`\n• `1500₽ taxi`\n• `20 lunch`',
    ru: '❌ Сообщение пустое.\n\nПожалуйста, отправьте текст транзакции.\n\nПримеры:\n• `50 RUB coffee`\n• `1500₽ такси`\n• `20 обед`',
  },
  'transaction.parse_error_no_amount': {
    en: '❌ Could not find an amount.\n\nPlease include a number in your message.\n\nExamples:\n• `50 RUB coffee`\n• `1500₽ taxi`\n• `20 lunch`',
    ru: '❌ Не удалось найти сумму.\n\nПожалуйста, укажите число в сообщении.\n\nПримеры:\n• `50 RUB coffee`\n• `1500₽ такси`\n• `20 обед`',
  },
  'transaction.parse_error_invalid_amount': {
    en: '❌ Amount must be a positive number.\n\nPlease check and try again.\n\nExamples:\n• `50 RUB coffee` ✅\n• `1500₽ taxi` ✅\n• `-20 lunch` ❌',
    ru: '❌ Сумма должна быть положительным числом.\n\nПожалуйста, проверьте и попробуйте снова.\n\nПримеры:\n• `50 RUB coffee` ✅\n• `1500₽ такси` ✅\n• `-20 обед` ❌',
  },
  'transaction.conversion': {
    en: 'Conversion',
    ru: 'Конвертация',
  },
  'transaction.usd_amount': {
    en: 'Amount in USD',
    ru: 'Стоимость в USD',
  },
  'transaction.total_capital': {
    en: 'Total Capital',
    ru: 'Общий капитал',
  },
  'transaction.budget_limit': {
    en: 'Budget Limit',
    ru: 'Лимит категории',
  },
  'transaction.edit_button': {
    en: '✏️ Edit',
    ru: '✏️ Редактировать',
  },
  'transaction.delete_button': {
    en: '🗑 Delete',
    ru: '🗑 Удалить',
  },
  'transaction.deleted': {
    en: '✅ Transaction deleted successfully.',
    ru: '✅ Транзакция успешно удалена.',
  },
  'transaction.delete_confirm': {
    en: '⚠️ Are you sure you want to delete this transaction?',
    ru: '⚠️ Вы уверены, что хотите удалить эту транзакцию?',
  },
  'transaction.delete_yes': {
    en: '✅ Yes, delete',
    ru: '✅ Да, удалить',
  },
  'transaction.delete_no': {
    en: '❌ Cancel',
    ru: '❌ Отмена',
  },
  'transaction.edit_coming_soon': {
    en: '⏳ Edit feature coming soon! For now, delete and create a new transaction.',
    ru: '⏳ Функция редактирования скоро появится! Пока что удалите и создайте новую транзакцию.',
  },
  'transaction.edit_prompt': {
    en: '✏️ *Edit Transaction*\n\nCurrent:\n💵 Amount: {amount} {currency}\n📝 Description: {description}\n\nSend new transaction data:\nExample: `150 coffee` or `2000₽ taxi`',
    ru: '✏️ *Редактирование транзакции*\n\nТекущее:\n💵 Сумма: {amount} {currency}\n📝 Описание: {description}\n\nОтправьте новые данные:\nПример: `150 coffee` или `2000₽ такси`',
  },
  'transaction.edit_cancelled': {
    en: '❌ Edit cancelled.',
    ru: '❌ Редактирование отменено.',
  },
  'transaction.edit_success': {
    en: '✅ Transaction updated!',
    ru: '✅ Транзакция обновлена!',
  },
  'transaction.edit_timeout': {
    en: '⏱ Edit timeout. Transaction was not changed.',
    ru: '⏱ Время редактирования истекло. Транзакция не изменена.',
  },

  // Status
  'status.connected': {
    en: '✅ *Connection Status*\n\nYou are connected to Budget Buddy!\n\n👤 Name: {name}\n📱 Telegram: @{username}\n🌐 Language: {language}',
    ru: '✅ *Статус подключения*\n\nВы подключены к Budget Buddy!\n\n👤 Имя: {name}\n📱 Telegram: @{username}\n🌐 Язык: {language}',
  },
  'status.not_connected': {
    en: '❌ *Not Connected*\n\nYou are not connected to Budget Buddy yet.\n\nTo connect:\n1. Open Budget Buddy web app\n2. Go to Settings\n3. Generate verification code\n4. Send `/verify <code>` here',
    ru: '❌ *Не подключено*\n\nВы еще не подключены к Budget Buddy.\n\nЧтобы подключиться:\n1. Откройте веб-приложение Budget Buddy\n2. Перейдите в Настройки\n3. Сгенерируйте код верификации\n4. Отправьте `/verify <код>` сюда',
  },

  // Last transactions
  'last.title': {
    en: '📋 *Last 5 Transactions*',
    ru: '📋 *Последние 5 транзакций*',
  },
  'last.no_transactions': {
    en: 'No transactions yet.\n\nStart tracking: `100 coffee` or `1500₽ taxi`',
    ru: 'Транзакций пока нет.\n\nНачните учёт: `100 coffee` или `1500₽ такси`',
  },
  'last.income': {
    en: '💰 Income',
    ru: '💰 Доход',
  },
  'last.expense': {
    en: '💸 Expense',
    ru: '💸 Расход',
  },

  // Income command
  'income.usage': {
    en: '❌ *Usage:* `/income <amount> <description>`\n\nExamples:\n• `/income 5000 RUB salary`\n• `/income 1000₽ freelance`\n• `/income 200 bonus`',
    ru: '❌ *Использование:* `/income <сумма> <описание>`\n\nПримеры:\n• `/income 5000 RUB зарплата`\n• `/income 1000₽ фриланс`\n• `/income 200 бонус`',
  },
  'income.confirm_question': {
    en: 'Add this income?',
    ru: 'Добавить этот доход?',
  },
  'income.confirm_button': {
    en: '✅ Confirm',
    ru: '✅ Подтвердить',
  },
  'income.cancel_button': {
    en: '❌ Cancel',
    ru: '❌ Отмена',
  },
  'income.cancelled': {
    en: '❌ Income cancelled.',
    ru: '❌ Доход отменён.',
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
  'receipt.no_api_key': {
    en: '❌ Receipt scanning requires an AI API key.\n\nTo use OCR:\n1. Open Budget Buddy → Settings\n2. Add your Anthropic API key\n3. Try scanning again\n\nOr enter manually: `100 coffee`',
    ru: '❌ Для сканирования чеков нужен AI API ключ.\n\nЧтобы использовать OCR:\n1. Откройте Budget Buddy → Настройки\n2. Добавьте ваш Anthropic API ключ\n3. Попробуйте снова\n\nИли введите вручную: `100 coffee`',
  },
  'receipt.added': {
    en: 'Transaction added!',
    ru: 'Транзакция добавлена!',
  },
  'receipt.expired': {
    en: '⏱ Receipt confirmation expired. Please scan again.',
    ru: '⏱ Время подтверждения чека истекло. Отсканируйте снова.',
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

  // Daily Summary
  'daily_summary.title': {
    en: '📊 *Daily Summary*',
    ru: '📊 *Ежедневный отчёт*',
  },
  'daily_summary.date': {
    en: '📅 {date}',
    ru: '📅 {date}',
  },
  'daily_summary.good_morning': {
    en: 'Good Morning!',
    ru: 'Доброе утро!',
  },
  'daily_summary.today_planned': {
    en: "Today's Planned Expenses",
    ru: 'Запланированные расходы на сегодня',
  },
  'daily_summary.week_upcoming': {
    en: 'This Week Upcoming',
    ru: 'Предстоящие расходы на неделю',
  },
  'daily_summary.budget_status': {
    en: 'Budget Status',
    ru: 'Статус бюджета',
  },
  'daily_summary.capital': {
    en: 'Monthly Capital',
    ru: 'Капитал за месяц',
  },
  'daily_summary.total': {
    en: 'Total',
    ru: 'Итого',
  },
  'daily_summary.week_total': {
    en: 'Week Total',
    ru: 'Всего за неделю',
  },
  'daily_summary.income': {
    en: 'Income',
    ru: 'Доходы',
  },
  'daily_summary.expenses': {
    en: 'Expenses',
    ru: 'Расходы',
  },
  'daily_summary.available': {
    en: 'Available',
    ru: 'Доступно',
  },
  'daily_summary.overspent': {
    en: 'Overspent',
    ru: 'Превышение',
  },
  'daily_summary.remaining': {
    en: 'Remaining',
    ru: 'Осталось',
  },

  // Budget Alerts
  'budget.alert.exceeded': {
    en: 'Budget Limit Exceeded',
    ru: 'Превышен лимит бюджета',
  },
  'budget.alert.warning': {
    en: 'Budget Alert',
    ru: 'Предупреждение о бюджете',
  },
  'budget.alert.limit': {
    en: 'Limit',
    ru: 'Лимит',
  },
  'budget.alert.spent': {
    en: 'Spent',
    ru: 'Потрачено',
  },
  'budget.alert.overspent': {
    en: 'Overspent',
    ru: 'Превышение',
  },
  'budget.alert.remaining': {
    en: 'Remaining',
    ru: 'Осталось',
  },
  'budget.alert.goals_delayed': {
    en: '⚠️ Your savings goals may be delayed.',
    ru: '⚠️ Ваши цели могут быть отложены.',
  },
  'budget.alert.slow_down': {
    en: '💡 Slow down to stay on track!',
    ru: '💡 Снизьте расходы, чтобы не выйти за рамки!',
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
  const separator = '\n\n━━━━━━━━━━━━━━━━━━━━\n\n';
  
  return `${t('help.title', lang)}${separator}${t('help.shopping_lists', lang)}${separator}${t('help.currency_formats', lang)}${separator}${t('help.other_ways', lang)}${separator}${t('help.commands', lang)}`;
}

/**
 * Auth translations - Welcome, verification, status
 */

import { Translations } from './types';

export const authTranslations: Translations = {
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

  // Status
  'status.connected': {
    en: '✅ *Connection Status*\n\nYou are connected to Budget Buddy!\n\n👤 Name: {name}\n📱 Telegram: @{username}\n🌐 Language: {language}',
    ru: '✅ *Статус подключения*\n\nВы подключены к Budget Buddy!\n\n👤 Имя: {name}\n📱 Telegram: @{username}\n🌐 Язык: {language}',
  },
  'status.not_connected': {
    en: '❌ *Not Connected*\n\nYou are not connected to Budget Buddy yet.\n\nTo connect:\n1. Open Budget Buddy web app\n2. Go to Settings\n3. Generate verification code\n4. Send `/verify <code>` here',
    ru: '❌ *Не подключено*\n\nВы еще не подключены к Budget Buddy.\n\nЧтобы подключиться:\n1. Откройте веб-приложение Budget Buddy\n2. Перейдите в Настройки\n3. Сгенерируйте код верификации\n4. Отправьте `/verify <код>` сюда',
  },

  // Web Auth Page
  'auth.app_title': { en: 'Budget Buddy', ru: 'Budget Buddy' },
  'auth.app_description': { en: 'Manage your personal finances with ease', ru: 'Управляйте личными финансами легко' },

  // Tabs
  'auth.login': { en: 'Login', ru: 'Вход' },
  'auth.register': { en: 'Register', ru: 'Регистрация' },

  // Login Form
  'auth.welcome_back': { en: 'Welcome back', ru: 'С возвращением' },
  'auth.login_description': { en: 'Enter your credentials to access your account', ru: 'Введите данные для входа в аккаунт' },
  'auth.email': { en: 'Email', ru: 'Email' },
  'auth.email_placeholder': { en: 'you@example.com', ru: 'your@example.com' },
  'auth.password': { en: 'Password', ru: 'Пароль' },
  'auth.password_placeholder': { en: '••••••••', ru: '••••••••' },
  'auth.login_button': { en: 'Login', ru: 'Войти' },
  'auth.forgot_password': { en: 'Forgot password?', ru: 'Забыли пароль?' },
  'auth.or_continue_with': { en: 'Or continue with', ru: 'Или войти через' },
  
  // Telegram Link Prompt
  'auth.link_telegram_title': { en: 'Sync with Telegram?', ru: 'Синхронизировать с Telegram?' },
  'auth.link_telegram_description': { 
    en: 'Next time you can log in automatically without entering your email and password. This will only take a few seconds.', 
    ru: 'В следующий раз вы сможете войти автоматически без ввода логина и пароля. Это займет всего несколько секунд.' 
  },
  'auth.link_telegram_accept': { en: 'Yes, sync', ru: 'Да, синхронизировать' },
  'auth.link_telegram_later': { en: 'Later', ru: 'Позже' },
  'auth.link_telegram_success': { en: '✅ Done!', ru: '✅ Готово!' },
  'auth.link_telegram_success_description': { 
    en: 'Next time you can log in automatically', 
    ru: 'В следующий раз вход будет автоматическим' 
  },
  'auth.link_telegram_error': { en: '❌ Error', ru: '❌ Ошибка' },
  'auth.link_telegram_error_description': { 
    en: 'Failed to link Telegram account', 
    ru: 'Не удалось связать Telegram аккаунт' 
  },
  
  // Add Email Form
  'auth.add_email_description': { 
    en: 'Add email to your account for password recovery and better security', 
    ru: 'Добавьте email для восстановления пароля и повышения безопасности' 
  },
  'auth.add_email_button': { en: 'Add Email', ru: 'Добавить Email' },
  'auth.adding_email': { en: 'Adding...', ru: 'Добавление...' },
  'auth.add_email_title': { en: 'Add Email to Account', ru: 'Добавить Email к аккаунту' },
  'auth.add_email_dialog_description': { 
    en: 'Please add an email address and password to your account for better security and password recovery.', 
    ru: 'Пожалуйста, добавьте email адрес и пароль к вашему аккаунту для повышения безопасности и восстановления пароля.' 
  },
  'auth.email_added_success': { en: '✅ Email added!', ru: '✅ Email добавлен!' },
  'auth.email_added_description': { 
    en: 'Your account is now more secure', 
    ru: 'Ваш аккаунт теперь более защищен' 
  },
  'auth.email_add_error': { en: '❌ Error', ru: '❌ Ошибка' },

  // Register Form
  'auth.create_account': { en: 'Create account', ru: 'Создать аккаунт' },
  'auth.register_description': { en: 'Get started with Budget Buddy today', ru: 'Начните использовать Budget Buddy' },
  'auth.name': { en: 'Name', ru: 'Имя' },
  'auth.name_placeholder': { en: 'Your name', ru: 'Ваше имя' },
  'auth.register_button': { en: 'Register', ru: 'Зарегистрироваться' },

  // Validation Messages
  'auth.invalid_email': { en: 'Invalid email address', ru: 'Неверный email адрес' },
  'auth.password_min_length': { en: 'Password must be at least 6 characters', ru: 'Пароль должен быть не менее 6 символов' },
  'auth.name_required': { en: 'Name is required', ru: 'Имя обязательно' },

  // Hero Section
  'auth.hero_title': { en: 'Your Financial Journey Starts Here', ru: 'Ваш финансовый путь начинается здесь' },
  'auth.hero_subtitle': { en: 'Take control of your finances with intelligent tracking and insights', ru: 'Управляйте финансами с интеллектуальным трекингом и аналитикой' },
  'auth.feature_tracking': { en: 'Smart Expense Tracking', ru: 'Умный учёт расходов' },
  'auth.feature_ai': { en: 'AI-Powered Insights', ru: 'AI-аналитика' },
  'auth.feature_goals': { en: 'Financial Goal Planning', ru: 'Планирование целей' },
  'auth.feature_secure': { en: 'Bank-Level Security', ru: 'Банковская безопасность' },
};

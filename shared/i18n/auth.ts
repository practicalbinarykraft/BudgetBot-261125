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
};

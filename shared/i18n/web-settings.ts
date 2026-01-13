/**
 * Web Settings page translations
 */

import { Translations } from './types';

export const webSettingsTranslations: Translations = {
  'settings.title': {
    en: 'Settings',
    ru: 'Настройки',
  },
  'settings.general': {
    en: 'General',
    ru: 'Основные',
  },
  'settings.language': {
    en: 'Language',
    ru: 'Язык',
  },
  'settings.language.english': {
    en: 'English',
    ru: 'Английский',
  },
  'settings.language.russian': {
    en: 'Russian',
    ru: 'Русский',
  },
  'settings.currency': {
    en: 'Default Currency',
    ru: 'Валюта по умолчанию',
  },
  'settings.timezone': {
    en: 'Timezone',
    ru: 'Часовой пояс',
  },
  'settings.notifications': {
    en: 'Notifications',
    ru: 'Уведомления',
  },
  'settings.telegram_notifications': {
    en: 'Telegram Notifications',
    ru: 'Уведомления в Telegram',
  },
  'settings.notification_time': {
    en: 'Notification Time',
    ru: 'Время уведомлений',
  },
  'settings.telegram': {
    en: 'Telegram Integration',
    ru: 'Интеграция с Telegram',
  },
  'settings.telegram_id': {
    en: 'Telegram ID',
    ru: 'Telegram ID',
  },
  'settings.verification_code': {
    en: 'Verification Code',
    ru: 'Код верификации',
  },
  'settings.generate_code': {
    en: 'Generate Code',
    ru: 'Сгенерировать код',
  },
  'settings.code_instructions': {
    en: 'Send this code to the bot: /verify {code}',
    ru: 'Отправьте этот код боту: /verify {code}',
  },
  'settings.ai_settings': {
    en: 'AI Settings',
    ru: 'Настройки AI',
  },
  'settings.anthropic_api_key': {
    en: 'Anthropic API Key',
    ru: 'Anthropic API ключ',
  },
  'settings.api_key_placeholder': {
    en: 'Enter your API key',
    ru: 'Введите ваш API ключ',
  },
  'settings.api_key_saved': {
    en: 'API key saved successfully',
    ru: 'API ключ успешно сохранен',
  },
  'settings.exchange_rates': {
    en: 'Exchange Rates',
    ru: 'Курсы валют',
  },
  'settings.exchange_rates.description': {
    en: 'Configure custom exchange rates for currencies',
    ru: 'Настройте курсы обмена валют',
  },
  'settings.exchange_rates.units_per_usd': {
    en: 'Units per 1 USD',
    ru: 'Единиц за 1 USD',
  },
  'settings.exchange_rates.customize': {
    en: 'Customize currency conversion rates. Configure the currencies you use, and the AI will only suggest those currencies. Leave empty to disable a currency. Changes apply to all future transactions and Telegram bot conversions.',
    ru: 'Настройте курсы конвертации валют. Укажите валюты, которые вы используете, и AI будет предлагать только их. Оставьте пустым, чтобы отключить валюту. Изменения применяются ко всем будущим транзакциям и конвертациям в Telegram боте.',
  },
  'settings.notification_settings': {
    en: 'Notification Settings',
    ru: 'Настройки уведомлений',
  },
  'settings.notification_settings.description': {
    en: 'Configure when you receive daily notifications from the Telegram bot',
    ru: 'Настройте время получения ежедневных уведомлений от Telegram бота',
  },
  'settings.timezone.description': {
    en: 'Used to send daily notifications at the right time for your location',
    ru: 'Используется для отправки уведомлений в правильное время для вашего региона',
  },
  'settings.notification_time.description': {
    en: 'Time when you want to receive daily budget summary (in your timezone)',
    ru: 'Время получения ежедневной сводки по бюджету (в вашем часовом поясе)',
  },
  'settings.anthropic_api_key.description': {
    en: 'Your personal Anthropic API key for AI-powered forecasting and analysis. Get one at console.anthropic.com',
    ru: 'Ваш личный API ключ Anthropic для AI прогнозов и анализа. Получить можно на console.anthropic.com',
  },
  'settings.anthropic_api_key.placeholder': {
    en: 'sk-ant-...',
    ru: 'sk-ant-...',
  },
  'settings.openai_api_key': {
    en: 'OpenAI API Key',
    ru: 'OpenAI API ключ',
  },
  'settings.openai_api_key.description': {
    en: 'Your personal OpenAI API key for voice message transcription in Telegram bot. Get one at platform.openai.com/api-keys',
    ru: 'Ваш личный API ключ OpenAI для транскрипции голосовых сообщений в Telegram боте. Получить можно на platform.openai.com/api-keys',
  },
  'settings.openai_api_key.placeholder': {
    en: 'sk-proj-...',
    ru: 'sk-proj-...',
  },
  'settings.api_keys_tier_required': {
    en: '🔑 API keys are available only on the MySelf tier. To use your own API keys, please contact support to upgrade your plan.',
    ru: '🔑 API ключи доступны только на тарифе MySelf. Для использования своих API ключей обратитесь в поддержку для перехода на этот тариф.',
  },
  'settings.general_settings': {
    en: 'General Settings',
    ru: 'Общие настройки',
  },
  'settings.manage_preferences': {
    en: 'Manage your preferences',
    ru: 'Управление вашими предпочтениями',
  },
  'settings.select_currency': {
    en: 'Select currency',
    ru: 'Выберите валюту',
  },
  'settings.select_language': {
    en: 'Select language',
    ru: 'Выберите язык',
  },
  'settings.receive_alerts': {
    en: 'Get reminders about upcoming expenses in Telegram',
    ru: 'Получать напоминания о предстоящих расходах в Telegram',
  },
  'settings.telegram_connected': {
    en: 'Connected',
    ru: 'Подключен',
  },
  'settings.telegram_not_connected': {
    en: 'Not Connected',
    ru: 'Не подключен',
  },
  'settings.telegram_disconnected': {
    en: 'Telegram account disconnected successfully',
    ru: 'Telegram аккаунт успешно отключен',
  },
  'settings.disconnect': {
    en: 'Disconnect',
    ru: 'Отключить',
  },
  'settings.connected_as': {
    en: 'Connected as',
    ru: 'Подключен как',
  },
  'settings.code_expires_in': {
    en: 'Code expires in',
    ru: 'Код истекает через',
  },
  'settings.code_generated': {
    en: 'Your verification code expires in {minutes} minutes',
    ru: 'Ваш код подтверждения истекает через {minutes} минут',
  },
  'settings.save_settings': {
    en: 'Save Settings',
    ru: 'Сохранить настройки',
  },
  'settings.saved': {
    en: 'Settings saved',
    ru: 'Настройки сохранены',
  },
  'settings.save_error': {
    en: 'Failed to save settings',
    ru: 'Не удалось сохранить настройки',
  },
  'settings.exchange_rate_rub': {
    en: 'RUB to USD Rate',
    ru: 'Курс RUB к USD',
  },
  'settings.exchange_rate_rub.description': {
    en: 'How many Russian Rubles equal 1 USD (e.g., 92.5 means 1 USD = 92.5 RUB)',
    ru: 'Сколько российских рублей равно 1 USD (например, 92.5 означает 1 USD = 92.5 RUB)',
  },
  'settings.exchange_rate_idr': {
    en: 'IDR to USD Rate',
    ru: 'Курс IDR к USD',
  },
  'settings.exchange_rate_idr.description': {
    en: 'How many Indonesian Rupiah equal 1 USD (e.g., 15750 means 1 USD = 15,750 IDR)',
    ru: 'Сколько индонезийских рупий равно 1 USD (например, 15750 означает 1 USD = 15,750 IDR)',
  },
  'settings.exchange_rate_krw': {
    en: 'KRW to USD Rate',
    ru: 'Курс KRW к USD',
  },
  'settings.exchange_rate_krw.description': {
    en: 'How many Korean Won equal 1 USD (e.g., 1300 means 1 USD = 1,300 KRW)',
    ru: 'Сколько корейских вон равно 1 USD (например, 1300 означает 1 USD = 1,300 KRW)',
  },
  'settings.exchange_rate_eur': {
    en: 'EUR to USD Rate',
    ru: 'Курс EUR к USD',
  },
  'settings.exchange_rate_eur.description': {
    en: 'How many Euros equal 1 USD (e.g., 0.92 means 1 USD = 0.92 EUR)',
    ru: 'Сколько евро равно 1 USD (например, 0.92 означает 1 USD = 0.92 EUR)',
  },
  'settings.exchange_rate_cny': {
    en: 'CNY to USD Rate',
    ru: 'Курс CNY к USD',
  },
  'settings.exchange_rate_cny.description': {
    en: 'How many Chinese Yuan equal 1 USD (e.g., 7.2 means 1 USD = 7.2 CNY)',
    ru: 'Сколько китайских юаней равно 1 USD (например, 7.2 означает 1 USD = 7.2 CNY)',
  },
  'settings.last_updated': {
    en: 'Last updated',
    ru: 'Последнее обновление',
  },
  'settings.telegram_integration': {
    en: 'Telegram Integration',
    ru: 'Интеграция с Telegram',
  },
  'settings.telegram_integration.description': {
    en: 'Connect your Telegram account to track expenses on the go',
    ru: 'Подключите Telegram для отслеживания расходов в пути',
  },
  'settings.connection_status': {
    en: 'Connection Status',
    ru: 'Статус подключения',
  },
  'settings.connected_account': {
    en: 'Your Telegram account is connected. You can now send expenses directly to the bot!',
    ru: 'Ваш Telegram аккаунт подключен. Теперь можно отправлять расходы боту!',
  },
  'settings.disconnect_telegram': {
    en: 'Disconnect Telegram',
    ru: 'Отключить Telegram',
  },
  'settings.disconnecting': {
    en: 'Disconnecting',
    ru: 'Отключение',
  },
  'settings.generate_code_description': {
    en: 'Generate a verification code to link your Telegram account',
    ru: 'Сгенерируйте код для привязки вашего Telegram аккаунта',
  },
  'settings.generating': {
    en: 'Generating',
    ru: 'Генерация',
  },
  'settings.verification_code_label': {
    en: 'Your Verification Code:',
    ru: 'Ваш код подтверждения:',
  },
  'settings.expires_in': {
    en: 'Expires in',
    ru: 'Истекает через',
  },
  'settings.how_to_connect': {
    en: 'How to connect:',
    ru: 'Как подключить:',
  },
  'settings.telegram_step1': {
    en: 'Open Telegram and find @ai_budgetbuddy_bot',
    ru: 'Откройте Telegram и найдите @ai_budgetbuddy_bot',
  },
  'settings.telegram_step2': {
    en: 'Send the command',
    ru: 'Отправьте команду',
  },
  'settings.telegram_step3': {
    en: 'Start tracking expenses instantly!',
    ru: 'Начните отслеживать расходы мгновенно!',
  },
  'settings.cancel': {
    en: 'Cancel',
    ru: 'Отмена',
  },
  'settings.account_information': {
    en: 'Account Information',
    ru: 'Информация об аккаунте',
  },
  'settings.email': {
    en: 'Email',
    ru: 'Email',
  },
  'settings.user_id': {
    en: 'User ID',
    ru: 'ID пользователя',
  },
  'settings.select_timezone': {
    en: 'Select timezone',
    ru: 'Выберите часовой пояс',
  },
};

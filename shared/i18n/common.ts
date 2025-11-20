/**
 * Common translations - Shared across app (errors, language, buttons)
 */

import { Translations } from './types';

export const commonTranslations: Translations = {
  // Common UI
  'common.error': {
    en: 'Error',
    ru: 'Ошибка',
  },
  'common.loading': {
    en: 'Loading...',
    ru: 'Загрузка...',
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

  // Common buttons
  'button.confirm': {
    en: '✅ Confirm',
    ru: '✅ Подтвердить',
  },
  'button.cancel': {
    en: '❌ Cancel',
    ru: '❌ Отмена',
  },
  'button.save': {
    en: 'Save',
    ru: 'Сохранить',
  },
  'button.delete': {
    en: 'Delete',
    ru: 'Удалить',
  },
  'button.edit': {
    en: 'Edit',
    ru: 'Редактировать',
  },

  // Common fields
  'common.name': {
    en: 'Name',
    ru: 'Название',
  },
  'common.description': {
    en: 'Description',
    ru: 'Описание',
  },
  'common.amount': {
    en: 'Amount',
    ru: 'Сумма',
  },
  'common.category': {
    en: 'Category',
    ru: 'Категория',
  },
  'common.type': {
    en: 'Type',
    ru: 'Тип',
  },
  'common.date': {
    en: 'Date',
    ru: 'Дата',
  },
  'common.currency': {
    en: 'Currency',
    ru: 'Валюта',
  },
  'common.balance': {
    en: 'Balance',
    ru: 'Баланс',
  },

  // Voice Messages
  'voice.no_api_key': {
    en: '🎤 *Voice transcription unavailable*\n\nPlease add your OpenAI API key in Settings to use voice messages.\n\n1. Open Budget Buddy → Settings\n2. Add OpenAI API Key\n3. Get key at platform.openai.com/api-keys',
    ru: '🎤 *Транскрипция голосовых недоступна*\n\nДобавьте OpenAI API ключ в Настройках для использования голосовых сообщений.\n\n1. Откройте Budget Buddy → Настройки\n2. Добавьте OpenAI API ключ\n3. Получить ключ: platform.openai.com/api-keys',
  },
  'voice.transcribing': {
    en: '🎤 Transcribing voice message...',
    ru: '🎤 Распознаю голосовое сообщение...',
  },
  'voice.transcribed': {
    en: '✅ *Transcribed*',
    ru: '✅ *Распознано*',
  },
  'voice.ai_processed': {
    en: '🤖 AI processed',
    ru: '🤖 AI обработал',
  },
  'voice.download_error': {
    en: '❌ Failed to download voice message. Please try again.',
    ru: '❌ Не удалось загрузить голосовое сообщение. Попробуйте снова.',
  },
  'voice.error_invalid_key': {
    en: '❌ Invalid OpenAI API key. Please check your key in Settings.',
    ru: '❌ Неверный OpenAI API ключ. Проверьте ключ в Настройках.',
  },
  'voice.error_rate_limit': {
    en: '❌ OpenAI API rate limit exceeded. Please try again later.',
    ru: '❌ Превышен лимит запросов OpenAI API. Попробуйте позже.',
  },
  'voice.error_file_too_large': {
    en: '❌ Voice message is too large. Maximum 25MB.',
    ru: '❌ Голосовое сообщение слишком большое. Максимум 25МБ.',
  },
  'voice.error_transcription_failed': {
    en: '❌ Failed to transcribe voice message. Please try again.',
    ru: '❌ Не удалось распознать голосовое сообщение. Попробуйте снова.',
  },
  'voice.error_unknown': {
    en: '❌ Unknown error occurred during transcription.',
    ru: '❌ Неизвестная ошибка при транскрипции.',
  },
  'voice.error_unexpected': {
    en: '❌ Unexpected error while processing voice message.',
    ru: '❌ Неожиданная ошибка при обработке голосового сообщения.',
  },
};

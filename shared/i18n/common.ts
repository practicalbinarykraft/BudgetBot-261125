/**
 * Common translations - Shared across app (errors, language, buttons)
 */

import { Translations } from './types';

export const commonTranslations: Translations = {
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
};

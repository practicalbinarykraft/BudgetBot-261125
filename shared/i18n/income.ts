/**
 * Income command translations
 */

import { Translations } from './types';

export const incomeTranslations: Translations = {
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
};

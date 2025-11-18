/**
 * Receipt OCR translations
 */

import { Translations } from './types';

export const receiptTranslations: Translations = {
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
};

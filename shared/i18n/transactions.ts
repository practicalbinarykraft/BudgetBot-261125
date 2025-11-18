/**
 * Transaction translations - Add, edit, delete transactions
 */

import { Translations } from './types';

export const transactionTranslations: Translations = {
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
};

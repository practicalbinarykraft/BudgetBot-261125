/**
 * Notifications translations - Daily summary, budget alerts
 */

import { Translations } from './types';

export const notificationTranslations: Translations = {
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

import type { Translations } from './types';

export const webDashboardChartsTranslations: Translations = {
  // Financial Trend Chart
  'dashboard.financial_trend_title': {
    en: 'Financial Trend',
    ru: 'Финансовый тренд',
  },
  'dashboard.financial_trend_subtitle': {
    en: 'Income, expenses, and capital over time with AI forecast',
    ru: 'Доходы, расходы и капитал с AI прогнозом',
  },
  'dashboard.chart_today': {
    en: 'Today',
    ru: 'Сегодня',
  },
  'dashboard.chart_income': {
    en: 'Income',
    ru: 'Доходы',
  },
  'dashboard.chart_expense': {
    en: 'Expense',
    ru: 'Расходы',
  },
  'dashboard.chart_capital': {
    en: 'Capital',
    ru: 'Капитал',
  },
  'dashboard.chart_capital_actual': {
    en: 'Capital (Actual)',
    ru: 'Капитал (Факт)',
  },
  'dashboard.chart_capital_forecast': {
    en: 'Capital (Forecast)',
    ru: 'Капитал (Прогноз)',
  },
  'dashboard.chart_forecast': {
    en: 'Forecast',
    ru: 'Прогноз',
  },
  'dashboard.chart_goal_markers': {
    en: 'Goal Markers (click for details)',
    ru: 'Метки целей (клик для деталей)',
  },
  
  // Forecast Filters
  'dashboard.forecast_filters_title': {
    en: 'Include in forecast:',
    ru: 'Включить в прогноз:',
  },
  'dashboard.filter_recurring': {
    en: 'Recurring transactions',
    ru: 'Повторяющиеся транзакции',
  },
  'dashboard.filter_recurring_desc': {
    en: 'Automatic income and expenses',
    ru: 'Автоматические доходы и расходы',
  },
  'dashboard.filter_planned_income': {
    en: 'Planned income',
    ru: 'Запланированные доходы',
  },
  'dashboard.filter_planned_income_desc': {
    en: 'Expected payments from clients',
    ru: 'Ожидаемые поступления от клиентов',
  },
  'dashboard.filter_planned_expenses': {
    en: 'Planned expenses',
    ru: 'Запланированные расходы',
  },
  'dashboard.filter_planned_expenses_desc': {
    en: 'Large purchases and payments',
    ru: 'Крупные покупки и платежи',
  },
  'dashboard.filter_budget_limits': {
    en: 'Budget limits (max expenses)',
    ru: 'Бюджетные лимиты (макс. расходы)',
  },
  'dashboard.filter_budget_limits_desc': {
    en: 'Worst case scenario',
    ru: 'Худший сценарий',
  },
  
  // Budget Warning
  'dashboard.budget_warning_title': {
    en: 'Warning: Risk of insufficient funds',
    ru: 'Предупреждение: Риск нехватки средств',
  },
  'dashboard.budget_warning_desc': {
    en: 'If you spend all budget limits, capital will go negative',
    ru: 'Если потратить все лимиты, капитал уйдёт в минус',
  },
  'dashboard.budget_warning_recommendations': {
    en: 'Consider: lower budget limits, increase income, or postpone large purchases',
    ru: 'Рекомендации: снизить лимиты, увеличить доходы или отложить покупки',
  },
};

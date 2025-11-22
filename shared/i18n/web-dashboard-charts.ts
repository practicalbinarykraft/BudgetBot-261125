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
  'dashboard.chart_assets_liabilities': {
    en: 'Assets & Liabilities',
    ru: 'Активы и обязательства',
  },
  
  // Forecast Filters
  'dashboard.forecast_filters_title': {
    en: 'Include in forecast:',
    ru: 'Включить в прогноз:',
  },
  'dashboard.filter_recurring_income': {
    en: 'Recurring income',
    ru: 'Повторяющиеся доходы',
  },
  'dashboard.filter_recurring_income_desc': {
    en: 'Automatic income',
    ru: 'Автоматические доходы',
  },
  'dashboard.filter_recurring_expense': {
    en: 'Recurring expenses',
    ru: 'Повторяющиеся расходы',
  },
  'dashboard.filter_recurring_expense_desc': {
    en: 'Automatic expenses',
    ru: 'Автоматические расходы',
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
    en: 'Budget limits',
    ru: 'Бюджетные лимиты',
  },
  'dashboard.filter_budget_limits_desc': {
    en: 'Worst case scenario',
    ru: 'Худший сценарий',
  },
  'dashboard.filter_asset_income': {
    en: 'Asset income',
    ru: 'Доход от активов',
  },
  'dashboard.filter_asset_income_desc': {
    en: 'Rental income, dividends',
    ru: 'Аренда, дивиденды',
  },
  'dashboard.filter_liability_expense': {
    en: 'Liability expenses',
    ru: 'Расходы на пассивы',
  },
  'dashboard.filter_liability_expense_desc': {
    en: 'Loan payments, maintenance',
    ru: 'Платежи по кредитам, обслуживание',
  },
  'dashboard.filter_apply_button': {
    en: 'Update chart',
    ru: 'Обновить график',
  },
  
  // Capital Mode
  'dashboard.capital_mode_title': {
    en: 'Capital calculation mode:',
    ru: 'Режим расчёта капитала:',
  },
  'dashboard.capital_mode_cash': {
    en: 'Cash only',
    ru: 'Только деньги',
  },
  'dashboard.capital_mode_cash_desc': {
    en: 'Cash + income - expenses',
    ru: 'Деньги + доходы - расходы',
  },
  'dashboard.capital_mode_networth': {
    en: 'Full net worth',
    ru: 'Полный капитал',
  },
  'dashboard.capital_mode_networth_desc': {
    en: 'Cash + asset value - liabilities',
    ru: 'Деньги + стоимость имущества - долги',
  },
  'dashboard.capital_mode_networth_hint': {
    en: 'Gold line shows asset value changes including property appreciation, equipment depreciation, and loan repayments.',
    ru: 'Золотая линия показывает изменение стоимости имущества: рост недвижимости, падение техники и погашение кредитов.',
  },
  
  // AI Forecast Toggle
  'dashboard.ai_forecast_toggle': {
    en: 'AI Forecast',
    ru: 'AI Прогноз',
  },
  'dashboard.ai_forecast_enabled': {
    en: 'AI forecast active',
    ru: 'AI прогноз активен',
  },
  'dashboard.ai_forecast_disabled': {
    en: 'Linear forecast',
    ru: 'Линейный прогноз',
  },
  'dashboard.ai_forecast_from_cache': {
    en: 'from cache (free)',
    ru: 'из кеша (бесплатно)',
  },
  'dashboard.ai_forecast_cache_expires': {
    en: 'Cache expires',
    ru: 'Кеш истекает',
  },
  
  // AI Warning Dialog
  'dashboard.ai_warning_title': {
    en: 'Enable AI Forecast?',
    ru: 'Включить AI прогноз?',
  },
  'dashboard.ai_warning_description': {
    en: 'AI forecast analyzes your spending patterns and trends for more accurate predictions.',
    ru: 'AI прогноз анализирует паттерны ваших трат и тренды для более точных предсказаний.',
  },
  'dashboard.ai_warning_cost': {
    en: 'This will use your Anthropic API key and cost approximately $0.15-0.30 per request.',
    ru: 'Это использует ваш Anthropic API ключ и стоит примерно $0.15-0.30 за запрос.',
  },
  'dashboard.ai_warning_cache': {
    en: 'Results are cached for 12 hours, so repeated requests are free during that time.',
    ru: 'Результаты кешируются на 12 часов, повторные запросы в этот период бесплатны.',
  },
  'dashboard.ai_warning_confirm': {
    en: 'Generate AI Forecast',
    ru: 'Сгенерировать AI прогноз',
  },
  'dashboard.ai_warning_cancel': {
    en: 'Keep linear forecast',
    ru: 'Оставить линейный прогноз',
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
  
  // Forecast Errors
  'dashboard.forecast_error_generic': {
    en: 'Failed to load forecast data. Please try again.',
    ru: 'Не удалось загрузить прогноз. Попробуйте снова.',
  },
};

/**
 * Admin Panel Translations
 * 
 * Translations for admin panel interface
 */

import { Translations } from './types';

export const adminTranslations: Translations = {
  // Layout
  'admin.layout.title': {
    en: 'BudgetBot Admin',
    ru: 'Админ-панель BudgetBot',
  },
  'admin.layout.version': {
    en: 'Admin Panel v1.0',
    ru: 'Админ-панель v1.0',
  },
  'admin.layout.logout': {
    en: 'Logout',
    ru: 'Выйти',
  },

  // Navigation
  'admin.nav.dashboard': {
    en: 'Dashboard',
    ru: 'Панель управления',
  },
  'admin.nav.users': {
    en: 'Users',
    ru: 'Пользователи',
  },
  'admin.nav.analytics': {
    en: 'Analytics',
    ru: 'Аналитика',
  },
  'admin.nav.broadcasts': {
    en: 'Broadcasts',
    ru: 'Рассылки',
  },
  'admin.nav.support': {
    en: 'Support',
    ru: 'Поддержка',
  },
  'admin.nav.audit_log': {
    en: 'Audit Log',
    ru: 'Журнал аудита',
  },
  'admin.nav.system': {
    en: 'System',
    ru: 'Система',
  },

  // Dashboard
  'admin.dashboard.title': {
    en: 'Dashboard',
    ru: 'Панель управления',
  },
  'admin.dashboard.description': {
    en: 'Overview of key metrics and system status',
    ru: 'Обзор ключевых метрик и статуса системы',
  },
  'admin.dashboard.mrr': {
    en: 'MRR',
    ru: 'MRR',
  },
  'admin.dashboard.total_users': {
    en: 'Total Users',
    ru: 'Всего пользователей',
  },
  'admin.dashboard.active_today': {
    en: 'active today',
    ru: 'активных сегодня',
  },
  'admin.dashboard.ltv': {
    en: 'LTV',
    ru: 'LTV',
  },
  'admin.dashboard.ltv_description': {
    en: 'Average lifetime value',
    ru: 'Средняя ценность клиента',
  },
  'admin.dashboard.cac': {
    en: 'CAC',
    ru: 'CAC',
  },
  'admin.dashboard.mrr_growth': {
    en: 'MRR Growth',
    ru: 'Рост MRR',
  },
  'admin.dashboard.mrr_growth_description': {
    en: 'Monthly recurring revenue over time',
    ru: 'Месячный регулярный доход по времени',
  },
  'admin.dashboard.mrr_breakdown': {
    en: 'MRR Breakdown',
    ru: 'Разбивка MRR',
  },
  'admin.dashboard.mrr_breakdown_description': {
    en: 'Monthly recurring revenue changes',
    ru: 'Изменения месячного регулярного дохода',
  },
  'admin.dashboard.cohort_retention': {
    en: 'Cohort Retention',
    ru: 'Удержание когорт',
  },
  'admin.dashboard.cohort_retention_description': {
    en: 'User retention by signup cohort',
    ru: 'Удержание пользователей по когортам регистрации',
  },
  'admin.dashboard.mrr_growth.help.title': {
    en: 'MRR Growth Chart',
    ru: 'График роста MRR',
  },
  'admin.dashboard.mrr_growth.help.description': {
    en: 'Shows how Monthly Recurring Revenue changes over time, helping identify growth trends and seasonal patterns.',
    ru: 'Показывает, как изменяется месячный регулярный доход со временем, помогая выявить тенденции роста и сезонные закономерности.',
  },
  'admin.dashboard.mrr_growth.help.calculation': {
    en: 'Monthly sum of all active subscription revenues, plotted over time',
    ru: 'Месячная сумма всех доходов от активных подписок, отображённая во времени',
  },
  'admin.dashboard.mrr_growth.help.purpose': {
    en: 'Track revenue trends, forecast future growth, and identify growth acceleration or deceleration',
    ru: 'Отслеживать тенденции дохода, прогнозировать будущий рост и выявлять ускорение или замедление роста',
  },
  'admin.dashboard.mrr_breakdown.help.title': {
    en: 'MRR Breakdown (Waterfall)',
    ru: 'Разбивка MRR (Водопад)',
  },
  'admin.dashboard.mrr_breakdown.help.description': {
    en: 'Visualizes MRR changes by category: New MRR (new customers), Expansion (upgrades), Contraction (downgrades), and Churn (cancellations).',
    ru: 'Визуализирует изменения MRR по категориям: Новый MRR (новые клиенты), Расширение (апгрейды), Сокращение (даунгрейды) и Отток (отмены).',
  },
  'admin.dashboard.mrr_breakdown.help.calculation': {
    en: 'MRR changes = New MRR + Expansion MRR - Contraction MRR - Churned MRR',
    ru: 'Изменения MRR = Новый MRR + Расширение MRR - Сокращение MRR - Отток MRR',
  },
  'admin.dashboard.mrr_breakdown.help.purpose': {
    en: 'Understand revenue drivers, identify churn issues, and optimize pricing strategies',
    ru: 'Понимать драйверы дохода, выявлять проблемы оттока и оптимизировать стратегии ценообразования',
  },
  'admin.dashboard.cohort_retention.help.title': {
    en: 'Cohort Retention Heatmap',
    ru: 'Тепловая карта удержания когорт',
  },
  'admin.dashboard.cohort_retention.help.description': {
    en: 'Shows what percentage of users from each signup month (cohort) remain active over time.',
    ru: 'Показывает, какой процент пользователей из каждого месяца регистрации (когорта) остаётся активным со временем.',
  },
  'admin.dashboard.cohort_retention.help.calculation': {
    en: 'Retention = (Active users in month N / Users in cohort at month 0) × 100%',
    ru: 'Удержание = (Активные пользователи в месяце N / Пользователи в когорте в месяце 0) × 100%',
  },
  'admin.dashboard.cohort_retention.help.purpose': {
    en: 'Identify retention patterns, compare cohort performance, and measure product-market fit improvements',
    ru: 'Выявлять паттерны удержания, сравнивать производительность когорт и измерять улучшения product-market fit',
  },
  'admin.dashboard.failed_to_load': {
    en: 'Failed to load dashboard metrics',
    ru: 'Не удалось загрузить метрики панели управления',
  },
  'admin.dashboard.cac_unavailable': {
    en: 'Unavailable for calculation, connect metrics',
    ru: 'Недоступно для расчёта, подключите метрики',
  },
  'admin.dashboard.connect': {
    en: 'Connect',
    ru: 'Подключить',
  },

  // Users
  'admin.users.title': {
    en: 'Users',
    ru: 'Пользователи',
  },
  'admin.users.description': {
    en: 'Manage and view all users',
    ru: 'Управление и просмотр всех пользователей',
  },
  'admin.users.export_csv': {
    en: 'Export CSV',
    ru: 'Экспорт CSV',
  },
  'admin.users.search_placeholder': {
    en: 'Search users by name or email...',
    ru: 'Поиск пользователей по имени или email...',
  },
  'admin.users.filter_status': {
    en: 'Filter by Status',
    ru: 'Фильтр по статусу',
  },
  'admin.users.filter_plan': {
    en: 'Filter by Plan',
    ru: 'Фильтр по тарифу',
  },
  'admin.users.all_statuses': {
    en: 'All Statuses',
    ru: 'Все статусы',
  },
  'admin.users.all_plans': {
    en: 'All Plans',
    ru: 'Все тарифы',
  },
  'admin.users.apply_filters': {
    en: 'Apply Filters',
    ru: 'Применить фильтры',
  },
  'admin.users.total_users': {
    en: 'total users',
    ru: 'всего пользователей',
  },
  'admin.users.no_users': {
    en: 'No users found matching your criteria.',
    ru: 'Пользователи, соответствующие критериям, не найдены.',
  },
  'admin.users.table.name': {
    en: 'Name',
    ru: 'Имя',
  },
  'admin.users.table.email': {
    en: 'Email',
    ru: 'Email',
  },
  'admin.users.table.telegram': {
    en: 'Telegram',
    ru: 'Telegram',
  },
  'admin.users.table.status': {
    en: 'Status',
    ru: 'Статус',
  },
  'admin.users.table.plan': {
    en: 'Plan',
    ru: 'Тариф',
  },
  'admin.users.table.last_active': {
    en: 'Last Active',
    ru: 'Последняя активность',
  },
  'admin.users.table.signed_up': {
    en: 'Signed Up',
    ru: 'Зарегистрирован',
  },
  'admin.users.table.transactions': {
    en: 'Transactions',
    ru: 'Транзакции',
  },
  'admin.users.table.mrr': {
    en: 'MRR',
    ru: 'MRR',
  },
  'admin.users.table.credits_spent': {
    en: 'Credits Spent',
    ru: 'Потрачено кредитов',
  },
  'admin.users.table.credits_remaining': {
    en: 'Credits Remaining',
    ru: 'Осталось кредитов',
  },
  'admin.users.table.revenue': {
    en: 'Revenue',
    ru: 'Принес денег',
  },
  'admin.users.table.ratio': {
    en: 'Cost/Revenue',
    ru: 'Соотношение',
  },
  'admin.users.pagination.previous': {
    en: 'Previous',
    ru: 'Назад',
  },
  'admin.users.pagination.next': {
    en: 'Next',
    ru: 'Вперед',
  },
  'admin.users.pagination.page': {
    en: 'Page',
    ru: 'Страница',
  },
  'admin.users.pagination.of': {
    en: 'of',
    ru: 'из',
  },

  // User Detail
  'admin.user_detail.title': {
    en: 'User Details',
    ru: 'Детали пользователя',
  },
  'admin.user_detail.subtitle': {
    en: 'User ID: {userId}',
    ru: 'ID пользователя: {userId}',
  },
  'admin.user_detail.description': {
    en: 'Detailed view and management for',
    ru: 'Детальный просмотр и управление для',
  },
  'admin.user_detail.failed_to_load': {
    en: 'Failed to load user details.',
    ru: 'Не удалось загрузить детали пользователя.',
  },
  'admin.user_detail.back_to_list': {
    en: 'Back to Users',
    ru: 'Назад к списку',
  },
  'admin.user_detail.tabs.profile': {
    en: 'Profile',
    ru: 'Профиль',
  },
  'admin.user_detail.tabs.transactions': {
    en: 'Transactions',
    ru: 'Транзакции',
  },
  'admin.user_detail.tabs.timeline': {
    en: 'Timeline',
    ru: 'Временная линия',
  },

  // User Profile
  'admin.user_profile.basic_info': {
    en: 'Basic Information',
    ru: 'Основная информация',
  },
  'admin.user_profile.basic_info_description': {
    en: 'User account details',
    ru: 'Детали учетной записи пользователя',
  },
  'admin.user_profile.edit': {
    en: 'Edit',
    ru: 'Редактировать',
  },
  'admin.user_profile.telegram_not_linked': {
    en: 'Not linked',
    ru: 'Не привязан',
  },
  'admin.user_profile.subscription': {
    en: 'Subscription',
    ru: 'Подписка',
  },
  'admin.user_profile.subscription_description': {
    en: 'Current plan and billing information',
    ru: 'Текущий тариф и информация о биллинге',
  },
  'admin.user_profile.engagement': {
    en: 'Engagement',
    ru: 'Вовлеченность',
  },
  'admin.user_profile.engagement_description': {
    en: 'User activity and usage metrics',
    ru: 'Метрики активности и использования',
  },
  'admin.user_profile.lifecycle': {
    en: 'Lifecycle',
    ru: 'Жизненный цикл',
  },
  'admin.user_profile.lifecycle_description': {
    en: 'User journey and stage information',
    ru: 'Информация о пути пользователя и этапе',
  },
  'admin.user_profile.quick_actions': {
    en: 'Quick Actions',
    ru: 'Быстрые действия',
  },
  'admin.user_profile.edit_user': {
    en: 'Edit User',
    ru: 'Редактировать пользователя',
  },
  'admin.user_profile.edit_user_description': {
    en: 'Edit information for {name}',
    ru: 'Редактировать информацию для {name}',
  },
  'admin.user_profile.name': {
    en: 'Name',
    ru: 'Имя',
  },
  'admin.user_profile.name_placeholder': {
    en: 'Enter user name',
    ru: 'Введите имя пользователя',
  },
  'admin.user_profile.email': {
    en: 'Email',
    ru: 'Email',
  },
  'admin.user_profile.email_placeholder': {
    en: 'Enter email address',
    ru: 'Введите email адрес',
  },
  'admin.user_profile.new_password': {
    en: 'New Password',
    ru: 'Новый пароль',
  },
  'admin.user_profile.password_placeholder': {
    en: 'Leave empty to keep current password',
    ru: 'Оставьте пустым, чтобы сохранить текущий пароль',
  },
  'admin.user_profile.password_hint': {
    en: 'Minimum 6 characters. Leave empty if you don\'t want to change the password.',
    ru: 'Минимум 6 символов. Оставьте пустым, если не хотите менять пароль.',
  },
  'admin.user_profile.save': {
    en: 'Save',
    ru: 'Сохранить',
  },
  'admin.user_profile.user_updated': {
    en: 'User Updated',
    ru: 'Пользователь обновлен',
  },
  'admin.user_profile.user_updated_description': {
    en: 'User information has been successfully updated',
    ru: 'Информация о пользователе успешно обновлена',
  },
  'admin.user_profile.no_changes': {
    en: 'No Changes',
    ru: 'Нет изменений',
  },
  'admin.user_profile.no_changes_description': {
    en: 'You haven\'t made any changes to save',
    ru: 'Вы не внесли никаких изменений для сохранения',
  },
  'admin.user_profile.edit_plan': {
    en: 'Edit Plan',
    ru: 'Изменить тариф',
  },
  'admin.user_profile.send_email': {
    en: 'Send Email',
    ru: 'Отправить email',
  },
  'admin.user_profile.send_telegram': {
    en: 'Send Telegram',
    ru: 'Отправить в Telegram',
  },
  'admin.user_profile.grant_credits': {
    en: 'Grant Credits',
    ru: 'Начислить кредиты',
  },
  'admin.user_profile.block_user': {
    en: 'Block User',
    ru: 'Заблокировать',
  },
  'admin.user_profile.unblock': {
    en: 'Unblock',
    ru: 'Разблокировать',
  },
  'admin.user_profile.user_blocked': {
    en: 'User Blocked',
    ru: 'Пользователь заблокирован',
  },
  'admin.user_profile.user_blocked_description': {
    en: 'The user has been successfully blocked',
    ru: 'Пользователь успешно заблокирован',
  },
  'admin.user_profile.user_unblocked': {
    en: 'User Unblocked',
    ru: 'Пользователь разблокирован',
  },
  'admin.user_profile.user_unblocked_description': {
    en: 'The user has been successfully unblocked',
    ru: 'Пользователь успешно разблокирован',
  },
  'admin.user_profile.confirm_block': {
    en: 'Confirm Block',
    ru: 'Подтвердить блокировку',
  },
  'admin.user_profile.confirm_block_description': {
    en: 'Are you sure you want to block {name}? This action can be undone later.',
    ru: 'Вы уверены, что хотите заблокировать {name}? Это действие можно отменить позже.',
  },
  'admin.user_profile.credits_granted': {
    en: 'Credits Granted',
    ru: 'Кредиты начислены',
  },
  'admin.user_profile.credits_granted_description': {
    en: 'Successfully granted {amount} credits to the user',
    ru: 'Успешно начислено {amount} кредитов пользователю',
  },
  'admin.user_profile.grant_credits_description': {
    en: 'Enter the amount of credits to grant to {name}',
    ru: 'Введите количество кредитов для начисления {name}',
  },
  'admin.user_profile.credits_amount': {
    en: 'Amount',
    ru: 'Количество',
  },
  'admin.user_profile.grant': {
    en: 'Grant',
    ru: 'Начислить',
  },
  'admin.user_profile.coming_soon': {
    en: 'Coming Soon',
    ru: 'Скоро',
  },
  'admin.user_profile.email_feature_coming_soon': {
    en: 'Email sending feature will be available soon',
    ru: 'Функция отправки email будет доступна в ближайшее время',
  },
  'admin.user_profile.telegram_feature_coming_soon': {
    en: 'Telegram messaging feature will be available soon',
    ru: 'Функция отправки сообщений в Telegram будет доступна в ближайшее время',
  },
  'admin.user_profile.edit_plan_coming_soon': {
    en: 'Plan editing feature will be available soon',
    ru: 'Функция редактирования тарифа будет доступна в ближайшее время',
  },
  'admin.user_profile.error': {
    en: 'Error',
    ru: 'Ошибка',
  },

  // Analytics
  'admin.analytics.title': {
    en: 'Analytics',
    ru: 'Аналитика',
  },
  'admin.analytics.description': {
    en: 'User behavior, funnel analysis, and feature adoption',
    ru: 'Поведение пользователей, анализ воронки и принятие функций',
  },
  'admin.analytics.funnel.title': {
    en: 'Conversion Funnel',
    ru: 'Воронка конверсии',
  },
  'admin.analytics.funnel.description': {
    en: 'User journey from landing to paid conversion',
    ru: 'Путь пользователя от посещения до платной конверсии',
  },
  'admin.analytics.funnel.conversion_rates': {
    en: 'Conversion Rates',
    ru: 'Коэффициенты конверсии',
  },
  'admin.analytics.funnel.avg_time': {
    en: 'avg',
    ru: 'средн.',
  },
  'admin.analytics.feature_adoption.title': {
    en: 'Feature Adoption',
    ru: 'Принятие функций',
  },
  'admin.analytics.feature_adoption.description': {
    en: 'Percentage of users using each feature',
    ru: 'Процент пользователей, использующих каждую функцию',
  },
  'admin.analytics.user_segments.title': {
    en: 'User Segments',
    ru: 'Сегменты пользователей',
  },
  'admin.analytics.user_segments.description': {
    en: 'Pre-defined user groups for targeting',
    ru: 'Предопределенные группы пользователей для таргетинга',
  },
  'admin.analytics.user_segments.create_custom': {
    en: 'Create Custom',
    ru: 'Создать свой',
  },
  'admin.analytics.funnel.help.title': {
    en: 'Conversion Funnel',
    ru: 'Воронка конверсии',
  },
  'admin.analytics.funnel.help.description': {
    en: 'Shows how many users progress through each step of your product journey, from signup to key actions.',
    ru: 'Показывает, сколько пользователей проходят каждый этап пути в продукте, от регистрации до ключевых действий.',
  },
  'admin.analytics.funnel.help.calculation': {
    en: 'Conversion rate = (Users at step N / Users at step N-1) × 100%. Dropoff rate = 100% - Conversion rate',
    ru: 'Коэффициент конверсии = (Пользователи на шаге N / Пользователи на шаге N-1) × 100%. Отток = 100% - Коэффициент конверсии',
  },
  'admin.analytics.funnel.help.purpose': {
    en: 'Identify bottlenecks in user journey, optimize conversion rates, and improve user onboarding',
    ru: 'Выявлять узкие места в пути пользователя, оптимизировать коэффициенты конверсии и улучшать онбординг',
  },
  'admin.analytics.feature_adoption.help.title': {
    en: 'Feature Adoption Metrics',
    ru: 'Метрики принятия функций',
  },
  'admin.analytics.feature_adoption.help.description': {
    en: 'Tracks how many users actively use each feature, and how features impact retention and conversion.',
    ru: 'Отслеживает, сколько пользователей активно используют каждую функцию, и как функции влияют на удержание и конверсию.',
  },
  'admin.analytics.feature_adoption.help.calculation': {
    en: 'Adoption rate = (Users who used feature / Total users) × 100%. Retention lift = % increase in retention for feature users',
    ru: 'Процент принятия = (Пользователи, использовавшие функцию / Всего пользователей) × 100%. Прирост удержания = % увеличения удержания для пользователей функции',
  },
  'admin.analytics.feature_adoption.help.purpose': {
    en: 'Identify high-value features, prioritize development efforts, and measure feature impact on business metrics',
    ru: 'Выявлять высокоценные функции, приоритизировать усилия по разработке и измерять влияние функций на бизнес-метрики',
  },
  'admin.analytics.user_segments.help.title': {
    en: 'User Segments',
    ru: 'Сегменты пользователей',
  },
  'admin.analytics.user_segments.help.description': {
    en: 'Pre-defined groups of users based on behavior, characteristics, or engagement patterns for targeted actions.',
    ru: 'Предопределенные группы пользователей на основе поведения, характеристик или паттернов вовлеченности для целевых действий.',
  },
  'admin.analytics.user_segments.help.calculation': {
    en: 'Segments are created using filters (e.g., "active in last 30 days", "LTV > $100", "used feature X")',
    ru: 'Сегменты создаются с помощью фильтров (например, "активны за последние 30 дней", "LTV > $100", "использовали функцию X")',
  },
  'admin.analytics.user_segments.help.purpose': {
    en: 'Target specific user groups for campaigns, personalize experiences, and analyze behavior patterns',
    ru: 'Таргетировать конкретные группы пользователей для кампаний, персонализировать опыт и анализировать паттерны поведения',
  },

  // System Monitoring
  'admin.system.title': {
    en: 'System Monitoring',
    ru: 'Мониторинг системы',
  },
  'admin.system.description': {
    en: 'Real-time system health and performance metrics',
    ru: 'Метрики здоровья и производительности системы в реальном времени',
  },
  'admin.system.api.title': {
    en: 'API Health',
    ru: 'Здоровье API',
  },
  'admin.system.api.description': {
    en: 'API endpoint status and response times',
    ru: 'Статус эндпоинтов API и время отклика',
  },
  'admin.system.database.title': {
    en: 'Database',
    ru: 'База данных',
  },
  'admin.system.database.description': {
    en: 'Database connection and query performance',
    ru: 'Подключение к базе данных и производительность запросов',
  },
  'admin.system.external.title': {
    en: 'External Services',
    ru: 'Внешние сервисы',
  },
  'admin.system.external.description': {
    en: 'Third-party service status',
    ru: 'Статус сторонних сервисов',
  },
  'admin.system.jobs.title': {
    en: 'Background Jobs',
    ru: 'Фоновые задачи',
  },
  'admin.system.jobs.description': {
    en: 'Scheduled and background job status',
    ru: 'Статус запланированных и фоновых задач',
  },
  'admin.system.status.healthy': {
    en: 'Healthy',
    ru: 'Здорово',
  },
  'admin.system.status.degraded': {
    en: 'Degraded',
    ru: 'Снижена',
  },
  'admin.system.status.down': {
    en: 'Down',
    ru: 'Недоступно',
  },
  'admin.system.status.not_configured': {
    en: 'Not configured',
    ru: 'Не настроен',
  },

  // Status values
  'admin.status.active': {
    en: 'active',
    ru: 'активен',
  },
  'admin.status.inactive': {
    en: 'inactive',
    ru: 'неактивен',
  },
  'admin.status.blocked': {
    en: 'blocked',
    ru: 'заблокирован',
  },
  'admin.status.churned': {
    en: 'churned',
    ru: 'отписался',
  },

  // Plan values
  'admin.plan.free': {
    en: 'free',
    ru: 'бесплатный',
  },
  'admin.plan.byok': {
    en: 'byok',
    ru: 'byok',
  },
  'admin.plan.starter': {
    en: 'starter',
    ru: 'стартовый',
  },
  'admin.plan.pro': {
    en: 'pro',
    ru: 'профессиональный',
  },

  // User Profile - Additional Sections
  'admin.user_profile.credits': {
    en: 'Credits & Limits',
    ru: 'Кредиты и лимиты',
  },
  'admin.user_profile.credits_description': {
    en: 'AI credits usage and remaining limits',
    ru: 'Использование AI кредитов и оставшиеся лимиты',
  },
  'admin.user_profile.credits_total': {
    en: 'Total Credits',
    ru: 'Всего кредитов',
  },
  'admin.user_profile.credits_used': {
    en: 'Used',
    ru: 'Использовано',
  },
  'admin.user_profile.credits_remaining': {
    en: 'Remaining',
    ru: 'Осталось',
  },
  'admin.user_profile.credits_usage_percent': {
    en: 'Usage',
    ru: 'Использование',
  },
  'admin.user_profile.acquisition': {
    en: 'Acquisition',
    ru: 'Привлечение',
  },
  'admin.user_profile.acquisition_description': {
    en: 'How and when the user was acquired',
    ru: 'Как и когда был привлечен пользователь',
  },
  'admin.user_profile.acquisition_source': {
    en: 'Source',
    ru: 'Источник',
  },
  'admin.user_profile.acquisition_campaign': {
    en: 'Campaign',
    ru: 'Кампания',
  },
  'admin.user_profile.acquisition_medium': {
    en: 'Medium',
    ru: 'Канал',
  },
  'admin.user_profile.acquisition_cac': {
    en: 'CAC',
    ru: 'CAC',
  },
  'admin.user_profile.acquisition_cac_description': {
    en: 'Customer Acquisition Cost',
    ru: 'Стоимость привлечения клиента',
  },
  'admin.user_profile.acquisition_first_touch': {
    en: 'First Touch',
    ru: 'Первое касание',
  },
  'admin.user_profile.acquisition_source.organic': {
    en: 'Organic',
    ru: 'Органический',
  },
  'admin.user_profile.acquisition_source.google': {
    en: 'Google Ads',
    ru: 'Google Ads',
  },
  'admin.user_profile.acquisition_source.facebook': {
    en: 'Facebook',
    ru: 'Facebook',
  },
  'admin.user_profile.acquisition_source.twitter': {
    en: 'Twitter',
    ru: 'Twitter',
  },
  'admin.user_profile.acquisition_source.referral': {
    en: 'Referral',
    ru: 'Реферальная',
  },
  'admin.user_profile.acquisition_source.direct': {
    en: 'Direct',
    ru: 'Прямой',
  },
  'admin.user_profile.acquisition_source.other': {
    en: 'Other',
    ru: 'Другое',
  },
  'admin.user_profile.engagement_score': {
    en: 'Engagement Score',
    ru: 'Оценка вовлеченности',
  },
  'admin.user_profile.engagement_dau': {
    en: 'DAU (30d)',
    ru: 'DAU (30д)',
  },
  'admin.user_profile.engagement_dau_description': {
    en: 'Days active in last 30 days',
    ru: 'Дней активен за последние 30 дней',
  },
  'admin.user_profile.engagement_mau': {
    en: 'MAU',
    ru: 'MAU',
  },
  'admin.user_profile.engagement_mau_description': {
    en: 'Months active',
    ru: 'Месяцев активен',
  },
  'admin.user_profile.engagement_last_feature': {
    en: 'Last Feature Used',
    ru: 'Последняя функция',
  },
  'admin.user_profile.support': {
    en: 'Support',
    ru: 'Поддержка',
  },
  'admin.user_profile.support_description': {
    en: 'Support tickets and interactions',
    ru: 'Тикеты поддержки и взаимодействия',
  },
  'admin.user_profile.support_tickets': {
    en: 'Tickets',
    ru: 'Тикеты',
  },
  'admin.user_profile.support_last_ticket': {
    en: 'Last Ticket',
    ru: 'Последний тикет',
  },
  'admin.user_profile.support_no_tickets': {
    en: 'No tickets',
    ru: 'Нет тикетов',
  },
  'admin.user_profile.tags': {
    en: 'Tags',
    ru: 'Теги',
  },
  'admin.user_profile.tags_description': {
    en: 'User tags and labels',
    ru: 'Теги и метки пользователя',
  },
  'admin.user_profile.notes': {
    en: 'Notes',
    ru: 'Заметки',
  },
  'admin.user_profile.notes_description': {
    en: 'Internal notes about this user',
    ru: 'Внутренние заметки о пользователе',
  },
  'admin.user_profile.notes_placeholder': {
    en: 'Add notes about this user...',
    ru: 'Добавить заметки о пользователе...',
  },
  'admin.user_profile.notes_save': {
    en: 'Save Notes',
    ru: 'Сохранить заметки',
  },
  'admin.user_profile.marketing_spend': {
    en: 'Marketing Spend',
    ru: 'Маркетинговые расходы',
  },
  'admin.user_profile.marketing_spend_description': {
    en: 'Total amount spent to acquire this user',
    ru: 'Общая сумма потраченная на привлечение этого пользователя',
  },
  'admin.user_profile.roi': {
    en: 'ROI',
    ru: 'ROI',
  },
  'admin.user_profile.roi_description': {
    en: 'Return on investment (LTV / CAC)',
    ru: 'Возврат инвестиций (LTV / CAC)',
  },
  'admin.user_profile.payment_history': {
    en: 'Payment History',
    ru: 'История платежей',
  },
  'admin.user_profile.payment_history_description': {
    en: 'All payments and transactions',
    ru: 'Все платежи и транзакции',
  },
  'admin.user_profile.payment_date': {
    en: 'Date',
    ru: 'Дата',
  },
  'admin.user_profile.payment_amount': {
    en: 'Amount',
    ru: 'Сумма',
  },
  'admin.user_profile.payment_type': {
    en: 'Type',
    ru: 'Тип',
  },
  'admin.user_profile.payment_status': {
    en: 'Status',
    ru: 'Статус',
  },
  'admin.user_profile.payment_description': {
    en: 'Description',
    ru: 'Описание',
  },
  'admin.user_profile.payment_type.subscription': {
    en: 'Subscription',
    ru: 'Подписка',
  },
  'admin.user_profile.payment_type.one_time': {
    en: 'One-time',
    ru: 'Разовый',
  },
  'admin.user_profile.payment_type.refund': {
    en: 'Refund',
    ru: 'Возврат',
  },
  'admin.user_profile.payment_status.completed': {
    en: 'Completed',
    ru: 'Завершен',
  },
  'admin.user_profile.payment_status.pending': {
    en: 'Pending',
    ru: 'В ожидании',
  },
  'admin.user_profile.payment_status.failed': {
    en: 'Failed',
    ru: 'Ошибка',
  },
  'admin.user_profile.feature_usage': {
    en: 'Feature Usage',
    ru: 'Использование функций',
  },
  'admin.user_profile.feature_usage_description': {
    en: 'How often user uses each feature',
    ru: 'Как часто пользователь использует каждую функцию',
  },
  'admin.user_profile.feature_usage.feature': {
    en: 'Feature',
    ru: 'Функция',
  },
  'admin.user_profile.feature_usage.usage_count': {
    en: 'Usage',
    ru: 'Использований',
  },
  'admin.user_profile.feature_usage.last_used': {
    en: 'Last Used',
    ru: 'Последнее использование',
  },
  'admin.user_profile.feature_usage.adopted': {
    en: 'Adopted',
    ru: 'Принята',
  },
  'admin.user_profile.feature_usage.not_adopted': {
    en: 'Not Adopted',
    ru: 'Не принята',
  },
  'admin.user_profile.ab_tests': {
    en: 'A/B Tests',
    ru: 'A/B Тесты',
  },
  'admin.user_profile.ab_tests_description': {
    en: 'Active A/B test groups',
    ru: 'Активные группы A/B тестов',
  },
  'admin.user_profile.ab_tests.test': {
    en: 'Test',
    ru: 'Тест',
  },
  'admin.user_profile.ab_tests.variant': {
    en: 'Variant',
    ru: 'Вариант',
  },
  'admin.user_profile.ab_tests.enrolled': {
    en: 'Enrolled',
    ru: 'Зачислен',
  },
  'admin.user_profile.risk_score': {
    en: 'Risk Score',
    ru: 'Оценка риска',
  },
  'admin.user_profile.risk_score_description': {
    en: 'Churn risk assessment',
    ru: 'Оценка риска оттока',
  },
  'admin.user_profile.risk_score.value': {
    en: 'Risk Score',
    ru: 'Оценка риска',
  },
  'admin.user_profile.risk_score.factors': {
    en: 'Risk Factors',
    ru: 'Факторы риска',
  },
  'admin.user_profile.risk_score.low': {
    en: 'Low Risk',
    ru: 'Низкий риск',
  },
  'admin.user_profile.risk_score.medium': {
    en: 'Medium Risk',
    ru: 'Средний риск',
  },
  'admin.user_profile.risk_score.high': {
    en: 'High Risk',
    ru: 'Высокий риск',
  },
  'admin.user_profile.next_best_action': {
    en: 'Next Best Action',
    ru: 'Рекомендуемое действие',
  },
  'admin.user_profile.next_best_action_description': {
    en: 'Recommended action for this user',
    ru: 'Рекомендуемое действие для этого пользователя',
  },
  'admin.user_profile.next_best_action.action': {
    en: 'Action',
    ru: 'Действие',
  },
  'admin.user_profile.next_best_action.reason': {
    en: 'Reason',
    ru: 'Причина',
  },
  'admin.user_profile.next_best_action.priority': {
    en: 'Priority',
    ru: 'Приоритет',
  },
  'admin.user_profile.next_best_action.priority.high': {
    en: 'High',
    ru: 'Высокий',
  },
  'admin.user_profile.next_best_action.priority.medium': {
    en: 'Medium',
    ru: 'Средний',
  },
  'admin.user_profile.next_best_action.priority.low': {
    en: 'Low',
    ru: 'Низкий',
  },
  'admin.user_profile.next_best_action.none': {
    en: 'No action needed',
    ru: 'Действия не требуются',
  },

  // Common
  'admin.common.loading': {
    en: 'Loading...',
    ru: 'Загрузка...',
  },
  'admin.common.cancel': {
    en: 'Cancel',
    ru: 'Отмена',
  },
  'admin.common.error': {
    en: 'Error',
    ru: 'Ошибка',
  },
  'admin.common.retry': {
    en: 'Retry',
    ru: 'Повторить',
  },
  'admin.common.none': {
    en: 'None',
    ru: 'Нет',
  },
  'admin.common.na': {
    en: 'N/A',
    ru: 'Н/Д',
  },

  // Audit Log
  'admin.audit_log.title': {
    en: 'Audit Log',
    ru: 'Журнал аудита',
  },
  'admin.audit_log.description': {
    en: 'Complete history of all user actions for security and compliance',
    ru: 'Полная история всех действий пользователей для безопасности и соответствия требованиям',
  },
  'admin.audit_log.export': {
    en: 'Export',
    ru: 'Экспорт',
  },
  'admin.audit_log.filters_title': {
    en: 'Filters',
    ru: 'Фильтры',
  },
  'admin.audit_log.filters_description': {
    en: 'Filter audit logs by user, action, or entity type',
    ru: 'Фильтрация журнала аудита по пользователю, действию или типу сущности',
  },
  'admin.audit_log.search_user_id': {
    en: 'User ID',
    ru: 'ID пользователя',
  },
  'admin.audit_log.filter_action': {
    en: 'Action',
    ru: 'Действие',
  },
  'admin.audit_log.all_actions': {
    en: 'All Actions',
    ru: 'Все действия',
  },
  'admin.audit_log.action.login': {
    en: 'Login',
    ru: 'Вход',
  },
  'admin.audit_log.action.logout': {
    en: 'Logout',
    ru: 'Выход',
  },
  'admin.audit_log.action.register': {
    en: 'Register',
    ru: 'Регистрация',
  },
  'admin.audit_log.action.create': {
    en: 'Create',
    ru: 'Создание',
  },
  'admin.audit_log.action.update': {
    en: 'Update',
    ru: 'Обновление',
  },
  'admin.audit_log.action.delete': {
    en: 'Delete',
    ru: 'Удаление',
  },
  'admin.audit_log.filter_entity': {
    en: 'Entity Type',
    ru: 'Тип сущности',
  },
  'admin.audit_log.all_entities': {
    en: 'All Entities',
    ru: 'Все сущности',
  },
  'admin.audit_log.entity.transaction': {
    en: 'Transaction',
    ru: 'Транзакция',
  },
  'admin.audit_log.entity.wallet': {
    en: 'Wallet',
    ru: 'Кошелек',
  },
  'admin.audit_log.entity.budget': {
    en: 'Budget',
    ru: 'Бюджет',
  },
  'admin.audit_log.entity.category': {
    en: 'Category',
    ru: 'Категория',
  },
  'admin.audit_log.entity.user': {
    en: 'User',
    ru: 'Пользователь',
  },
  'admin.audit_log.entity.settings': {
    en: 'Settings',
    ru: 'Настройки',
  },
  'admin.audit_log.clear_filters': {
    en: 'Clear Filters',
    ru: 'Очистить фильтры',
  },
  'admin.audit_log.all_logs': {
    en: 'All Audit Logs',
    ru: 'Все записи аудита',
  },
  'admin.audit_log.total_entries': {
    en: 'total entries',
    ru: 'всего записей',
  },
  'admin.audit_log.failed_to_load': {
    en: 'Failed to load audit logs',
    ru: 'Не удалось загрузить журнал аудита',
  },
  'admin.audit_log.no_logs_found': {
    en: 'No audit logs found',
    ru: 'Записи аудита не найдены',
  },
  'admin.audit_log.table.timestamp': {
    en: 'Timestamp',
    ru: 'Время',
  },
  'admin.audit_log.table.user': {
    en: 'User',
    ru: 'Пользователь',
  },
  'admin.audit_log.table.action': {
    en: 'Action',
    ru: 'Действие',
  },
  'admin.audit_log.table.entity': {
    en: 'Entity',
    ru: 'Сущность',
  },
  'admin.audit_log.table.entity_id': {
    en: 'Entity ID',
    ru: 'ID сущности',
  },
  'admin.audit_log.table.ip': {
    en: 'IP Address',
    ru: 'IP адрес',
  },
  'admin.audit_log.table.user_agent': {
    en: 'User Agent',
    ru: 'User Agent',
  },

  // User Transactions
  'admin.user_transactions.title': {
    en: 'Transaction History',
    ru: 'История транзакций',
  },
  'admin.user_transactions.total_transactions': {
    en: 'total transactions',
    ru: 'всего транзакций',
  },
  'admin.user_transactions.filter_type': {
    en: 'Filter by Type',
    ru: 'Фильтр по типу',
  },
  'admin.user_transactions.all_types': {
    en: 'All Types',
    ru: 'Все типы',
  },
  'admin.user_transactions.failed_to_load': {
    en: 'Failed to load transactions',
    ru: 'Не удалось загрузить транзакции',
  },
  'admin.user_transactions.no_transactions_found': {
    en: 'No transactions found',
    ru: 'Транзакции не найдены',
  },
  'admin.user_transactions.export_statement': {
    en: 'Export Statement',
    ru: 'Скачать выписку',
  },
  'admin.user_transactions.open_receipt': {
    en: 'Open',
    ru: 'Открыть',
  },
  'admin.user_transactions.export_failed': {
    en: 'Failed to export statement',
    ru: 'Не удалось экспортировать выписку',
  },
  'admin.user_transactions.table.date': {
    en: 'Date',
    ru: 'Дата',
  },
  'admin.user_transactions.table.type': {
    en: 'Type',
    ru: 'Тип',
  },
  'admin.user_transactions.table.amount': {
    en: 'Amount',
    ru: 'Сумма',
  },
  'admin.user_transactions.table.description': {
    en: 'Description',
    ru: 'Описание',
  },
  'admin.user_transactions.table.category': {
    en: 'Category',
    ru: 'Категория',
  },
  'admin.user_transactions.table.source': {
    en: 'Source',
    ru: 'Источник',
  },
  'admin.user_transactions.table.receipt': {
    en: 'Receipt',
    ru: 'Чек',
  },
  'admin.transaction_type.income': {
    en: 'Income',
    ru: 'Доход',
  },
  'admin.transaction_type.expense': {
    en: 'Expense',
    ru: 'Расход',
  },
  'admin.transaction_source.manual': {
    en: 'Manual',
    ru: 'Вручную',
  },
  'admin.transaction_source.telegram': {
    en: 'Telegram',
    ru: 'Telegram',
  },
  'admin.transaction_source.ocr': {
    en: 'OCR',
    ru: 'OCR',
  },

  // Broadcasts
  'admin.broadcasts.title': {
    en: 'Broadcasts',
    ru: 'Рассылки',
  },
  'admin.broadcasts.description': {
    en: 'Send messages to users via Telegram bot',
    ru: 'Отправка сообщений пользователям через Telegram бота',
  },
  'admin.broadcasts.tabs.compose': {
    en: 'Compose',
    ru: 'Написать',
  },
  'admin.broadcasts.tabs.templates': {
    en: 'Templates',
    ru: 'Шаблоны',
  },
  'admin.broadcasts.tabs.history': {
    en: 'History',
    ru: 'История',
  },
  'admin.broadcasts.compose.title': {
    en: 'Compose Message',
    ru: 'Написать сообщение',
  },
  'admin.broadcasts.compose.description': {
    en: 'Create and send a message to selected users',
    ru: 'Создать и отправить сообщение выбранным пользователям',
  },
  'admin.broadcasts.compose.coming_soon': {
    en: 'Compose form will be implemented soon',
    ru: 'Форма создания сообщения будет реализована в ближайшее время',
  },
  'admin.broadcasts.compose.title_field': {
    en: 'Title',
    ru: 'Заголовок',
  },
  'admin.broadcasts.compose.title_placeholder': {
    en: 'Enter broadcast title...',
    ru: 'Введите заголовок рассылки...',
  },
  'admin.broadcasts.compose.message_field': {
    en: 'Message',
    ru: 'Сообщение',
  },
  'admin.broadcasts.compose.message_placeholder': {
    en: 'Enter your message...',
    ru: 'Введите ваше сообщение...',
  },
  'admin.broadcasts.compose.message_description': {
    en: 'The message that will be sent to selected users',
    ru: 'Сообщение, которое будет отправлено выбранным пользователям',
  },
  'admin.broadcasts.compose.target_segment': {
    en: 'Target Segment',
    ru: 'Целевой сегмент',
  },
  'admin.broadcasts.compose.select_segment': {
    en: 'Select a segment...',
    ru: 'Выберите сегмент...',
  },
  'admin.broadcasts.compose.target_segment_description': {
    en: 'Choose which user segment should receive this broadcast',
    ru: 'Выберите какой сегмент пользователей должен получить эту рассылку',
  },
  'admin.broadcasts.compose.target_users': {
    en: 'Target User IDs',
    ru: 'ID целевых пользователей',
  },
  'admin.broadcasts.compose.target_users_placeholder': {
    en: '1, 2, 3 (optional, comma-separated)',
    ru: '1, 2, 3 (опционально, через запятую)',
  },
  'admin.broadcasts.compose.target_users_description': {
    en: 'Optional: Specify individual user IDs. Overrides target segment.',
    ru: 'Опционально: Укажите конкретные ID пользователей. Переопределяет целевой сегмент.',
  },
  'admin.broadcasts.compose.send': {
    en: 'Send Broadcast',
    ru: 'Отправить рассылку',
  },
  'admin.broadcasts.compose.sending': {
    en: 'Sending...',
    ru: 'Отправка...',
  },
  'admin.broadcasts.segments.all': {
    en: 'All Users',
    ru: 'Все пользователи',
  },
  'admin.broadcasts.segments.active': {
    en: 'Active Users',
    ru: 'Активные пользователи',
  },
  'admin.broadcasts.segments.new_users': {
    en: 'New Users',
    ru: 'Новые пользователи',
  },
  'admin.broadcasts.segments.at_risk': {
    en: 'At Risk Users',
    ru: 'Пользователи в зоне риска',
  },
  'admin.broadcasts.segments.churned': {
    en: 'Churned Users',
    ru: 'Отписавшиеся пользователи',
  },
  'admin.broadcasts.segments.power_users': {
    en: 'Power Users',
    ru: 'Продвинутые пользователи',
  },
  'admin.broadcasts.broadcast_sent': {
    en: 'Broadcast sent',
    ru: 'Рассылка отправлена',
  },
  'admin.broadcasts.broadcast_sent_description': {
    en: 'Your broadcast has been sent successfully',
    ru: 'Ваша рассылка успешно отправлена',
  },
  'admin.broadcasts.error': {
    en: 'Error',
    ru: 'Ошибка',
  },
  'admin.broadcasts.send_failed': {
    en: 'Failed to send broadcast',
    ru: 'Не удалось отправить рассылку',
  },
  'admin.broadcasts.templates.no_templates': {
    en: 'No templates available',
    ru: 'Шаблоны недоступны',
  },
  'admin.broadcasts.history.no_broadcasts': {
    en: 'No broadcasts yet',
    ru: 'Рассылок пока нет',
  },
  'admin.broadcasts.templates.use': {
    en: 'Use Template',
    ru: 'Использовать',
  },
  'admin.broadcasts.templates.variables': {
    en: 'Available variables',
    ru: 'Доступные переменные',
  },
  'admin.broadcasts.history.title': {
    en: 'Broadcast History',
    ru: 'История рассылок',
  },
  'admin.broadcasts.history.description': {
    en: 'View all past broadcasts',
    ru: 'Просмотр всех прошлых рассылок',
  },
  'admin.broadcasts.history.table.name': {
    en: 'Name',
    ru: 'Название',
  },
  'admin.broadcasts.history.table.status': {
    en: 'Status',
    ru: 'Статус',
  },
  'admin.broadcasts.history.table.recipients': {
    en: 'Recipients',
    ru: 'Получатели',
  },
  'admin.broadcasts.history.table.sent': {
    en: 'Sent',
    ru: 'Отправлено',
  },
  'admin.broadcasts.history.table.failed': {
    en: 'Failed',
    ru: 'Ошибки',
  },
  'admin.broadcasts.history.table.created': {
    en: 'Created',
    ru: 'Создано',
  },
  'admin.broadcasts.history.table.actions': {
    en: 'Actions',
    ru: 'Действия',
  },
  'admin.broadcasts.history.view': {
    en: 'View',
    ru: 'Просмотр',
  },
  'admin.broadcasts.status.draft': {
    en: 'Draft',
    ru: 'Черновик',
  },
  'admin.broadcasts.status.scheduled': {
    en: 'Scheduled',
    ru: 'Запланировано',
  },
  'admin.broadcasts.status.sending': {
    en: 'Sending',
    ru: 'Отправка',
  },
  'admin.broadcasts.status.completed': {
    en: 'Completed',
    ru: 'Завершено',
  },
  'admin.broadcasts.status.failed': {
    en: 'Failed',
    ru: 'Ошибка',
  },
  'admin.broadcasts.validation.title_required': {
    en: 'Title is required',
    ru: 'Заголовок обязателен',
  },
  'admin.broadcasts.validation.message_required': {
    en: 'Message is required',
    ru: 'Сообщение обязательно',
  },

  // Support
  'admin.support.search_chats': {
    en: 'Search chats...',
    ru: 'Поиск чатов...',
  },
  'admin.support.select_chat': {
    en: 'Select a chat to start conversation',
    ru: 'Выберите чат для начала переписки',
  },
  'admin.support.type_message': {
    en: 'Type a message...',
    ru: 'Введите сообщение...',
  },
  'admin.support.status.open': {
    en: 'Open',
    ru: 'Открыт',
  },
  'admin.support.status.waiting': {
    en: 'Waiting',
    ru: 'Ожидание',
  },
  'admin.support.status.closed': {
    en: 'Closed',
    ru: 'Закрыт',
  },
  'admin.support.priority.low': {
    en: 'Low',
    ru: 'Низкий',
  },
  'admin.support.priority.medium': {
    en: 'Medium',
    ru: 'Средний',
  },
  'admin.support.priority.high': {
    en: 'High',
    ru: 'Высокий',
  },
  'admin.support.priority.urgent': {
    en: 'Urgent',
    ru: 'Срочно',
  },
  'admin.support.close_chat': {
    en: 'Close Chat',
    ru: 'Закрыть чат',
  },
  'admin.support.reopen_chat': {
    en: 'Reopen Chat',
    ru: 'Открыть чат',
  },
  'admin.support.message_sent': {
    en: 'Message sent',
    ru: 'Сообщение отправлено',
  },
  'admin.support.message_sent_description': {
    en: 'Your message has been sent successfully',
    ru: 'Ваше сообщение успешно отправлено',
  },
  'admin.support.status_updated': {
    en: 'Status updated',
    ru: 'Статус обновлен',
  },
  'admin.support.status_updated_description': {
    en: 'Chat status has been updated successfully',
    ru: 'Статус чата успешно обновлен',
  },
  'admin.support.error': {
    en: 'Error',
    ru: 'Ошибка',
  },
  'admin.support.message_send_failed': {
    en: 'Failed to send message',
    ru: 'Не удалось отправить сообщение',
  },
  'admin.support.status_update_failed': {
    en: 'Failed to update status',
    ru: 'Не удалось обновить статус',
  },
  'admin.support.priority.normal': {
    en: 'Normal',
    ru: 'Обычный',
  },

  // Auth Login
  'admin.auth.login.title': {
    en: 'Admin Login',
    ru: 'Вход в админ-панель',
  },
  'admin.auth.login.description': {
    en: 'Enter your credentials to access the admin panel',
    ru: 'Введите ваши учетные данные для доступа к админ-панели',
  },
  'admin.auth.login.email': {
    en: 'Email',
    ru: 'Email',
  },
  'admin.auth.login.password': {
    en: 'Password',
    ru: 'Пароль',
  },
  'admin.auth.login.email_placeholder': {
    en: 'admin@budgetbot.app',
    ru: 'admin@budgetbot.app',
  },
  'admin.auth.login.password_placeholder': {
    en: '••••••••',
    ru: '••••••••',
  },
  'admin.auth.login.submit': {
    en: 'Login',
    ru: 'Войти',
  },
  'admin.auth.login.submitting': {
    en: 'Logging in...',
    ru: 'Вход...',
  },
  'admin.auth.login.error.validation': {
    en: 'Validation error. Please check your input.',
    ru: 'Ошибка валидации. Проверьте введенные данные.',
  },
  'admin.auth.login.error.invalid_credentials': {
    en: 'Invalid email or password',
    ru: 'Неверный email или пароль',
  },
  'admin.auth.login.error.access_denied': {
    en: 'Access denied. Account is inactive.',
    ru: 'Доступ запрещен. Аккаунт неактивен.',
  },
  'admin.auth.login.error.generic': {
    en: 'Login error',
    ru: 'Ошибка при входе',
  },
  'admin.auth.login.error.unknown': {
    en: 'Unknown error',
    ru: 'Неизвестная ошибка',
  },
  'admin.auth.login.error.network': {
    en: 'Login error ({status}). Please try again later.',
    ru: 'Ошибка при входе ({status}). Попробуйте позже.',
  },
  'admin.auth.login.demo_credentials': {
    en: 'Demo credentials:',
    ru: 'Демо-учетные данные:',
  },

  // User Timeline
  'admin.user_timeline.title': {
    en: 'Activity Timeline',
    ru: 'Временная линия активности',
  },
  'admin.user_timeline.description': {
    en: 'Chronological history of user actions',
    ru: 'Хронологическая история действий пользователя',
  },
  'admin.user_timeline.event.signup': {
    en: 'User signed up',
    ru: 'Пользователь зарегистрировался',
  },
  'admin.user_timeline.event.transaction': {
    en: 'Created first transaction: "{description}" {amount}',
    ru: 'Создана первая транзакция: "{description}" {amount}',
  },
  'admin.user_timeline.event.wallet': {
    en: 'Created wallet: "{name}"',
    ru: 'Создан кошелек: "{name}"',
  },
  'admin.user_timeline.event.ocr': {
    en: 'Scanned receipt via Telegram OCR',
    ru: 'Отсканирован чек через Telegram OCR',
  },
  'admin.user_timeline.event.ai_chat': {
    en: 'Started AI chat session ({count} messages)',
    ru: 'Начат сеанс AI чата ({count} сообщений)',
  },
  'admin.user_timeline.event.upgrade': {
    en: 'Upgraded from {fromPlan} to {toPlan} plan ({price}/mo)',
    ru: 'Обновлен тариф с {fromPlan} на {toPlan} ({price}/мес)',
  },
  'admin.user_timeline.event.referral': {
    en: 'Referred user: {username}',
    ru: 'Приглашен пользователь: {username}',
  },
  'admin.user_timeline.event.login': {
    en: 'User logged in',
    ru: 'Пользователь вошел в систему',
  },

  // Cohort Retention
  'admin.cohort_retention.label.cohort': {
    en: 'Cohort',
    ru: 'Когорта',
  },
  'admin.cohort_retention.label.month0': {
    en: 'M0',
    ru: 'M0',
  },
  'admin.cohort_retention.label.month1': {
    en: 'M1',
    ru: 'M1',
  },
  'admin.cohort_retention.label.month2': {
    en: 'M2',
    ru: 'M2',
  },
  'admin.cohort_retention.label.month3': {
    en: 'M3',
    ru: 'M3',
  },
  'admin.cohort_retention.label.month6': {
    en: 'M6',
    ru: 'M6',
  },
  'admin.cohort_retention.label.month12': {
    en: 'M12',
    ru: 'M12',
  },
  'admin.cohort_retention.legend.title': {
    en: 'Retention:',
    ru: 'Удержание:',
  },
  'admin.cohort_retention.legend.range_0_20': {
    en: '<20%',
    ru: '<20%',
  },
  'admin.cohort_retention.legend.range_20_40': {
    en: '20-40%',
    ru: '20-40%',
  },
  'admin.cohort_retention.legend.range_40_60': {
    en: '40-60%',
    ru: '40-60%',
  },
  'admin.cohort_retention.legend.range_60_80': {
    en: '60-80%',
    ru: '60-80%',
  },
  'admin.cohort_retention.legend.range_80_plus': {
    en: '>80%',
    ru: '>80%',
  },

  // Support - Additional
  'admin.support.loading_chats': {
    en: 'Loading chats...',
    ru: 'Загрузка чатов...',
  },
  'admin.support.no_chats': {
    en: 'No chats found',
    ru: 'Чаты не найдены',
  },
  'admin.support.unknown': {
    en: 'Unknown',
    ru: 'Неизвестно',
  },
  'admin.support.loading_messages': {
    en: 'Loading messages...',
    ru: 'Загрузка сообщений...',
  },
  'admin.support.no_messages': {
    en: 'No messages yet',
    ru: 'Сообщений пока нет',
  },

  // System Metrics
  'admin.system.metrics.uptime': {
    en: 'Uptime',
    ru: 'Время работы',
  },
  'admin.system.metrics.avg_response_time': {
    en: 'Avg Response Time',
    ru: 'Среднее время отклика',
  },
  'admin.system.metrics.error_rate': {
    en: 'Error Rate',
    ru: 'Частота ошибок',
  },
  'admin.system.metrics.requests_24h': {
    en: 'Requests (24h)',
    ru: 'Запросов (24ч)',
  },
  'admin.system.metrics.connections': {
    en: 'Connections',
    ru: 'Подключения',
  },
  'admin.system.metrics.slow_queries': {
    en: 'Slow Queries',
    ru: 'Медленные запросы',
  },
  'admin.system.metrics.database_size': {
    en: 'Database Size',
    ru: 'Размер базы данных',
  },
  'admin.system.metrics.last_run': {
    en: 'Last run: {date}',
    ru: 'Последний запуск: {date}',
  },
  'admin.system.metrics.never_run': {
    en: 'Last run: Never',
    ru: 'Последний запуск: Никогда',
  },

  // Common - Pagination
  'admin.common.previous': {
    en: 'Previous',
    ru: 'Назад',
  },
  'admin.common.next': {
    en: 'Next',
    ru: 'Вперед',
  },
  'admin.common.page': {
    en: 'Page {page} of {totalPages}',
    ru: 'Страница {page} из {totalPages}',
  },
  'admin.common.no_data': {
    en: 'No data available',
    ru: 'Данные недоступны',
  },
  'admin.common.help': {
    en: 'Help',
    ru: 'Справка',
  },
  'admin.common.calculation': {
    en: 'Calculation',
    ru: 'Расчёт',
  },
  'admin.common.purpose': {
    en: 'Purpose',
    ru: 'Назначение',
  },

  // Metric Help Tooltips
  'admin.dashboard.mrr.help.title': {
    en: 'Monthly Recurring Revenue (MRR)',
    ru: 'Месячный регулярный доход (MRR)',
  },
  'admin.dashboard.mrr.help.description': {
    en: 'MRR is the predictable revenue a company expects to receive every month from active subscriptions.',
    ru: 'MRR — это предсказуемый доход, который компания ожидает получать каждый месяц от активных подписок.',
  },
  'admin.dashboard.mrr.help.calculation': {
    en: 'Sum of all monthly subscription fees from active users',
    ru: 'Сумма всех месячных платежей за подписки от активных пользователей',
  },
  'admin.dashboard.mrr.help.purpose': {
    en: 'Track revenue growth, predict future income, and measure business health',
    ru: 'Отслеживать рост дохода, прогнозировать будущий доход и оценивать здоровье бизнеса',
  },
  'admin.dashboard.total_users.help.title': {
    en: 'Total Users',
    ru: 'Всего пользователей',
  },
  'admin.dashboard.total_users.help.description': {
    en: 'Total number of registered users in the system.',
    ru: 'Общее количество зарегистрированных пользователей в системе.',
  },
  'admin.dashboard.total_users.help.calculation': {
    en: 'Count of all user accounts in the database',
    ru: 'Количество всех учётных записей пользователей в базе данных',
  },
  'admin.dashboard.total_users.help.purpose': {
    en: 'Monitor user base growth, track registration trends, and measure platform adoption',
    ru: 'Отслеживать рост пользовательской базы, тенденции регистраций и уровень принятия платформы',
  },
  'admin.dashboard.ltv.help.title': {
    en: 'Lifetime Value (LTV)',
    ru: 'Пожизненная ценность (LTV)',
  },
  'admin.dashboard.ltv.help.description': {
    en: 'LTV is the total revenue a company expects to earn from a customer throughout their relationship.',
    ru: 'LTV — это общий доход, который компания ожидает получить от клиента за весь период отношений.',
  },
  'admin.dashboard.ltv.help.calculation': {
    en: 'Average revenue per user × Average customer lifespan (in months)',
    ru: 'Средний доход на пользователя × Средняя продолжительность жизни клиента (в месяцах)',
  },
  'admin.dashboard.ltv.help.purpose': {
    en: 'Determine customer value, optimize marketing spend, and improve retention strategies',
    ru: 'Определять ценность клиента, оптимизировать расходы на маркетинг и улучшать стратегии удержания',
  },
  'admin.dashboard.cac.help.title': {
    en: 'Customer Acquisition Cost (CAC)',
    ru: 'Стоимость привлечения клиента (CAC)',
  },
  'admin.dashboard.cac.help.description': {
    en: 'CAC is the total cost of acquiring a new customer, including marketing and sales expenses.',
    ru: 'CAC — это общая стоимость привлечения нового клиента, включая расходы на маркетинг и продажи.',
  },
  'admin.dashboard.cac.help.calculation': {
    en: 'Total marketing and sales costs ÷ Number of new customers acquired',
    ru: 'Общие расходы на маркетинг и продажи ÷ Количество привлечённых новых клиентов',
  },
  'admin.dashboard.cac.help.purpose': {
    en: 'Evaluate marketing efficiency, optimize spending, and ensure profitable growth (LTV:CAC ratio should be > 3:1)',
    ru: 'Оценивать эффективность маркетинга, оптимизировать расходы и обеспечивать прибыльный рост (соотношение LTV:CAC должно быть > 3:1)',
  },

  // Server Error Messages (for API responses)
  'admin.errors.invalid_query_parameters': {
    en: 'Invalid query parameters',
    ru: 'Неверные параметры запроса',
  },
  'admin.errors.user_not_found': {
    en: 'User not found',
    ru: 'Пользователь не найден',
  },
  'admin.errors.unauthorized': {
    en: 'Unauthorized',
    ru: 'Не авторизован',
  },
  'admin.errors.validation_failed': {
    en: 'Validation failed',
    ru: 'Ошибка валидации',
  },
  'admin.errors.broadcast_not_found': {
    en: 'Broadcast not found',
    ru: 'Рассылка не найдена',
  },
  'admin.errors.chat_not_found': {
    en: 'Chat not found',
    ru: 'Чат не найден',
  },
  'admin.errors.forbidden': {
    en: 'Forbidden',
    ru: 'Доступ запрещен',
  },
  'admin.errors.invalid_broadcast_id': {
    en: 'Invalid broadcast ID',
    ru: 'Неверный ID рассылки',
  },
};


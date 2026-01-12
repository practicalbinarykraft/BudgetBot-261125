# Admin Panel Frontend Tests

## Статус тестирования

✅ **Созданы тесты для ключевых компонентов админ-панели**

### Созданные тесты

1. **MetricCard Component** (`client/src/components/admin/__tests__/metric-card.test.tsx`)
   - ✅ Рендеринг title и value
   - ✅ Форматирование currency, percentage, number
   - ✅ Отображение тренда (positive/negative)
   - ✅ Sparkline chart

2. **UserProfile Component** (`client/src/components/admin/users/__tests__/user-profile.test.tsx`)
   - ✅ Рендеринг базовой информации
   - ✅ Статус и план пользователя
   - ✅ Telegram информация
   - ✅ Метрики (MRR, LTV, transactions)
   - ✅ Referral информация
   - ✅ Quick Actions

3. **FunnelChart Component** (`client/src/components/admin/analytics/__tests__/funnel-chart.test.tsx`)
   - ✅ Рендеринг заголовка и описания
   - ✅ Отображение conversion rates
   - ✅ Average time to next step

4. **UserSegments Component** (`client/src/components/admin/analytics/__tests__/user-segments.test.tsx`)
   - ✅ Рендеринг всех сегментов
   - ✅ Отображение описаний и критериев
   - ✅ Кнопка "Create Custom"

5. **AdminDashboardPage** (`client/src/pages/admin/__tests__/dashboard.test.tsx`)
   - ✅ Рендеринг страницы
   - ✅ Loading состояния
   - ✅ Загрузка метрик

## Запуск тестов

```bash
# Все тесты
npm test

# Только тесты админ-панели
npm test -- client/src/components/admin

# Конкретный файл
npm test -- client/src/components/admin/__tests__/metric-card.test.tsx
```

## Структура тестов

Все тесты следуют принципам:
- **TDD подход** - тесты написаны для существующих компонентов
- **Junior-Friendly** - простые assertions, понятные имена
- **Mock данные** - используются моки вместо реальных API вызовов
- **TestProviders** - используется обертка для контекстов

## Что еще нужно протестировать

### Компоненты
- [ ] MRRGrowthChart
- [ ] MRRWaterfallChart
- [ ] CohortRetentionHeatmap
- [ ] FeatureAdoptionChart
- [ ] UserTransactions
- [ ] UserTimeline

### Страницы
- [ ] AdminUsersListPage
- [ ] AdminAnalyticsPage
- [ ] AdminSystemMonitoringPage

### API Layer
- [ ] adminApi методы
- [ ] Query keys

## Примечания

- Тесты используют `vitest` + `@testing-library/react`
- Все тесты изолированы и не требуют реального API
- Используется `TestProviders` для мокирования контекстов (i18n, auth, query)



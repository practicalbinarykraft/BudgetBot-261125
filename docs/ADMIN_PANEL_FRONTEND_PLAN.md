# 🎨 Admin Panel - Frontend Development Plan (Mock-First Approach)

**Подход:** Сначала фронтенд с моками, потом подключение реального API

---

## 📋 Преимущества Mock-First подхода

1. ✅ **Быстрая разработка UI** - не ждем бекенд
2. ✅ **Параллельная работа** - фронт и бекенд одновременно
3. ✅ **Визуализация требований** - сразу видно как должно выглядеть
4. ✅ **Легкое тестирование** - моки для всех сценариев
5. ✅ **Простое подключение API** - просто меняем источник данных

---

## 🏗️ Структура проекта

```
client/src/
├── pages/admin/
│   ├── auth/
│   │   └── login.tsx                    # Страница входа
│   ├── dashboard/
│   │   └── index.tsx                    # Главный дашборд
│   ├── users/
│   │   ├── list.tsx                     # Список пользователей
│   │   └── [id].tsx                     # Детали пользователя
│   ├── analytics/
│   │   └── index.tsx                    # Аналитика
│   └── system/
│       └── monitoring.tsx               # Мониторинг системы
│
├── components/admin/
│   ├── layout/
│   │   ├── AdminLayout.tsx             # Основной layout
│   │   ├── AdminSidebar.tsx            # Боковое меню
│   │   └── AdminHeader.tsx             # Шапка
│   │
│   ├── dashboard/
│   │   ├── HeroMetrics.tsx             # Верхние карточки (MRR, Users, LTV, CAC)
│   │   ├── MRRChart.tsx                # График MRR
│   │   ├── CohortHeatmap.tsx          # Heatmap retention
│   │   └── MetricCard.tsx             # Переиспользуемая карточка метрики
│   │
│   ├── users/
│   │   ├── UsersTable.tsx             # Таблица пользователей
│   │   ├── UserFilters.tsx            # Фильтры
│   │   ├── UserProfile.tsx            # Профиль пользователя
│   │   ├── UserTransactions.tsx        # Транзакции пользователя
│   │   └── UserTimeline.tsx           # Timeline активности
│   │
│   └── shared/
│       ├── DataTable.tsx              # Переиспользуемая таблица
│       └── LoadingSkeleton.tsx        # Skeleton loader
│
├── hooks/admin/
│   ├── use-admin-auth.ts              # Хук для админ-аутентификации
│   └── use-admin-metrics.ts           # Хук для метрик
│
├── lib/admin/
│   ├── mock-data/
│   │   ├── users.mock.ts              # Моковые пользователи
│   │   ├── metrics.mock.ts            # Моковые метрики
│   │   ├── transactions.mock.ts       # Моковые транзакции
│   │   └── system-health.mock.ts      # Моковые данные системы
│   │
│   └── api/
│       ├── admin-api.ts               # API клиент (сейчас моки, потом реальный)
│       └── admin-query-keys.ts       # TanStack Query keys
```

---

## 🎯 Phase 1: Базовая структура (1 день)

### 1.1 Создать структуру папок и базовые компоненты

**Tasks:**
- [ ] Создать папку `client/src/pages/admin/`
- [ ] Создать папку `client/src/components/admin/`
- [ ] Создать `AdminLayout.tsx` с sidebar и header
- [ ] Создать `AdminSidebar.tsx` с навигацией
- [ ] Создать `AdminHeader.tsx` с logout
- [ ] Создать страницу логина `admin/auth/login.tsx`

**Файлы:**
```typescript
// client/src/components/admin/layout/AdminLayout.tsx
export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 1.2 Настроить роутинг

**Tasks:**
- [ ] Добавить роуты в `App.tsx`:
  - `/admin/login` - страница входа
  - `/admin/dashboard` - главный дашборд
  - `/admin/users` - список пользователей
  - `/admin/users/:id` - детали пользователя
  - `/admin/analytics` - аналитика
  - `/admin/system` - мониторинг

---

## 🎯 Phase 2: Mock Data & API Layer (0.5 дня)

### 2.1 Создать моковые данные

**Файл: `client/src/lib/admin/mock-data/users.mock.ts`**
```typescript
export interface MockUser {
  id: number;
  name: string;
  email: string;
  telegram: { id: string; username: string } | null;
  status: 'active' | 'inactive' | 'blocked' | 'churned';
  plan: 'free' | 'byok' | 'starter' | 'pro';
  lastActiveAt: Date;
  daysSinceSignup: number;
  transactionsCount: number;
  mrr: number;
  ltv: number;
  createdAt: Date;
}

export const mockUsers: MockUser[] = [
  {
    id: 1,
    name: 'Иван Иванов',
    email: 'ivan@example.com',
    telegram: { id: '123456789', username: 'ivan_ivanov' },
    status: 'active',
    plan: 'pro',
    lastActiveAt: new Date('2026-01-06'),
    daysSinceSignup: 45,
    transactionsCount: 127,
    mrr: 9.99,
    ltv: 149.85,
    createdAt: new Date('2025-11-22'),
  },
  // ... еще 50+ моковых пользователей
];
```

**Файл: `client/src/lib/admin/mock-data/metrics.mock.ts`**
```typescript
export interface MockHeroMetrics {
  mrr: { current: number; change: number; trend: number[] };
  totalUsers: { current: number; activeToday: number; change: number };
  ltv: number;
  cac: number;
  ltvCacRatio: number;
}

export const mockHeroMetrics: MockHeroMetrics = {
  mrr: {
    current: 12500.50,
    change: 12.5, // +12.5%
    trend: [8500, 9200, 9800, 10500, 11200, 11800, 12500],
  },
  totalUsers: {
    current: 1250,
    activeToday: 342,
    change: 8.3,
  },
  ltv: 89.50,
  cac: 28.30,
  ltvCacRatio: 3.16,
};
```

### 2.2 Создать API клиент с моками

**Файл: `client/src/lib/admin/api/admin-api.ts`**
```typescript
import { mockUsers } from '../mock-data/users.mock';
import { mockHeroMetrics } from '../mock-data/metrics.mock';

// Флаг для переключения между моками и реальным API
const USE_MOCKS = true; // Потом заменить на env переменную

export const adminApi = {
  // Метрики
  async getHeroMetrics() {
    if (USE_MOCKS) {
      // Имитация задержки сети
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockHeroMetrics;
    }
    // Потом: реальный fetch
    const response = await fetch('/api/admin/metrics/hero');
    return response.json();
  },

  // Пользователи
  async getUsers(params: { page?: number; limit?: number; filters?: any }) {
    if (USE_MOCKS) {
      await new Promise(resolve => setTimeout(resolve, 300));
      // Простая пагинация
      const page = params.page || 1;
      const limit = params.limit || 20;
      const start = (page - 1) * limit;
      const end = start + limit;
      return {
        users: mockUsers.slice(start, end),
        total: mockUsers.length,
        page,
        limit,
      };
    }
    // Потом: реальный fetch
  },

  async getUserById(id: number) {
    if (USE_MOCKS) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockUsers.find(u => u.id === id);
    }
    // Потом: реальный fetch
  },
};
```

---

## 🎯 Phase 3: Dashboard Page (2 дня)

### 3.1 Hero Metrics Cards

**Tasks:**
- [ ] Создать `<MetricCard>` компонент
- [ ] Создать `<HeroMetrics>` секцию
- [ ] Подключить TanStack Query
- [ ] Добавить loading states
- [ ] Добавить error handling

**Пример:**
```typescript
// client/src/components/admin/dashboard/HeroMetrics.tsx
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin/api/admin-api';
import { MetricCard } from './MetricCard';

export function HeroMetrics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'hero-metrics'],
    queryFn: () => adminApi.getHeroMetrics(),
  });

  if (isLoading) return <HeroMetricsSkeleton />;
  if (error) return <ErrorState />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="MRR"
        value={data.mrr.current}
        format="currency"
        change={data.mrr.change}
        trend={data.mrr.trend}
      />
      <MetricCard
        title="Total Users"
        value={data.totalUsers.current}
        format="number"
        change={data.totalUsers.change}
      />
      <MetricCard
        title="LTV"
        value={data.ltv}
        format="currency"
      />
      <MetricCard
        title="CAC"
        value={data.cac}
        format="currency"
      />
    </div>
  );
}
```

### 3.2 Charts

**Tasks:**
- [ ] Создать `<MRRChart>` с Recharts
- [ ] Создать `<CohortHeatmap>` (кастомный компонент)
- [ ] Добавить моковые данные для графиков

---

## 🎯 Phase 4: Users Management (3 дня)

### 4.1 Users Table

**Tasks:**
- [ ] Создать `<UsersTable>` с TanStack Table
- [ ] Добавить сортировку
- [ ] Добавить фильтры
- [ ] Добавить пагинацию
- [ ] Добавить поиск

### 4.2 User Detail Page

**Tasks:**
- [ ] Создать `<UserProfile>` компонент
- [ ] Создать `<UserTransactions>` компонент
- [ ] Создать `<UserTimeline>` компонент
- [ ] Добавить табы для навигации

---

## 🎯 Phase 5: Analytics & System Monitoring (2 дня)

### 5.1 Analytics Page

**Tasks:**
- [ ] Создать страницу аналитики
- [ ] Добавить графики (funnel, retention, feature adoption)
- [ ] Использовать моковые данные

### 5.2 System Monitoring

**Tasks:**
- [ ] Создать страницу мониторинга
- [ ] Показать статус API, DB, внешних сервисов
- [ ] Использовать моковые данные

---

## 🔄 Подключение реального API (когда бекенд готов)

### Шаг 1: Изменить флаг

```typescript
// client/src/lib/admin/api/admin-api.ts
const USE_MOCKS = process.env.VITE_USE_ADMIN_MOCKS === 'true';
```

### Шаг 2: Реализовать реальные fetch запросы

```typescript
export const adminApi = {
  async getHeroMetrics() {
    if (USE_MOCKS) {
      return mockHeroMetrics;
    }
    
    // Реальный API
    const response = await fetch('/api/admin/metrics/hero', {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return response.json();
  },
};
```

### Шаг 3: Обновить типы

Убедиться, что типы моковых данных совпадают с реальными API ответами.

---

## 📦 Зависимости (уже установлены)

- ✅ `@tanstack/react-query` - для data fetching
- ✅ `@tanstack/react-table` - для таблиц (нужно установить)
- ✅ `recharts` - для графиков
- ✅ `shadcn/ui` - UI компоненты
- ✅ `lucide-react` - иконки

### Нужно установить:

```bash
npm install @tanstack/react-table
```

---

## ✅ Acceptance Criteria

- [ ] Все страницы рендерятся с моковыми данными
- [ ] Все компоненты имеют loading states
- [ ] Все компоненты имеют error states
- [ ] Таблицы поддерживают сортировку и фильтрацию
- [ ] Графики отображают моковые данные
- [ ] Навигация работает корректно
- [ ] Responsive design (desktop-first для MVP)
- [ ] TypeScript strict mode, 0 any types

---

## 🚀 Начало работы

1. **Создать структуру папок:**
   ```bash
   mkdir -p client/src/pages/admin/{auth,dashboard,users,analytics,system}
   mkdir -p client/src/components/admin/{layout,dashboard,users,shared}
   mkdir -p client/src/lib/admin/{mock-data,api}
   mkdir -p client/src/hooks/admin
   ```

2. **Установить зависимости:**
   ```bash
   npm install @tanstack/react-table
   ```

3. **Начать с Phase 1** - создать базовую структуру и layout

---

## 📝 Примечания

- **Моки должны быть реалистичными** - использовать faker.js для генерации данных (опционально)
- **Типы должны совпадать** - моковые типы = реальные API типы
- **Легкое переключение** - один флаг для переключения мок/реальный API
- **Документировать API контракты** - чтобы бекенд знал что ожидать

---

**Готов начать разработку!** 🚀


# План разделения админ-панели на отдельный сервер

## 🎯 Цель

Разделить админ-панель и основное приложение на два независимых проекта, работающих на разных серверах, но использующих общую базу данных.

**Преимущества:**
- ✅ Админка останется доступной, если упадет основной сервер
- ✅ Безопасность - админка на отдельном домене/IP
- ✅ Независимое масштабирование
- ✅ Изоляция - падение одного не влияет на другой

---

## 📁 Структура после разделения

```
BudgetBot-Improved/              # Основной проект
├── client/                      # Пользовательский frontend
├── server/                      # Пользовательский backend (БЕЗ админки)
├── shared/                      # Общие типы и схемы
└── ...

BudgetBot-Admin/                 # НОВЫЙ: Отдельный проект админки
├── client/                      # Админ frontend
├── server/                      # Админ backend (ТОЛЬКО админка)
├── shared/                      # Ссылка на общий shared или копия
└── ...
```

---

## 🔧 Необходимые изменения

### 1. Backend - Основной проект (БЕЗ админки)

#### 1.1. Удалить админские роуты из `server/routes/index.ts`

**Файл:** `server/routes/index.ts`

**Удалить:**
```typescript
// Admin routes - MUST be before generic /api routes to avoid conflicts
try {
  app.use("/api/admin/auth", adminAuthRouter);
  app.use("/api/admin/metrics", adminMetricsRouter);
  app.use("/api/admin/users", adminUsersRouter);
  app.use("/api/admin/analytics", adminAnalyticsRouter);
  app.use("/api/admin/system", adminSystemRouter);
  app.use("/api/admin/broadcasts", adminBroadcastsRouter);
  app.use("/api/admin/support", adminSupportRouter);
  app.use("/api/admin", migrationRouter);
  app.use("/api/admin/audit-logs", adminAuditLogRouter);
} catch (error) {
  console.error('Error registering admin routes:', error);
  throw error;
}
```

**Удалить импорты:**
```typescript
import migrationRouter from "./admin/migration.routes";
import adminAuditLogRouter from "./admin/audit-log.routes";
import adminMetricsRouter from "./admin/metrics.routes";
import adminUsersRouter from "./admin/users.routes";
import adminAnalyticsRouter from "./admin/analytics.routes";
import adminSystemRouter from "./admin/system.routes";
import adminBroadcastsRouter from "./admin/broadcasts.routes";
import adminSupportRouter from "./admin/support.routes";
import adminAuthRouter from "./admin-auth.routes";
```

#### 1.2. Удалить админские middleware и сервисы (необязательно, можно оставить)

Если хотите полностью очистить проект:
- Удалить `server/middleware/admin-auth.middleware.ts`
- Удалить `server/services/admin-*.service.ts` (все admin сервисы)
- Удалить `server/routes/admin/` (всю папку)
- Удалить `server/routes/admin-auth.routes.ts`

**НО:** Можно оставить эти файлы, если планируете использовать их из админ-проекта через общую библиотеку.

---

### 2. Frontend - Основной проект (БЕЗ админки)

#### 2.1. Удалить админские страницы из `client/src/App.tsx`

**Файл:** `client/src/App.tsx`

**Удалить:**
```typescript
// Admin pages (lazy loaded)
const AdminLoginPage = lazy(() => import("@/pages/admin/auth/login"));
const AdminDashboardPage = lazy(() => import("@/pages/admin/dashboard/index"));
// ... и т.д.
```

**Удалить:**
```typescript
// Админ-маршруты (AdminQueryClientProvider оборачивается в App())
function AdminRoutes() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Switch>
        <Route path="/admin" component={() => <Redirect to="/admin/dashboard" />} />
        // ... все админские роуты
      </Switch>
    </Suspense>
  );
}
```

**Удалить логику определения админ-маршрута:**
```typescript
// Из функции App()
const [isAdminRoute, setIsAdminRoute] = useState(
  typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
);

// И условную логику с AdminRoutes
{isAdminRoute ? (
  <AdminQueryClientProvider>
    <I18nProvider>
      <AdminRoutes />
    </I18nProvider>
  </AdminQueryClientProvider>
) : (
  // основное приложение
)}
```

**Упростить до:**
```typescript
export default function App() {
  return (
    <TooltipProvider delayDuration={300}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <I18nProvider>
            <WebSocketProvider>
              <AppContent />
            </WebSocketProvider>
          </I18nProvider>
        </AuthProvider>
      </QueryClientProvider>
      <Toaster />
    </TooltipProvider>
  );
}
```

#### 2.2. Удалить админские компоненты

Удалить папки:
- `client/src/components/admin/`
- `client/src/pages/admin/`
- `client/src/lib/admin/`

#### 2.3. Обновить `client/src/pages/landing-page.tsx` (если есть проверки на `/admin`)

---

### 3. Backend - Новый админ-проект

#### 3.1. Создать структуру проекта

```bash
mkdir BudgetBot-Admin
cd BudgetBot-Admin
npm init -y
```

#### 3.2. Скопировать необходимые файлы

**Из основного проекта:**
- `server/routes/admin/` → `server/routes/`
- `server/routes/admin-auth.routes.ts` → `server/routes/auth.routes.ts`
- `server/middleware/admin-auth.middleware.ts` → `server/middleware/`
- `server/services/admin-*.service.ts` → `server/services/`
- `server/lib/admin-*.ts` → `server/lib/`
- `server/repositories/` → `server/repositories/` (если используются)
- `server/db.ts` → `server/db.ts` (общая БД)
- `server/auth.ts` → `server/auth.ts` (для сессий)

**Обновить импорты в роутах:**
```typescript
// Было: app.use("/api/admin/auth", adminAuthRouter);
// Стало: app.use("/api/auth", adminAuthRouter);

// Было: app.use("/api/admin/users", adminUsersRouter);
// Стало: app.use("/api/users", adminUsersRouter);
// и т.д.
```

#### 3.3. Создать новый `server/routes/index.ts` для админки

```typescript
import type { Express } from "express";
import adminAuthRouter from "./auth.routes";
import adminUsersRouter from "./users.routes";
import adminAnalyticsRouter from "./analytics.routes";
import adminSystemRouter from "./system.routes";
import adminBroadcastsRouter from "./broadcasts.routes";
import adminSupportRouter from "./support.routes";
import adminMetricsRouter from "./metrics.routes";
import adminAuditLogRouter from "./audit-log.routes";
import migrationRouter from "./migration.routes";

export function registerRoutes(app: Express) {
  // Админ-аутентификация
  app.use("/api/auth", adminAuthRouter);
  
  // Админ-роуты (требуют аутентификации)
  app.use("/api/users", adminUsersRouter);
  app.use("/api/analytics", adminAnalyticsRouter);
  app.use("/api/system", adminSystemRouter);
  app.use("/api/broadcasts", adminBroadcastsRouter);
  app.use("/api/support", adminSupportRouter);
  app.use("/api/metrics", adminMetricsRouter);
  app.use("/api/audit-logs", adminAuditLogRouter);
  app.use("/api/migration", migrationRouter);
}
```

#### 3.4. Создать `server/index.ts` для админки

```typescript
import express from "express";
import cors from "cors";
import { setupAuth } from "./auth";
import { registerRoutes } from "./routes";
import { env } from "./lib/env";

const app = express();
const PORT = process.env.PORT || 3001; // Другой порт!

// CORS - разрешить только админский домен
app.use(cors({
  origin: process.env.ADMIN_FRONTEND_URL || "http://localhost:5174",
  credentials: true,
}));

app.use(express.json());

(async () => {
  await setupAuth(app);
  registerRoutes(app);
  
  app.listen(PORT, () => {
    console.log(`[ADMIN SERVER] Running on port ${PORT}`);
  });
})();
```

---

### 4. Frontend - Новый админ-проект

#### 4.1. Создать новый React проект или скопировать структуру

```bash
cd BudgetBot-Admin
# Или использовать vite create
npm create vite@latest client -- --template react-ts
```

#### 4.2. Скопировать админские компоненты из основного проекта

- `client/src/components/admin/` → `client/src/components/`
- `client/src/pages/admin/` → `client/src/pages/`
- `client/src/lib/admin/` → `client/src/lib/`

#### 4.3. Обновить API базовый URL

**Файл:** `client/src/lib/admin/api/admin-error-handler.ts`

**Изменить:**
```typescript
// Было: fetch(url, ...)
// Стало: fetch(`${import.meta.env.VITE_ADMIN_API_URL}${url}`, ...)
```

Или создать конфиг:
```typescript
// client/src/lib/admin/config.ts
export const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:3001';
```

**Обновить `admin-api.ts`:**
```typescript
import { ADMIN_API_URL } from './config';

export const adminApi = {
  async getHeroMetrics() {
    const response = await adminApiFetch(`${ADMIN_API_URL}/api/metrics/hero`);
    // ...
  },
  // и т.д. - убрать `/api/admin` из путей, оставить только `/api/...`
}
```

#### 4.4. Создать `client/src/App.tsx` для админки

```typescript
import { Suspense, lazy } from "react";
import { Switch, Route, Redirect } from "wouter";
import { AdminQueryClientProvider } from "@/components/AdminQueryClientProvider";
import { PageLoading } from "@/components/loading-spinner";
import { AdminLayout } from "@/components/layout/AdminLayout";

// Admin pages
const AdminLoginPage = lazy(() => import("@/pages/auth/login"));
const AdminDashboardPage = lazy(() => import("@/pages/dashboard/index"));
// ... остальные страницы

function App() {
  return (
    <AdminQueryClientProvider>
      <Suspense fallback={<PageLoading />}>
        <Switch>
          <Route path="/login" component={AdminLoginPage} />
          <Route path="/dashboard" component={AdminDashboardPage} />
          <Route path="/users/:id" component={AdminUserDetailPage} />
          <Route path="/users" component={AdminUsersListPage} />
          {/* и т.д. */}
          <Route path="/" component={() => <Redirect to="/dashboard" />} />
        </Switch>
      </Suspense>
    </AdminQueryClientProvider>
  );
}

export default App;
```

---

## 🔐 Конфигурация переменных окружения

### Основной проект (`.env`)

```env
# Убрать все админские переменные, оставить только пользовательские
DATABASE_URL=postgresql://...
SESSION_SECRET=...
# и т.д.
```

### Админ-проект (`.env`)

```env
# Та же БД!
DATABASE_URL=postgresql://...

# Сессии (можно использовать тот же SECRET или отдельный)
SESSION_SECRET=... (новый или тот же)

# API админ-сервера
PORT=3001
ADMIN_FRONTEND_URL=http://admin.yourdomain.com

# CORS для админки
ALLOWED_ORIGINS=http://admin.yourdomain.com
```

### Админ Frontend (`.env`)

```env
VITE_ADMIN_API_URL=http://localhost:3001
# или в проде: https://admin-api.yourdomain.com
```

---

## 📦 Общая база данных

Оба проекта будут использовать **одну и ту же базу данных**:

```typescript
// Оба проекта используют одинаковую DATABASE_URL
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ...
});
```

**Важно:**
- ✅ Оба проекта читают/пишут в одни и те же таблицы
- ✅ Админка имеет доступ к таблицам `admin_users`, `admin_audit_log`
- ✅ Сессии админки хранятся в той же таблице `session` (по `adminId`)

---

## 🚀 Деплой

### Сервер 1: Основное приложение

```
Domain: app.yourdomain.com
Port: 3000
```

### Сервер 2: Админ-панель

```
Domain: admin.yourdomain.com (или другой домен)
Port: 3001
Backend: admin-api.yourdomain.com
```

**Nginx конфиг для админки:**

```nginx
# Админ API
server {
    listen 80;
    server_name admin-api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Админ Frontend
server {
    listen 80;
    server_name admin.yourdomain.com;
    
    location / {
        root /var/www/admin-frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## ✅ Чек-лист изменений

### Основной проект:

- [ ] Удалить админские роуты из `server/routes/index.ts`
- [ ] Удалить админские импорты
- [ ] Удалить `AdminRoutes` из `client/src/App.tsx`
- [ ] Удалить логику определения админ-маршрутов
- [ ] Удалить папки `client/src/components/admin/`
- [ ] Удалить папки `client/src/pages/admin/`
- [ ] Удалить папки `client/src/lib/admin/`
- [ ] Обновить `package.json` (убрать зависимости, если они только для админки)
- [ ] Обновить документацию

### Админ-проект:

- [ ] Создать новую структуру проекта
- [ ] Скопировать админские роуты и сервисы
- [ ] Обновить пути API (убрать `/api/admin`, оставить `/api/...`)
- [ ] Создать `server/index.ts` с портом 3001
- [ ] Настроить CORS для админ-домена
- [ ] Скопировать админские компоненты frontend
- [ ] Обновить API URL в `admin-api.ts`
- [ ] Создать новый `App.tsx` для админки
- [ ] Настроить `.env` файлы
- [ ] Настроить сборку и деплой

---

## 🎯 Итоговая архитектура

```
┌─────────────────────────┐         ┌─────────────────────────┐
│  Основной сервер        │         │  Админ-сервер           │
│  app.yourdomain.com     │         │  admin.yourdomain.com   │
│  Port: 3000             │         │  Port: 3001             │
│                         │         │                         │
│  ┌─────────────────┐   │         │  ┌─────────────────┐   │
│  │  User Frontend  │   │         │  │ Admin Frontend  │   │
│  │  (React)        │   │         │  │ (React)         │   │
│  └─────────────────┘   │         │  └─────────────────┘   │
│           │             │         │           │             │
│  ┌─────────────────┐   │         │  ┌─────────────────┐   │
│  │  User Backend   │   │         │  │ Admin Backend   │   │
│  │  /api/*         │   │         │  │ /api/*          │   │
│  └─────────────────┘   │         │  └─────────────────┘   │
└───────────┬─────────────┘         └───────────┬─────────────┘
            │                                   │
            └───────────┬───────────────────────┘
                        │
                ┌───────▼────────┐
                │  PostgreSQL    │
                │  (общая БД)    │
                └────────────────┘
```

---

## 📝 Примечания

1. **Общий shared/** - можно использовать git subtree или symlink, либо скопировать
2. **Сессии** - оба проекта используют одну таблицу `session`, но админка хранит `adminId`, а основное приложение `userId`
3. **CORS** - обязательно настроить для админ-домена
4. **Безопасность** - админ-сервер должен быть доступен только из определенных IP/доменов
5. **Мониторинг** - настройте отдельный мониторинг для админ-сервера

---

## 🔄 Миграция (пошагово)

1. **Этап 1:** Создать админ-проект, скопировать файлы
2. **Этап 2:** Протестировать админку локально на порту 3001
3. **Этап 3:** Задеплоить админку на отдельный сервер
4. **Этап 4:** Удалить админку из основного проекта
5. **Этап 5:** Протестировать основное приложение без админки
6. **Этап 6:** Обновить документацию и README

---

Готов помочь с реализацией любого из этапов! 🚀

# 🚀 План разработки бекенда для админ-панели

**Дата создания:** 2026-01-07  
**Статус:** Готов к реализации  
**Основан на:** `ADMIN_PANEL_SPECIFICATION.md`

---

## 📋 Обзор

Фронтенд админ-панели готов и работает с mock-данными. Теперь нужно создать реальные API endpoints для замены моков.

**Текущее состояние:**
- ✅ Фронтенд полностью готов
- ✅ Mock данные реалистичные
- ✅ API клиент с флагом `USE_MOCKS = true`
- ⏳ Бекенд API endpoints отсутствуют

**Цель:** Реализовать все API endpoints из спецификации, начиная с критичных (P0).

---

## 🎯 Приоритеты

### P0 - Критично (MVP)
1. **Admin Authentication** - вход в админку
2. **Users API** - список и детали пользователей
3. **Metrics API** - метрики для dashboard
4. **Audit Log API** - уже частично есть

### P1 - Важно
5. **Analytics API** - воронка, feature adoption, segments
6. **System Health API** - мониторинг системы
7. **User Actions API** - блокировка, изменение плана

### P2 - Желательно
8. **Broadcasts API** - рассылки
9. **Support API** - чаты с пользователями
10. **Referral API** - реферальная система

---

## 📦 Phase 0: Подготовка (1-2 дня)

### 0.1 Database Schema

**Задачи:**
- [ ] Создать миграцию для `admin_users` таблицы
- [ ] Создать миграцию для `admin_audit_log` таблицы (если еще нет)
- [ ] Обновить `shared/schema.ts` с новыми таблицами

**Файлы:**
```
migrations/
  XXXX_create_admin_users.sql
  XXXX_create_admin_audit_log.sql

shared/
  schema.ts (обновить)
```

**SQL для admin_users:**
```sql
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'support', -- 'super_admin', 'support', 'analyst', 'readonly'
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  ip_whitelist TEXT[],
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
```

**SQL для admin_audit_log:**
```sql
CREATE TABLE admin_audit_log (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'user.ban', 'plan.change', 'broadcast.send'
  entity_type TEXT, -- 'user', 'transaction', 'plan'
  entity_id TEXT,
  changes JSONB, -- before/after
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
```

### 0.2 Admin Auth Service

**Задачи:**
- [ ] Создать `server/services/admin-auth.service.ts`
- [ ] Реализовать `hashPassword`, `verifyPassword`
- [ ] Реализовать `createAdmin`, `findAdminByEmail`
- [ ] Реализовать `validateAdminSession`

**Файлы:**
```
server/
  services/
    admin-auth.service.ts
```

**Пример кода:**
```typescript
import bcrypt from 'bcrypt';
import { db } from '../../shared/db';
import { adminUsers } from '../../shared/schema';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function findAdminByEmail(email: string) {
  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);
  return admin;
}

export async function createAdmin(data: {
  email: string;
  password: string;
  role: string;
  permissions?: string[];
}) {
  const passwordHash = await hashPassword(data.password);
  const [admin] = await db
    .insert(adminUsers)
    .values({
      email: data.email,
      passwordHash,
      role: data.role,
      permissions: data.permissions || [],
    })
    .returning();
  return admin;
}
```

### 0.3 Admin Auth Middleware

**Задачи:**
- [ ] Создать `server/middleware/admin-auth.middleware.ts`
- [ ] Реализовать `requireAdmin` middleware
- [ ] Реализовать проверку ролей и permissions
- [ ] Добавить логирование в audit log

**Файлы:**
```
server/
  middleware/
    admin-auth.middleware.ts
```

**Пример кода:**
```typescript
import { Request, Response, NextFunction } from 'express';
import { findAdminByEmail } from '../services/admin-auth.service';
import { adminUsers } from '../../shared/schema';

export interface AdminRequest extends Request {
  admin?: {
    id: number;
    email: string;
    role: string;
    permissions: string[];
  };
}

export async function requireAdmin(
  req: AdminRequest,
  res: Response,
  next: NextFunction
) {
  // Проверка сессии (аналогично withAuth для обычных пользователей)
  // Если нет сессии - 401
  // Если сессия не админская - 403
  // Если все ок - добавляем req.admin и next()
}

export function requirePermission(permission: string) {
  return (req: AdminRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!req.admin.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

### 0.4 Admin Auth Routes

**Задачи:**
- [ ] Создать `server/routes/admin-auth.routes.ts`
- [ ] Реализовать `POST /api/admin/auth/login`
- [ ] Реализовать `POST /api/admin/auth/logout`
- [ ] Реализовать `GET /api/admin/auth/me` (текущий админ)

**Файлы:**
```
server/
  routes/
    admin-auth.routes.ts
```

**Пример кода:**
```typescript
import { Router } from 'express';
import { requireAdmin } from '../../middleware/admin-auth.middleware';
import { findAdminByEmail, verifyPassword } from '../../services/admin-auth.service';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  const admin = await findAdminByEmail(email);
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const isValid = await verifyPassword(password, admin.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Создать сессию (аналогично обычному login)
  // Вернуть токен или установить cookie
});

router.post('/logout', requireAdmin, async (req, res) => {
  // Удалить сессию
  res.json({ success: true });
});

router.get('/me', requireAdmin, async (req, res) => {
  res.json({
    id: req.admin.id,
    email: req.admin.email,
    role: req.admin.role,
    permissions: req.admin.permissions,
  });
});

export default router;
```

### 0.5 Регистрация роутов

**Задачи:**
- [ ] Обновить `server/routes/index.ts`
- [ ] Добавить `app.use('/api/admin/auth', adminAuthRouter)`

---

## 📊 Phase 1: Metrics API (2-3 дня)

### 1.1 Hero Metrics Endpoint

**Задачи:**
- [ ] Создать `server/routes/admin/metrics.routes.ts`
- [ ] Реализовать `GET /api/admin/metrics/hero`
- [ ] Вычислить MRR, ARR, Users, LTV, CAC
- [ ] Добавить кэширование (Redis или in-memory, 5 min TTL)

**Пример запроса:**
```typescript
GET /api/admin/metrics/hero

Response:
{
  mrr: {
    current: 5000.00,
    change: 15.5, // % за последние 30 дней
    trend: [4000, 4200, 4500, 4800, 5000] // за 12 месяцев
  },
  totalUsers: {
    current: 1200,
    activeToday: 450,
    change: 8.2
  },
  ltv: 89.50,
  cac: 25.30,
  ltvCacRatio: 3.54
}
```

**SQL запросы:**
```sql
-- MRR
SELECT 
  SUM(CASE WHEN plan = 'pro' THEN 9.99 
           WHEN plan = 'starter' THEN 4.99 
           ELSE 0 END) as mrr
FROM users
WHERE status = 'active' AND plan IN ('pro', 'starter');

-- Total Users
SELECT COUNT(*) FROM users;

-- LTV (средний)
SELECT AVG(ltv) FROM (
  SELECT 
    u.id,
    SUM(p.amount) as ltv
  FROM users u
  LEFT JOIN payments p ON p.user_id = u.id
  WHERE p.status = 'succeeded'
  GROUP BY u.id
) as user_ltv;
```

### 1.2 Revenue Metrics Endpoint

**Задачи:**
- [ ] Реализовать `GET /api/admin/metrics/revenue`
- [ ] MRR breakdown (new, expansion, contraction, churn)
- [ ] Churn metrics (user churn rate, revenue churn rate, NRR)
- [ ] ARPU (Average Revenue Per User)

### 1.3 Growth Metrics Endpoint

**Задачи:**
- [ ] Реализовать `GET /api/admin/metrics/growth`
- [ ] User growth (MAU, DAU, WAU)
- [ ] Activation metrics (signup to first transaction)
- [ ] Retention (D1, D7, D30)

### 1.4 Unit Economics Endpoint

**Задачи:**
- [ ] Реализовать `GET /api/admin/metrics/unit-economics`
- [ ] CAC by channel
- [ ] LTV by plan
- [ ] CAC Payback Period

---

## 👥 Phase 2: Users API (3-4 дня)

### 2.1 Users List Endpoint

**Задачи:**
- [ ] Создать `server/routes/admin/users.routes.ts`
- [ ] Реализовать `GET /api/admin/users`
- [ ] Пагинация (page, limit)
- [ ] Фильтры (status, plan, search)
- [ ] Сортировка

**Пример запроса:**
```typescript
GET /api/admin/users?page=1&limit=20&status=active&plan=pro&search=john

Response:
{
  users: [...],
  total: 150,
  page: 1,
  limit: 20,
  totalPages: 8
}
```

**SQL запрос:**
```sql
SELECT 
  u.id,
  u.name,
  u.email,
  u.status,
  u.plan,
  u.created_at,
  u.last_active_at,
  COUNT(t.id) as transactions_count,
  -- другие поля
FROM users u
LEFT JOIN transactions t ON t.user_id = u.id
WHERE 
  ($1::text IS NULL OR u.status = $1)
  AND ($2::text IS NULL OR u.plan = $2)
  AND ($3::text IS NULL OR u.name ILIKE '%' || $3 || '%' OR u.email ILIKE '%' || $3 || '%')
GROUP BY u.id
ORDER BY u.created_at DESC
LIMIT $4 OFFSET $5;
```

### 2.2 User Detail Endpoint

**Задачи:**
- [ ] Реализовать `GET /api/admin/users/:id`
- [ ] Полная информация о пользователе
- [ ] Статистика (transactions, budgets, goals)
- [ ] Engagement metrics

### 2.3 User Transactions Endpoint

**Задачи:**
- [ ] Реализовать `GET /api/admin/users/:id/transactions`
- [ ] Пагинация
- [ ] Фильтр по типу (income/expense)
- [ ] Сортировка по дате

### 2.4 User Timeline Endpoint

**Задачи:**
- [ ] Реализовать `GET /api/admin/users/:id/timeline`
- [ ] События из audit_log
- [ ] Важные milestones (signup, first transaction, upgrade)
- [ ] Хронологический порядок

### 2.5 User Actions Endpoints

**Задачи:**
- [ ] `PATCH /api/admin/users/:id` - обновление пользователя
- [ ] `POST /api/admin/users/:id/block` - блокировка
- [ ] `POST /api/admin/users/:id/unblock` - разблокировка
- [ ] `POST /api/admin/users/:id/change-plan` - изменение плана
- [ ] `POST /api/admin/users/:id/grant-credits` - начисление кредитов

**Важно:** Все действия должны логироваться в `admin_audit_log`!

---

## 📈 Phase 3: Analytics API (2-3 дня)

### 3.1 Funnel Analysis Endpoint

**Задачи:**
- [ ] Создать `server/routes/admin/analytics.routes.ts`
- [ ] Реализовать `GET /api/admin/analytics/funnel`
- [ ] Вычислить conversion rates для каждого шага
- [ ] Время между шагами

### 3.2 Feature Adoption Endpoint

**Задачи:**
- [ ] Реализовать `GET /api/admin/analytics/feature-adoption`
- [ ] Использование каждой фичи
- [ ] Adoption rate
- [ ] Retention lift

### 3.3 User Segments Endpoint

**Задачи:**
- [ ] Реализовать `GET /api/admin/analytics/user-segments`
- [ ] Pre-defined segments (New Users, Power Users, At Risk, etc.)
- [ ] Количество пользователей в каждом сегменте

---

## 🔍 Phase 4: System Health API (1-2 дня)

### 4.1 System Health Endpoint

**Задачи:**
- [ ] Создать `server/routes/admin/system.routes.ts`
- [ ] Реализовать `GET /api/admin/system/health`
- [ ] API performance metrics
- [ ] Database health
- [ ] External services status (Telegram, OpenAI, Stripe)
- [ ] Background jobs status

**Пример:**
```typescript
GET /api/admin/system/health

Response:
{
  api: {
    uptime: 99.9,
    avgResponseTime: 120,
    errorRate: 0.1,
    requests24h: 45000
  },
  database: {
    connections: 10,
    maxConnections: 100,
    slowQueries: 2,
    size: 2.5 // GB
  },
  external: {
    telegram: { status: 'healthy', latency: 50 },
    openai: { status: 'healthy', latency: 200 },
    stripe: { status: 'healthy', latency: 100 }
  },
  jobs: {
    currencyUpdate: { lastRun: '2026-01-07T10:00:00Z', status: 'success' },
    dailyNotifications: { lastRun: '2026-01-07T09:00:00Z', status: 'success', sent: 120 }
  }
}
```

---

## 📧 Phase 5: Broadcasts API (2-3 дня)

### 5.1 Broadcasts Endpoints

**Задачи:**
- [ ] Создать `server/routes/admin/broadcasts.routes.ts`
- [ ] `GET /api/admin/broadcasts` - список рассылок
- [ ] `POST /api/admin/broadcasts` - создание рассылки
- [ ] `GET /api/admin/broadcasts/:id` - детали рассылки
- [ ] `POST /api/admin/broadcasts/:id/send` - отправка
- [ ] `GET /api/admin/broadcasts/templates` - шаблоны

---

## 💬 Phase 6: Support API (2-3 дня)

### 6.1 Support Chat Endpoints

**Задачи:**
- [ ] Создать `server/routes/admin/support.routes.ts`
- [ ] `GET /api/admin/support/chats` - список чатов
- [ ] `GET /api/admin/support/chats/:id/messages` - сообщения чата
- [ ] `POST /api/admin/support/chats/:id/messages` - отправка сообщения
- [ ] `PATCH /api/admin/support/chats/:id` - обновление статуса

---

## 🔗 Интеграция с фронтендом

### Шаг 1: Переключение на реальный API

**Задачи:**
- [ ] В `client/src/lib/admin/api/admin-api.ts` изменить `USE_MOCKS = false`
- [ ] Протестировать все endpoints
- [ ] Исправить несоответствия между моками и реальным API

### Шаг 2: Обработка ошибок

**Задачи:**
- [ ] Добавить обработку 401 (Unauthorized) - редирект на login
- [ ] Добавить обработку 403 (Forbidden) - показать сообщение
- [ ] Добавить обработку 500 (Server Error) - показать ошибку

### Шаг 3: Loading states

**Задачи:**
- [ ] Убедиться что все запросы показывают loading
- [ ] Добавить skeletons где нужно

---

## 🧪 Тестирование

### Unit Tests

**Задачи:**
- [ ] Тесты для `admin-auth.service.ts`
- [ ] Тесты для `admin-auth.middleware.ts`
- [ ] Тесты для всех endpoints

**Пример:**
```typescript
describe('Admin Auth Service', () => {
  it('should hash password', async () => {
    const hash = await hashPassword('test123');
    expect(hash).not.toBe('test123');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('should verify password', async () => {
    const hash = await hashPassword('test123');
    const isValid = await verifyPassword('test123', hash);
    expect(isValid).toBe(true);
  });
});
```

### Integration Tests

**Задачи:**
- [ ] Тесты для полного flow (login → get users → get metrics)
- [ ] Тесты для permissions
- [ ] Тесты для audit log

---

## 📝 Документация

### API Documentation

**Задачи:**
- [ ] Добавить Swagger/OpenAPI документацию для всех endpoints
- [ ] Примеры запросов и ответов
- [ ] Описание ошибок

---

## 🚀 Деплой

### Staging

**Задачи:**
- [ ] Создать тестового админа в staging БД
- [ ] Протестировать все endpoints
- [ ] Проверить производительность

### Production

**Задачи:**
- [ ] Создать первого супер-админа
- [ ] Настроить мониторинг
- [ ] Настроить алерты

---

## 📊 Оценка времени

| Phase | Задачи | Время |
|-------|--------|-------|
| Phase 0 | Подготовка (DB, Auth) | 1-2 дня |
| Phase 1 | Metrics API | 2-3 дня |
| Phase 2 | Users API | 3-4 дня |
| Phase 3 | Analytics API | 2-3 дня |
| Phase 4 | System Health | 1-2 дня |
| Phase 5 | Broadcasts | 2-3 дня |
| Phase 6 | Support | 2-3 дня |
| **Итого** | | **13-20 дней** |

---

## ✅ Чек-лист перед стартом

- [ ] Прочитать `ADMIN_PANEL_SPECIFICATION.md`
- [ ] Понять структуру существующего кода
- [ ] Настроить локальную БД
- [ ] Создать тестового админа
- [ ] Начать с Phase 0

---

## 🎯 Первые шаги

1. **Создать миграции для admin_users и admin_audit_log**
2. **Реализовать admin-auth.service.ts**
3. **Реализовать admin-auth.middleware.ts**
4. **Создать POST /api/admin/auth/login endpoint**
5. **Протестировать login во фронтенде**

---

**Готов начать? Начни с Phase 0! 🚀**


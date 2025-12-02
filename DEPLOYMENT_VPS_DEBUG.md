# BudgetBot VPS Deployment & Debug Log

**Дата:** 2 декабря 2025
**Сервер:** Timeweb VPS (Netherlands)
**IP:** 5.129.230.171
**Порт:** 5000

---

## 1. Начальная настройка сервера

### Структура деплоя
```
/var/www/budgetbot/          # Основная директория приложения
├── dist/                    # Скомпилированный бэкенд
│   ├── index.js            # Основной серверный файл
│   └── public/             # Статика фронтенда
├── node_modules/
├── shared/                  # Shared schema для Drizzle
├── start.sh                # Скрипт запуска с env переменными
└── ...
```

### PM2 конфигурация
```bash
pm2 start /var/www/budgetbot/start.sh --name budgetbot
pm2 save
pm2 startup
```

### start.sh
```bash
#!/bin/bash
export DATABASE_URL="postgresql://..."
export SESSION_SECRET="..."
export ENCRYPTION_KEY="..."
export TELEGRAM_BOT_TOKEN="..."
export PORT=5000
export NODE_ENV=production
export SECURE_COOKIES=false  # Добавлено для HTTP-only деплоя
cd /var/www/budgetbot
exec node dist/index.js
```

---

## 2. Исправленные баги

### 2.1 PostgreSQL Sequences Out of Sync

**Проблема:** При регистрации нового пользователя ошибка:
```
duplicate key value violates unique constraint "users_pkey"
```

**Причина:** PostgreSQL sequences были рассинхронизированы с реальными данными. Sequence был на значении 4, а максимальный ID в таблице был 9.

**Решение:** Сброс всех sequences:
```sql
-- Для каждой таблицы с serial ID:
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM users), false);
SELECT setval('wallets_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM wallets), false);
SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM categories), false);
SELECT setval('transactions_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM transactions), false);
SELECT setval('budgets_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM budgets), false);
SELECT setval('personal_tags_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM personal_tags), false);
SELECT setval('recurring_transactions_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM recurring_transactions), false);
SELECT setval('assets_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM assets), false);
SELECT setval('wishlist_items_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM wishlist_items), false);
SELECT setval('ai_training_history_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM ai_training_history), false);
SELECT setval('notifications_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM notifications), false);
SELECT setval('audit_logs_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM audit_logs), false);
-- ... и т.д. для всех таблиц
```

**Результат исправления:**
| Таблица | Было | Стало |
|---------|------|-------|
| users | 4 | 91 |
| wallets | 1 | 15 |
| categories | 9 | 284 |
| personal_tags | 5 | 74 |
| transactions | 1 | 428 |

---

### 2.2 Rate Limiter IPv6 Error

**Проблема:** Сервер падал при старте с ошибкой:
```
ValidationError: Custom keyGenerator appears to use request IP
without calling the ipKeyGenerator helper function for IPv6 addresses
```

**Причина:** В `heavyOperationRateLimiter` использовался `req.ip` напрямую без обработки IPv6.

**Файл:** `server/middleware/rate-limit.ts`

**Было:**
```typescript
keyGenerator: (req) => {
  const userId = (req.user as any)?.id;
  if (userId) {
    return `heavy:user:${userId}`;
  }
  return `heavy:ip:${req.ip || 'unknown'}`;  // ❌ Проблема
},
```

**Стало:**
```typescript
keyGenerator: (req) => {
  const userId = (req.user as any)?.id;
  if (userId) {
    return `heavy:user:${userId}`;
  }
  return 'heavy:unauthenticated';  // ✅ Исправлено
},
```

---

### 2.3 401 Unauthorized After Login (Session Cookie Issue)

**Проблема:** После логина все API запросы возвращали 401 Unauthorized. WebSocket подключался, но HTTP запросы не работали.

**Причина:** В production режиме cookies устанавливались с флагом `Secure=true`, который требует HTTPS. Браузер не отправлял такие cookies через HTTP соединение.

**Файл:** `server/auth.ts`

**Было:**
```typescript
if (app.get("env") === "production") {
  app.set("trust proxy", 1);
  sessionSettings.cookie = {
    ...sessionSettings.cookie,
    secure: true,  // ❌ Всегда true в production
  };
}
```

**Стало:**
```typescript
if (app.get("env") === "production") {
  app.set("trust proxy", 1);
  if (env.SECURE_COOKIES) {
    sessionSettings.cookie = {
      ...sessionSettings.cookie,
      secure: true,
    };
  } else {
    logWarning('⚠️  Running in production without secure cookies...');
  }
}
```

**Добавлена переменная окружения:** `SECURE_COOKIES`

**Файл:** `server/lib/env.ts`
```typescript
SECURE_COOKIES: z.string()
  .optional()
  .transform(val => val !== 'false')
  .describe('Set to "false" for HTTP-only deployments'),
```

**В start.sh добавлено:**
```bash
export SECURE_COOKIES=false
```

---

### 2.4 Missing Default Data for New Users

**Проблема:** Новый пользователь (user 10) не имел категорий, тегов, настроек из-за частичной регистрации.

**Решение:** Создание default данных вручную через SQL:
```sql
-- Категории
INSERT INTO categories (user_id, name, type, icon, color) VALUES
(10, 'Food & Drinks', 'expense', '🍔', '#ef4444'),
(10, 'Transport', 'expense', '🚗', '#f97316'),
(10, 'Shopping', 'expense', '🛍️', '#8b5cf6'),
(10, 'Entertainment', 'expense', '🎮', '#ec4899'),
(10, 'Bills', 'expense', '💳', '#6366f1'),
(10, 'Salary', 'income', '💰', '#10b981'),
(10, 'Freelance', 'income', '💻', '#06b6d4'),
(10, 'Unaccounted', 'expense', '❓', '#dc2626');

-- Теги
INSERT INTO personal_tags (user_id, name, color) VALUES
(10, 'Important', '#ef4444'),
(10, 'Regular', '#3b82f6');

-- Настройки
INSERT INTO user_settings (user_id, theme, language, currency, timezone)
VALUES (10, 'system', 'en', 'RUB', 'Europe/Moscow');
```

---

## 3. Процесс деплоя обновлений

### Сборка локально
```bash
npm run build
```

### Копирование на сервер
```bash
# Через expect (для автоматизации пароля)
expect -c '
spawn scp -o StrictHostKeyChecking=no dist/index.js root@5.129.230.171:/var/www/budgetbot/dist/
expect "password:"
send "YOUR_PASSWORD\r"
expect eof
'
```

### Перезапуск на сервере
```bash
ssh root@5.129.230.171
pm2 restart 0
pm2 logs 0 --lines 50
```

---

## 4. Полезные команды

### Мониторинг
```bash
pm2 list                    # Список процессов
pm2 logs 0 --lines 100     # Логи приложения
pm2 monit                   # Мониторинг CPU/RAM
```

### Проверка здоровья
```bash
curl http://5.129.230.171:5000/api/health
```

### Проверка sequences в PostgreSQL
```sql
SELECT
  schemaname,
  sequencename,
  last_value
FROM pg_sequences
WHERE schemaname = 'public';
```

### Просмотр пользователей
```sql
SELECT id, email, name, created_at FROM users ORDER BY id DESC LIMIT 10;
```

---

## 5. Конфигурация Environment Variables

| Переменная | Описание | Обязательна |
|------------|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string | Да |
| `SESSION_SECRET` | Секрет для подписи сессий (min 32 chars) | Да |
| `ENCRYPTION_KEY` | Ключ шифрования API ключей (44 chars base64) | Да |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота | Нет |
| `PORT` | Порт сервера (default: 5000) | Нет |
| `NODE_ENV` | production / development | Нет |
| `SECURE_COOKIES` | "false" для HTTP-only деплоя | Нет |
| `REDIS_URL` | Redis для кэширования | Нет |
| `SENTRY_DSN` | Sentry для мониторинга ошибок | Нет |

---

## 6. Известные ограничения текущего деплоя

1. **HTTP без SSL** - Сессии работают, но данные передаются без шифрования. Рекомендуется настроить HTTPS через Nginx + Let's Encrypt.

2. **Нет Redis** - Кэширование отключено. Для production с высокой нагрузкой рекомендуется добавить Redis.

3. **Нет Sentry** - Мониторинг ошибок отключен. Рекомендуется настроить для production.

4. **Polling вместо Webhooks** - Telegram бот работает в режиме polling. Для production лучше настроить webhooks.

---

## 7. Рекомендации для production

1. **Настроить HTTPS:**
   ```bash
   apt install nginx certbot python3-certbot-nginx
   certbot --nginx -d yourdomain.com
   ```

2. **Добавить Redis:**
   ```bash
   apt install redis-server
   # В start.sh добавить:
   export REDIS_URL="redis://localhost:6379"
   ```

3. **Настроить Sentry:**
   - Создать проект на sentry.io
   - Добавить `SENTRY_DSN` в start.sh

4. **Настроить автообновление SSL:**
   ```bash
   certbot renew --dry-run
   ```

---

*Документ создан: 2 декабря 2025*

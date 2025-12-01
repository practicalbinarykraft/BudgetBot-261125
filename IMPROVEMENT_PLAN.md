# 🚀 План улучшения BudgetBot

## Оглавление
1. [P0 - Критичные security уязвимости](#p0-критичные-security-уязвимости)
2. [P1 - Важная инфраструктура](#p1-важная-инфраструктура)
3. [P2 - Производительность и масштабирование](#p2-производительность-и-масштабирование)
4. [P3 - Качество кода и UX](#p3-качество-кода-и-ux)
5. [P4 - Долгосрочные улучшения](#p4-долгосрочные-улучшения)

---

## P0 - Критичные security уязвимости
**Сроки**: 1-2 недели | **Приоритет**: 🔴 МАКСИМАЛЬНЫЙ

### 1. Шифрование API ключей в БД
**Проблема**: API ключи хранятся в открытом виде
**Риск**: Утечка БД = утечка всех ключей пользователей

**Задачи**:
- [ ] 1.1. Создать сервис шифрования
  ```typescript
  // server/lib/encryption.ts
  import crypto from 'crypto';

  const ALGORITHM = 'aes-256-gcm';
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 байта в base64

  export function encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY!, 'base64'), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  export function decrypt(encrypted: string): string {
    const [ivHex, authTagHex, encryptedText] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY!, 'base64'), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
  ```

- [ ] 1.2. Обновить схему БД (миграция)
  ```sql
  -- Добавить новые зашифрованные поля
  ALTER TABLE settings
    ADD COLUMN anthropic_api_key_encrypted TEXT,
    ADD COLUMN openai_api_key_encrypted TEXT;

  -- Мигрировать существующие ключи (в миграционном скрипте)
  -- UPDATE settings SET anthropic_api_key_encrypted = encrypt(anthropic_api_key);

  -- Удалить старые поля (после проверки)
  -- ALTER TABLE settings DROP COLUMN anthropic_api_key, DROP COLUMN openai_api_key;
  ```

- [ ] 1.3. Обновить `storage.ts` для авто-шифрования
  ```typescript
  // server/storage.ts
  async saveAnthropicKey(userId: number, apiKey: string) {
    const encrypted = encrypt(apiKey);
    await db.update(settings)
      .set({ anthropicApiKeyEncrypted: encrypted })
      .where(eq(settings.userId, userId));
  }

  async getAnthropicKey(userId: number): Promise<string | null> {
    const setting = await db.select().from(settings)
      .where(eq(settings.userId, userId))
      .limit(1);

    if (!setting[0]?.anthropicApiKeyEncrypted) return null;
    return decrypt(setting[0].anthropicApiKeyEncrypted);
  }
  ```

- [ ] 1.4. Обновить все места использования (AI сервисы, OCR, etc)

**Результат**: API ключи защищены шифрованием AES-256-GCM

---

### 2. Сессии в PostgreSQL
**Проблема**: MemoryStore теряет сессии при перезапуске
**Риск**: Все пользователи разлогиниваются при каждом деплое

**Задачи**:
- [ ] 2.1. Создать таблицу для сессий
  ```sql
  CREATE TABLE "session" (
    "sid" varchar NOT NULL COLLATE "default",
    "sess" json NOT NULL,
    "expire" timestamp(6) NOT NULL
  ) WITH (OIDS=FALSE);

  ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
  CREATE INDEX "IDX_session_expire" ON "session" ("expire");
  ```

- [ ] 2.2. Обновить `server/auth.ts`
  ```typescript
  import connectPgSimple from 'connect-pg-simple';
  import { pool } from './db';

  const PgStore = connectPgSimple(session);

  export function setupAuth(app: Express) {
    const sessionSettings: session.SessionOptions = {
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      store: new PgStore({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 15 // Очистка каждые 15 минут
      }),
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
        httpOnly: true,
        sameSite: 'lax'
      },
    };

    // ... rest
  }
  ```

- [ ] 2.3. Протестировать persistency
  - Залогиниться
  - Перезапустить сервер
  - Проверить что сессия жива

**Результат**: Сессии переживают рестарты сервера

---

### 3. Убрать fallback секрет и валидация env
**Проблема**: Слабый дефолтный секрет, отсутствие валидации env переменных
**Риск**: Деплой с невалидной конфигурацией

**Задачи**:
- [ ] 3.1. Создать схему валидации env
  ```typescript
  // server/lib/env.ts
  import { z } from 'zod';

  const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('5000'),
    DATABASE_URL: z.string().url(),
    SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
    ENCRYPTION_KEY: z.string().length(44, 'Encryption key must be 32 bytes in base64 (44 chars)'),

    // Optional
    TELEGRAM_BOT_TOKEN: z.string().optional(),

    // Frontend URLs
    FRONTEND_URL: z.string().url().optional(),
  });

  export const env = envSchema.parse(process.env);
  ```

- [ ] 3.2. Использовать в `server/index.ts`
  ```typescript
  import { env } from './lib/env';

  // Валидация происходит при импорте - упадёт если невалидно
  const port = parseInt(env.PORT, 10);
  ```

- [ ] 3.3. Обновить `.env.example`
  ```bash
  # Required
  DATABASE_URL=postgresql://user:pass@localhost:5432/budgetbot
  SESSION_SECRET=<generate-with-openssl-rand-base64-32>
  ENCRYPTION_KEY=<generate-with-openssl-rand-base64-32>

  # Optional
  TELEGRAM_BOT_TOKEN=your_bot_token
  FRONTEND_URL=http://localhost:5000
  ```

- [ ] 3.4. Добавить в README генерацию секретов
  ```bash
  # Generate secrets
  openssl rand -base64 32  # SESSION_SECRET
  openssl rand -base64 32  # ENCRYPTION_KEY
  ```

**Результат**: Невозможно запустить с невалидной конфигурацией

---

### 4. Фикс error handler
**Проблема**: `throw err` после отправки ответа крашит процесс
**Риск**: Unhandled rejection → падение сервера

**Задачи**:
- [ ] 4.1. Убрать опасный throw
  ```typescript
  // server/index.ts
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Express error handler:', {
      status,
      message,
      stack: err.stack,
      url: _req.url,
      method: _req.method
    });

    res.status(status).json({ message });
    // Убрали throw err!
  });
  ```

- [ ] 4.2. Добавить global error handlers
  ```typescript
  // server/index.ts
  process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION:', error);
    // В продакшене можно gracefully shutdown
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
  });
  ```

**Результат**: Сервер не падает от ошибок

---

### 5. Rate Limiting для API
**Проблема**: Нет защиты от bruteforce и DDoS
**Риск**: Утечка аккаунтов, перерасход API квот

**Задачи**:
- [ ] 5.1. Установить зависимости
  ```bash
  npm install express-rate-limit express-slow-down
  ```

- [ ] 5.2. Создать rate limiters
  ```typescript
  // server/middleware/rate-limit.ts
  import rateLimit from 'express-rate-limit';
  import slowDown from 'express-slow-down';

  // Строгий лимит для аутентификации
  export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 5, // 5 попыток
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Средний лимит для AI запросов
  export const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 минута
    max: 10, // 10 запросов в минуту
    message: 'Too many AI requests, please slow down',
  });

  // Slowdown для общих API
  export const apiSlowDown = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: 500,
  });

  // Лимит для регистрации (по IP)
  export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 час
    max: 3, // 3 регистрации с одного IP
    message: 'Too many accounts created, please try again later',
  });
  ```

- [ ] 5.3. Применить в routes
  ```typescript
  // server/auth.ts
  import { authLimiter, registerLimiter } from './middleware/rate-limit';

  app.post("/api/login", authLimiter, (req, res, next) => {
    // ...
  });

  app.post("/api/register", registerLimiter, async (req, res, next) => {
    // ...
  });
  ```

  ```typescript
  // server/routes/ai/chat.routes.ts
  import { aiLimiter } from '../../middleware/rate-limit';

  router.post("/chat", aiLimiter, async (req, res) => {
    // ...
  });
  ```

- [ ] 5.4. Добавить Redis store (опционально, для multi-instance)
  ```typescript
  import RedisStore from 'rate-limit-redis';
  import Redis from 'ioredis';

  const redis = new Redis(process.env.REDIS_URL);

  export const authLimiter = rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rl:auth:',
    }),
    // ...
  });
  ```

**Результат**: API защищён от злоупотреблений

---

## P1 - Важная инфраструктура
**Сроки**: 2-3 недели | **Приоритет**: 🟠 ВЫСОКИЙ

### 6. Structured Logging
**Проблема**: console.log не подходит для продакшена
**Цель**: Централизованные, структурированные логи

**Задачи**:
- [ ] 6.1. Установить Pino
  ```bash
  npm install pino pino-http pino-pretty
  ```

- [ ] 6.2. Настроить logger
  ```typescript
  // server/lib/logger.ts
  import pino from 'pino';

  export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,

    formatters: {
      level: (label) => ({ level: label }),
    },

    timestamp: pino.stdTimeFunctions.isoTime,

    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
  });

  // Child loggers для модулей
  export const telegramLogger = logger.child({ module: 'telegram' });
  export const aiLogger = logger.child({ module: 'ai' });
  export const dbLogger = logger.child({ module: 'database' });
  ```

- [ ] 6.3. HTTP logging middleware
  ```typescript
  // server/index.ts
  import pinoHttp from 'pino-http';
  import { logger } from './lib/logger';

  app.use(pinoHttp({ logger }));
  ```

- [ ] 6.4. Заменить все console.log
  ```typescript
  // Было:
  console.log('User logged in:', userId);

  // Стало:
  logger.info({ userId }, 'User logged in');

  // Ошибки:
  logger.error({ err, userId }, 'Failed to process transaction');
  ```

- [ ] 6.5. Добавить контекст в логи
  ```typescript
  // server/telegram/bot.ts
  import { telegramLogger as logger } from '../lib/logger';

  bot.on('message', async (msg) => {
    const log = logger.child({ telegramId: msg.from?.id, chatId: msg.chat.id });

    log.info({ command: msg.text }, 'Received message');

    try {
      // ... handle
      log.info('Message processed successfully');
    } catch (err) {
      log.error({ err }, 'Failed to process message');
    }
  });
  ```

**Результат**: Профессиональное логирование с контекстом

---

### 7. Telegram Webhooks вместо Polling
**Проблема**: Polling медленный, нагружает сервер
**Цель**: Мгновенные уведомления, меньше нагрузки

**Задачи**:
- [ ] 7.1. Добавить webhook endpoint
  ```typescript
  // server/telegram/webhook.ts
  import type { Update } from 'node-telegram-bot-api';
  import { handleUpdate } from './update-handler';

  export function setupWebhook(app: Express, bot: TelegramBot) {
    const webhookPath = '/api/telegram/webhook';
    const webhookUrl = `${process.env.FRONTEND_URL}${webhookPath}`;

    app.post(webhookPath, async (req, res) => {
      try {
        const update: Update = req.body;
        await handleUpdate(bot, update);
        res.sendStatus(200);
      } catch (err) {
        logger.error({ err }, 'Webhook processing error');
        res.sendStatus(500);
      }
    });

    // Установить webhook
    bot.setWebHook(webhookUrl).then(() => {
      logger.info({ webhookUrl }, 'Telegram webhook set');
    });
  }
  ```

- [ ] 7.2. Извлечь логику обработки
  ```typescript
  // server/telegram/update-handler.ts
  export async function handleUpdate(bot: TelegramBot, update: Update) {
    if (update.message) {
      await handleMessage(bot, update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(bot, update.callback_query);
    }
    // ... другие типы
  }
  ```

- [ ] 7.3. Условное включение (dev = polling, prod = webhook)
  ```typescript
  // server/telegram/bot.ts
  export function initTelegramBot(app?: Express) {
    const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, {
      polling: process.env.NODE_ENV === 'development'
    });

    if (process.env.NODE_ENV === 'production' && app) {
      setupWebhook(app, bot);
    }

    return bot;
  }
  ```

- [ ] 7.4. Добавить секретный токен (рекомендация Telegram)
  ```typescript
  const SECRET_TOKEN = process.env.TELEGRAM_WEBHOOK_SECRET;

  app.post(webhookPath, (req, res, next) => {
    if (req.headers['x-telegram-bot-api-secret-token'] !== SECRET_TOKEN) {
      return res.sendStatus(403);
    }
    next();
  });
  ```

**Результат**: Быстрые обновления, меньше нагрузки

---

### 8. Error Boundaries для React
**Проблема**: Ошибка в компоненте роняет весь UI
**Цель**: Graceful degradation

**Задачи**:
- [ ] 8.1. Создать ErrorBoundary компонент
  ```typescript
  // client/src/components/error-boundary.tsx
  import { Component, ReactNode } from 'react';
  import { AlertCircle } from 'lucide-react';
  import { Button } from '@/components/ui/button';

  interface Props {
    children: ReactNode;
    fallback?: ReactNode;
  }

  interface State {
    hasError: boolean;
    error?: Error;
  }

  export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
      console.error('ErrorBoundary caught:', error, errorInfo);

      // Отправить в Sentry (если настроен)
      if (window.Sentry) {
        window.Sentry.captureException(error, { extra: errorInfo });
      }
    }

    render() {
      if (this.state.hasError) {
        if (this.props.fallback) {
          return this.props.fallback;
        }

        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
            <AlertCircle className="w-16 h-16 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </div>
        );
      }

      return this.props.children;
    }
  }
  ```

- [ ] 8.2. Обернуть роуты
  ```typescript
  // client/src/App.tsx
  import { ErrorBoundary } from '@/components/error-boundary';

  function Router() {
    return (
      <Switch>
        <Route path="/" component={LandingPageWrapper} />
        <Route path="/login" component={AuthPage} />

        {/* Обернуть защищённые роуты */}
        <ErrorBoundary>
          <ProtectedRoute path="/app/dashboard" component={DashboardPage} />
          <ProtectedRoute path="/app/transactions" component={TransactionsPage} />
          {/* ... */}
        </ErrorBoundary>
      </Switch>
    );
  }
  ```

- [ ] 8.3. Специализированные boundaries
  ```typescript
  // client/src/components/chart-error-boundary.tsx
  export function ChartErrorBoundary({ children }: { children: ReactNode }) {
    return (
      <ErrorBoundary
        fallback={
          <div className="p-4 border rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">
              Failed to load chart. Please try refreshing.
            </p>
          </div>
        }
      >
        {children}
      </ErrorBoundary>
    );
  }
  ```

**Результат**: UI не падает целиком при ошибках

---

### 9. Environment Validation на клиенте
**Проблема**: Frontend может запуститься с невалидной конфигурацией
**Цель**: Ранняя валидация

**Задачи**:
- [ ] 9.1. Создать схему
  ```typescript
  // client/src/lib/env.ts
  import { z } from 'zod';

  const envSchema = z.object({
    MODE: z.enum(['development', 'production']),
    // Vite автоматически добавляет VITE_ префикс
    VITE_API_URL: z.string().url().optional(),
  });

  export const env = envSchema.parse(import.meta.env);
  ```

- [ ] 9.2. Использовать в коде
  ```typescript
  // client/src/lib/queryClient.ts
  import { env } from './env';

  const API_URL = env.VITE_API_URL || '';
  ```

**Результат**: Валидация конфигурации на клиенте

---

### 10. Мониторинг ошибок (Sentry)
**Проблема**: Не видим ошибки в продакшене
**Цель**: Автоматические алерты при ошибках

**Задачи**:
- [ ] 10.1. Установить Sentry
  ```bash
  npm install @sentry/node @sentry/react
  ```

- [ ] 10.2. Настроить на сервере
  ```typescript
  // server/lib/sentry.ts
  import * as Sentry from '@sentry/node';
  import { env } from './env';

  export function initSentry() {
    if (env.SENTRY_DSN) {
      Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.NODE_ENV,
        tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,

        beforeSend(event, hint) {
          // Фильтровать чувствительные данные
          if (event.request?.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
          }
          return event;
        },
      });
    }
  }
  ```

- [ ] 10.3. Подключить middleware
  ```typescript
  // server/index.ts
  import * as Sentry from '@sentry/node';
  import { initSentry } from './lib/sentry';

  initSentry();

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  // ... routes

  app.use(Sentry.Handlers.errorHandler());
  ```

- [ ] 10.4. Настроить на клиенте
  ```typescript
  // client/src/lib/sentry.ts
  import * as Sentry from '@sentry/react';

  export function initSentry() {
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        integrations: [
          new Sentry.BrowserTracing(),
          new Sentry.Replay(),
        ],
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      });
    }
  }
  ```

- [ ] 10.5. Интегрировать с ErrorBoundary
  ```typescript
  componentDidCatch(error: Error, errorInfo: any) {
    Sentry.captureException(error, { extra: errorInfo });
  }
  ```

**Результат**: Автоматический мониторинг ошибок

---

## P2 - Производительность и масштабирование
**Сроки**: 3-4 недели | **Приоритет**: 🟡 СРЕДНИЙ

### 11. Docker + Docker Compose
**Проблема**: Нет изоляции, тяжело деплоить
**Цель**: Контейнеризация

**Задачи**:
- [ ] 11.1. Создать Dockerfile
  ```dockerfile
  # Dockerfile
  FROM node:20-alpine AS builder

  WORKDIR /app

  # Копировать package files
  COPY package*.json ./
  COPY tsconfig.json ./
  COPY vite.config.ts ./
  COPY tailwind.config.ts ./
  COPY postcss.config.js ./

  # Установить зависимости
  RUN npm ci

  # Копировать исходники
  COPY client ./client
  COPY server ./server
  COPY shared ./shared

  # Билд
  RUN npm run build

  # Production image
  FROM node:20-alpine AS runner

  WORKDIR /app

  # Только prod зависимости
  COPY package*.json ./
  RUN npm ci --production

  # Скопировать билд
  COPY --from=builder /app/dist ./dist

  # Создать non-root пользователя
  RUN addgroup -g 1001 -S nodejs
  RUN adduser -S nodejs -u 1001
  USER nodejs

  EXPOSE 5000

  CMD ["node", "dist/index.js"]
  ```

- [ ] 11.2. Docker Compose для разработки
  ```yaml
  # docker-compose.yml
  version: '3.8'

  services:
    postgres:
      image: postgres:16-alpine
      environment:
        POSTGRES_DB: budgetbot
        POSTGRES_USER: budgetbot
        POSTGRES_PASSWORD: budgetbot_dev_pass
      ports:
        - "5432:5432"
      volumes:
        - postgres_data:/var/lib/postgresql/data
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U budgetbot"]
        interval: 10s
        timeout: 5s
        retries: 5

    redis:
      image: redis:7-alpine
      ports:
        - "6379:6379"
      volumes:
        - redis_data:/data
      healthcheck:
        test: ["CMD", "redis-cli", "ping"]
        interval: 10s
        timeout: 3s
        retries: 5

    app:
      build: .
      ports:
        - "5000:5000"
      environment:
        DATABASE_URL: postgresql://budgetbot:budgetbot_dev_pass@postgres:5432/budgetbot
        REDIS_URL: redis://redis:6379
        SESSION_SECRET: dev_secret_change_in_prod
        ENCRYPTION_KEY: dev_encryption_key_base64
        NODE_ENV: development
      depends_on:
        postgres:
          condition: service_healthy
        redis:
          condition: service_healthy
      volumes:
        - ./server:/app/server
        - ./client:/app/client
        - ./shared:/app/shared
      command: npm run dev

  volumes:
    postgres_data:
    redis_data:
  ```

- [ ] 11.3. .dockerignore
  ```
  node_modules
  dist
  .git
  .env
  *.log
  .DS_Store
  ```

- [ ] 11.4. Development vs Production compose
  ```yaml
  # docker-compose.prod.yml
  version: '3.8'

  services:
    app:
      image: budgetbot:latest
      restart: unless-stopped
      environment:
        NODE_ENV: production
        DATABASE_URL: ${DATABASE_URL}
        SESSION_SECRET: ${SESSION_SECRET}
        ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      ports:
        - "5000:5000"
      healthcheck:
        test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5000/api/health"]
        interval: 30s
        timeout: 10s
        retries: 3
        start_period: 40s
  ```

**Результат**: Контейнеризованное приложение

---

### 12. Lazy Loading для React Routes
**Проблема**: Все страницы грузятся сразу → медленная загрузка
**Цель**: Code splitting

**Задачи**:
- [ ] 12.1. Конвертировать в lazy imports
  ```typescript
  // client/src/App.tsx
  import { lazy, Suspense } from 'react';

  // Eager (всегда нужны)
  import LandingPage from '@/pages/landing-page';
  import AuthPage from '@/pages/auth-page';

  // Lazy (загружаются по требованию)
  const DashboardPage = lazy(() => import('@/pages/dashboard-page'));
  const TransactionsPage = lazy(() => import('@/pages/transactions-page'));
  const WalletsPage = lazy(() => import('@/pages/wallets-page'));
  const CategoriesPage = lazy(() => import('@/pages/categories-page'));
  const RecurringPage = lazy(() => import('@/pages/recurring-page'));
  const WishlistPage = lazy(() => import('@/pages/wishlist-page'));
  const PlannedExpensesPage = lazy(() => import('@/pages/planned-expenses-page'));
  const PlannedIncomePage = lazy(() => import('@/pages/planned-income-page'));
  const BudgetsPage = lazy(() => import('@/pages/budgets-page'));
  const AIAnalysisPage = lazy(() => import('@/pages/ai-analysis-page'));
  const SettingsPage = lazy(() => import('@/pages/settings-page'));
  const TagsSettingsPage = lazy(() => import('@/pages/tags-settings-page'));
  const TagDetailPage = lazy(() => import('@/pages/tag-detail-page'));
  const ExpensesAnalyticsPage = lazy(() => import('@/pages/expenses-analytics-page'));
  const SwipeSortPage = lazy(() => import('@/pages/swipe-sort-page'));
  const AiTrainingHistoryPage = lazy(() => import('@/pages/ai-training-history-page'));
  const ProductCatalogPage = lazy(() => import('@/pages/product-catalog-page'));
  const ProductDetailPage = lazy(() => import('@/pages/product-detail-page'));
  const AssetsPage = lazy(() => import('@/pages/assets'));
  const AssetDetailPage = lazy(() => import('@/pages/asset-detail'));
  ```

- [ ] 12.2. Обернуть в Suspense
  ```typescript
  // client/src/components/route-loader.tsx
  import { Suspense, ReactNode } from 'react';
  import { Loader2 } from 'lucide-react';

  function RouteLoading() {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  export function RouteLoader({ children }: { children: ReactNode }) {
    return (
      <Suspense fallback={<RouteLoading />}>
        {children}
      </Suspense>
    );
  }
  ```

- [ ] 12.3. Использовать в Router
  ```typescript
  function Router() {
    return (
      <Switch>
        <Route path="/" component={LandingPageWrapper} />
        <Route path="/login" component={AuthPage} />

        <RouteLoader>
          <ProtectedRoute path="/app/dashboard" component={DashboardPage} />
          <ProtectedRoute path="/app/transactions" component={TransactionsPage} />
          {/* ... остальные */}
        </RouteLoader>
      </Switch>
    );
  }
  ```

- [ ] 12.4. Измерить улучшение
  ```bash
  # До
  npm run build
  # Посмотреть размер бандлов

  # После
  npm run build
  # Должно быть несколько чанков вместо одного большого
  ```

**Результат**: Быстрая загрузка, меньший initial bundle

---

### 13. Redis кеширование
**Проблема**: Частые запросы к БД для одних и тех же данных
**Цель**: Снизить нагрузку на БД

**Задачи**:
- [ ] 13.1. Установить Redis
  ```bash
  npm install ioredis
  ```

- [ ] 13.2. Создать cache service
  ```typescript
  // server/lib/cache.ts
  import Redis from 'ioredis';
  import { logger } from './logger';

  const redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL)
    : null;

  export const cache = {
    async get<T>(key: string): Promise<T | null> {
      if (!redis) return null;

      try {
        const value = await redis.get(key);
        return value ? JSON.parse(value) : null;
      } catch (err) {
        logger.error({ err, key }, 'Cache get error');
        return null;
      }
    },

    async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
      if (!redis) return;

      try {
        await redis.setex(key, ttlSeconds, JSON.stringify(value));
      } catch (err) {
        logger.error({ err, key }, 'Cache set error');
      }
    },

    async del(key: string): Promise<void> {
      if (!redis) return;

      try {
        await redis.del(key);
      } catch (err) {
        logger.error({ err, key }, 'Cache delete error');
      }
    },

    async invalidatePattern(pattern: string): Promise<void> {
      if (!redis) return;

      try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (err) {
        logger.error({ err, pattern }, 'Cache invalidate error');
      }
    }
  };
  ```

- [ ] 13.3. Кешировать часто используемые данные
  ```typescript
  // server/services/currency-service.ts
  import { cache } from '../lib/cache';

  export async function getExchangeRates(userId: number) {
    const cacheKey = `exchange-rates:${userId}`;

    // Попытка из кеша
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Запрос из БД
    const settings = await storage.getSettingsByUserId(userId);
    const rates = {
      RUB: settings?.exchangeRateRUB,
      IDR: settings?.exchangeRateIDR,
      KRW: settings?.exchangeRateKRW,
      EUR: settings?.exchangeRateEUR,
      CNY: settings?.exchangeRateCNY,
    };

    // Сохранить в кеш на 5 минут
    await cache.set(cacheKey, rates, 300);

    return rates;
  }
  ```

- [ ] 13.4. Инвалидация кеша
  ```typescript
  // server/routes/settings.routes.ts
  router.put("/exchange-rates", async (req, res) => {
    const userId = req.user.id;

    // Обновить БД
    await storage.updateExchangeRates(userId, req.body);

    // Инвалидировать кеш
    await cache.del(`exchange-rates:${userId}`);
    await cache.invalidatePattern(`transactions:${userId}:*`);

    res.json({ success: true });
  });
  ```

- [ ] 13.5. Кешировать категории, теги
  ```typescript
  export async function getUserCategories(userId: number) {
    const cacheKey = `categories:${userId}`;

    const cached = await cache.get<Category[]>(cacheKey);
    if (cached) return cached;

    const categories = await storage.getCategoriesByUserId(userId);
    await cache.set(cacheKey, categories, 600); // 10 минут

    return categories;
  }
  ```

**Результат**: Снижение нагрузки на БД на 40-60%

---

### 14. Оптимизация UI bundle
**Проблема**: 48 UI компонентов → большой bundle
**Цель**: Уменьшить размер

**Задачи**:
- [ ] 14.1. Анализировать bundle
  ```bash
  npm install -D rollup-plugin-visualizer
  ```

  ```typescript
  // vite.config.ts
  import { visualizer } from 'rollup-plugin-visualizer';

  export default defineConfig({
    plugins: [
      react(),
      visualizer({ open: true, gzipSize: true })
    ]
  });
  ```

- [ ] 14.2. Найти неиспользуемые компоненты
  ```bash
  # Проверить импорты всех UI компонентов
  for file in client/src/components/ui/*.tsx; do
    name=$(basename "$file" .tsx)
    grep -r "from.*ui/$name" client/src --exclude-dir=ui || echo "❌ Unused: $name"
  done
  ```

- [ ] 14.3. Удалить неиспользуемые
  ```bash
  # Пример - удалить если не используются
  rm client/src/components/ui/menubar.tsx
  rm client/src/components/ui/hover-card.tsx
  rm client/src/components/ui/input-otp.tsx
  # ... и т.д.
  ```

- [ ] 14.4. Tree-shaking для lucide-react
  ```typescript
  // Было (импортирует всю библиотеку):
  import * as Icons from 'lucide-react';

  // Стало (импортирует только нужные):
  import { User, Settings, LogOut } from 'lucide-react';
  ```

- [ ] 14.5. Измерить результат
  ```bash
  npm run build
  # Сравнить размер dist/assets/*.js
  ```

**Результат**: Уменьшение bundle на 20-30%

---

### 15. N+1 оптимизация запросов
**Проблема**: Множественные запросы к БД
**Цель**: Использовать JOIN'ы

**Задачи**:
- [ ] 15.1. Найти N+1 проблемы
  ```typescript
  // ❌ Плохо - N+1
  const transactions = await storage.getTransactions(userId);
  for (const tx of transactions) {
    tx.category = await storage.getCategoryById(tx.categoryId);
    tx.wallet = await storage.getWalletById(tx.walletId);
  }

  // ✅ Хорошо - JOIN
  const transactions = await db
    .select({
      id: transactionsTable.id,
      amount: transactionsTable.amount,
      description: transactionsTable.description,
      category: {
        id: categories.id,
        name: categories.name,
        icon: categories.icon,
      },
      wallet: {
        id: wallets.id,
        name: wallets.name,
      }
    })
    .from(transactionsTable)
    .leftJoin(categories, eq(transactionsTable.categoryId, categories.id))
    .leftJoin(wallets, eq(transactionsTable.walletId, wallets.id))
    .where(eq(transactionsTable.userId, userId));
  ```

- [ ] 15.2. Обновить storage methods
  ```typescript
  // server/storage.ts
  export async function getTransactionsWithRelations(userId: number) {
    return db
      .select({
        transaction: transactions,
        category: categories,
        wallet: wallets,
        personalTag: personalTags,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(wallets, eq(transactions.walletId, wallets.id))
      .leftJoin(personalTags, eq(transactions.personalTagId, personalTags.id))
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date));
  }
  ```

- [ ] 15.3. Использовать в routes
  ```typescript
  // server/routes/transactions.routes.ts
  router.get("/", async (req, res) => {
    const userId = req.user.id;

    // Вместо отдельных запросов
    const data = await storage.getTransactionsWithRelations(userId);

    res.json(data);
  });
  ```

- [ ] 15.4. Добавить EXPLAIN ANALYZE
  ```typescript
  // Для отладки медленных запросов
  const result = await db.execute(sql`
    EXPLAIN ANALYZE
    SELECT * FROM transactions
    WHERE user_id = ${userId}
  `);

  console.log(result);
  ```

**Результат**: Снижение количества запросов в 5-10 раз

---

## P3 - Качество кода и UX
**Сроки**: 2-3 недели | **Приоритет**: 🟢 НОРМАЛЬНЫЙ

### 16. CI/CD Pipeline
**Проблема**: Ручной деплой, нет автотестов
**Цель**: Автоматизация

**Задачи**:
- [ ] 16.1. GitHub Actions для CI
  ```yaml
  # .github/workflows/ci.yml
  name: CI

  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main, develop]

  jobs:
    test:
      runs-on: ubuntu-latest

      services:
        postgres:
          image: postgres:16
          env:
            POSTGRES_DB: budgetbot_test
            POSTGRES_USER: test
            POSTGRES_PASSWORD: test
          options: >-
            --health-cmd pg_isready
            --health-interval 10s
            --health-timeout 5s
            --health-retries 5
          ports:
            - 5432:5432

      steps:
        - uses: actions/checkout@v4

        - name: Setup Node
          uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'

        - name: Install dependencies
          run: npm ci

        - name: Type check
          run: npm run check

        - name: Lint
          run: npm run lint

        - name: Test
          run: npm run test
          env:
            DATABASE_URL: postgresql://test:test@localhost:5432/budgetbot_test

        - name: Build
          run: npm run build

    build-docker:
      runs-on: ubuntu-latest
      needs: test

      steps:
        - uses: actions/checkout@v4

        - name: Build Docker image
          run: docker build -t budgetbot:${{ github.sha }} .

        - name: Test Docker image
          run: |
            docker run -d -p 5000:5000 \
              -e DATABASE_URL=postgresql://test:test@postgres:5432/test \
              -e SESSION_SECRET=test \
              -e ENCRYPTION_KEY=test \
              budgetbot:${{ github.sha }}
            sleep 5
            curl http://localhost:5000/api/health || exit 1
  ```

- [ ] 16.2. Deploy workflow
  ```yaml
  # .github/workflows/deploy.yml
  name: Deploy

  on:
    push:
      branches: [main]

  jobs:
    deploy:
      runs-on: ubuntu-latest

      steps:
        - uses: actions/checkout@v4

        - name: Deploy to production
          run: |
            # SSH deploy, Docker push, или другой метод
            echo "Deploy to your hosting"
  ```

- [ ] 16.3. Добавить линтер
  ```bash
  npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
  ```

  ```javascript
  // .eslintrc.cjs
  module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    }
  };
  ```

  ```json
  // package.json
  {
    "scripts": {
      "lint": "eslint server client --ext .ts,.tsx",
      "lint:fix": "eslint server client --ext .ts,.tsx --fix"
    }
  }
  ```

**Результат**: Автоматическое тестирование и деплой

---

### 17. Unit тесты
**Проблема**: Нет тестов → высокий риск регрессий
**Цель**: Покрытие критичной логики

**Задачи**:
- [ ] 17.1. Установить Vitest
  ```bash
  npm install -D vitest @vitest/ui
  ```

  ```typescript
  // vitest.config.ts
  import { defineConfig } from 'vitest/config';

  export default defineConfig({
    test: {
      globals: true,
      environment: 'node',
      setupFiles: ['./server/test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        exclude: ['node_modules/', 'dist/'],
      },
    },
  });
  ```

- [ ] 17.2. Тесты для сервисов
  ```typescript
  // server/services/__tests__/categorization.service.test.ts
  import { describe, it, expect, beforeEach } from 'vitest';
  import { suggestCategory, trainCategory } from '../categorization.service';

  describe('categorization.service', () => {
    const userId = 1;

    beforeEach(async () => {
      // Очистить тестовую БД
    });

    it('should suggest category after training', async () => {
      await trainCategory(userId, 'Starbucks', 'Food & Drinks');

      const suggestion = await suggestCategory(userId, 'Starbucks');

      expect(suggestion).toMatchObject({
        categoryName: 'Food & Drinks',
        confidence: expect.any(Number),
      });
    });

    it('should return null for unknown merchant', async () => {
      const suggestion = await suggestCategory(userId, 'Unknown Store');
      expect(suggestion).toBeNull();
    });

    it('should increase confidence with more training', async () => {
      await trainCategory(userId, 'McDonalds', 'Food & Drinks');
      const first = await suggestCategory(userId, 'McDonalds');

      await trainCategory(userId, 'McDonalds', 'Food & Drinks');
      await trainCategory(userId, 'McDonalds', 'Food & Drinks');
      const after = await suggestCategory(userId, 'McDonalds');

      expect(after!.confidence).toBeGreaterThan(first!.confidence);
    });
  });
  ```

- [ ] 17.3. Тесты для утилит
  ```typescript
  // server/lib/__tests__/encryption.test.ts
  import { describe, it, expect } from 'vitest';
  import { encrypt, decrypt } from '../encryption';

  describe('encryption', () => {
    it('should encrypt and decrypt correctly', () => {
      const original = 'sk-ant-api-key-12345';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);

      expect(encrypted).not.toBe(original);
      expect(decrypted).toBe(original);
    });

    it('should produce different ciphertext for same input', () => {
      const text = 'test';
      const encrypted1 = encrypt(text);
      const encrypted2 = encrypt(text);

      expect(encrypted1).not.toBe(encrypted2);
      expect(decrypt(encrypted1)).toBe(text);
      expect(decrypt(encrypted2)).toBe(text);
    });
  });
  ```

- [ ] 17.4. Integration тесты
  ```typescript
  // server/routes/__tests__/transactions.routes.test.ts
  import { describe, it, expect } from 'vitest';
  import request from 'supertest';
  import { app } from '../../index';

  describe('POST /api/transactions', () => {
    it('should create transaction', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send({
          amount: 100,
          description: 'Test',
          type: 'expense',
          date: '2025-01-01',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        amount: '100.00',
        description: 'Test',
      });
    });

    it('should reject invalid amount', async () => {
      await request(app)
        .post('/api/transactions')
        .send({
          amount: -100,
          description: 'Test',
          type: 'expense',
        })
        .expect(400);
    });
  });
  ```

- [ ] 17.5. Добавить в package.json
  ```json
  {
    "scripts": {
      "test": "vitest run",
      "test:watch": "vitest",
      "test:ui": "vitest --ui",
      "test:coverage": "vitest run --coverage"
    }
  }
  ```

**Результат**: Тестовое покрытие критичных частей

---

### 18. API Documentation
**Проблема**: Нет документации API
**Цель**: OpenAPI спецификация

**Задачи**:
- [ ] 18.1. Установить Swagger
  ```bash
  npm install swagger-jsdoc swagger-ui-express
  npm install -D @types/swagger-jsdoc @types/swagger-ui-express
  ```

- [ ] 18.2. Настроить Swagger
  ```typescript
  // server/lib/swagger.ts
  import swaggerJsdoc from 'swagger-jsdoc';
  import swaggerUi from 'swagger-ui-express';
  import type { Express } from 'express';

  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'BudgetBot API',
        version: '1.0.0',
        description: 'Personal finance management API',
      },
      servers: [
        {
          url: 'http://localhost:5000',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'connect.sid',
          },
        },
      },
      security: [{ cookieAuth: [] }],
    },
    apis: ['./server/routes/**/*.ts'],
  };

  const specs = swaggerJsdoc(options);

  export function setupSwagger(app: Express) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  }
  ```

- [ ] 18.3. Документировать эндпоинты
  ```typescript
  // server/routes/transactions.routes.ts
  /**
   * @swagger
   * /api/transactions:
   *   get:
   *     summary: Get all transactions
   *     tags: [Transactions]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter by start date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter by end date
   *     responses:
   *       200:
   *         description: List of transactions
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Transaction'
   *       401:
   *         description: Unauthorized
   */
  router.get("/", async (req, res) => {
    // ...
  });

  /**
   * @swagger
   * components:
   *   schemas:
   *     Transaction:
   *       type: object
   *       properties:
   *         id:
   *           type: integer
   *         amount:
   *           type: string
   *         description:
   *           type: string
   *         date:
   *           type: string
   *           format: date
   *         type:
   *           type: string
   *           enum: [income, expense]
   */
  ```

- [ ] 18.4. Добавить в index.ts
  ```typescript
  // server/index.ts
  import { setupSwagger } from './lib/swagger';

  if (app.get("env") === "development") {
    setupSwagger(app);
  }
  ```

**Результат**: Интерактивная документация на `/api-docs`

---

### 19. Health Check endpoint
**Проблема**: Нет способа проверить статус сервиса
**Цель**: Healthcheck для мониторинга

**Задачи**:
- [ ] 19.1. Создать health endpoint
  ```typescript
  // server/routes/health.routes.ts
  import { Router } from 'express';
  import { pool } from '../db';

  const router = Router();

  router.get("/health", async (req, res) => {
    const health = {
      uptime: process.uptime(),
      timestamp: Date.now(),
      status: 'ok',
      checks: {
        database: 'unknown',
        redis: 'unknown',
      }
    };

    // Проверка БД
    try {
      await pool.query('SELECT 1');
      health.checks.database = 'healthy';
    } catch (err) {
      health.checks.database = 'unhealthy';
      health.status = 'degraded';
    }

    // Проверка Redis (если есть)
    if (process.env.REDIS_URL) {
      try {
        const redis = await import('ioredis');
        const client = new redis.default(process.env.REDIS_URL);
        await client.ping();
        await client.quit();
        health.checks.redis = 'healthy';
      } catch (err) {
        health.checks.redis = 'unhealthy';
        health.status = 'degraded';
      }
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  });

  router.get("/health/ready", async (req, res) => {
    // Readiness check - готов ли принимать трафик
    try {
      await pool.query('SELECT 1');
      res.status(200).json({ status: 'ready' });
    } catch (err) {
      res.status(503).json({ status: 'not ready' });
    }
  });

  router.get("/health/live", (req, res) => {
    // Liveness check - жив ли процесс
    res.status(200).json({ status: 'alive' });
  });

  export default router;
  ```

- [ ] 19.2. Подключить в index
  ```typescript
  // server/routes/index.ts
  import healthRoutes from './health.routes';

  export function registerRoutes(app: Express) {
    app.use('/api', healthRoutes);
    // ... остальные
  }
  ```

- [ ] 19.3. Использовать в Docker healthcheck
  ```dockerfile
  HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5000/api/health/live || exit 1
  ```

**Результат**: Мониторинг доступности сервиса

---

### 20. Improved Error Messages
**Проблема**: Пользователь видит технические ошибки
**Цель**: User-friendly сообщения

**Задачи**:
- [ ] 20.1. Создать error classes
  ```typescript
  // server/lib/errors.ts
  export class AppError extends Error {
    constructor(
      public statusCode: number,
      public message: string,
      public userMessage?: string,
      public isOperational = true
    ) {
      super(message);
      Object.setPrototypeOf(this, AppError.prototype);
    }
  }

  export class ValidationError extends AppError {
    constructor(message: string, userMessage?: string) {
      super(400, message, userMessage);
    }
  }

  export class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
      super(401, message, 'Please log in to continue');
    }
  }

  export class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
      super(403, message, 'You do not have permission to perform this action');
    }
  }

  export class NotFoundError extends AppError {
    constructor(resource: string) {
      super(404, `${resource} not found`, `The requested ${resource.toLowerCase()} could not be found`);
    }
  }

  export class ConflictError extends AppError {
    constructor(message: string, userMessage?: string) {
      super(409, message, userMessage || 'This action conflicts with existing data');
    }
  }
  ```

- [ ] 20.2. Обновить error handler
  ```typescript
  // server/index.ts
  import { AppError } from './lib/errors';

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      logger.warn({ err, statusCode: err.statusCode }, 'Application error');

      return res.status(err.statusCode).json({
        error: err.userMessage || err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    }

    // Неожиданные ошибки
    logger.error({ err }, 'Unexpected error');

    res.status(500).json({
      error: 'An unexpected error occurred. Please try again later.',
      ...(process.env.NODE_ENV === 'development' && {
        message: err.message,
        stack: err.stack
      })
    });
  });
  ```

- [ ] 20.3. Использовать в routes
  ```typescript
  // server/routes/transactions.routes.ts
  import { NotFoundError, ValidationError } from '../lib/errors';

  router.delete("/:id", async (req, res, next) => {
    try {
      const transaction = await storage.getTransactionById(Number(req.params.id));

      if (!transaction) {
        throw new NotFoundError('Transaction');
      }

      if (transaction.userId !== req.user.id) {
        throw new AuthorizationError('Cannot delete another user\'s transaction');
      }

      await storage.deleteTransaction(transaction.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });
  ```

**Результат**: Понятные сообщения об ошибках

---

## P4 - Долгосрочные улучшения
**Сроки**: 1-2 месяца | **Приоритет**: 🔵 НИЗКИЙ

### 21. Миграция exchange rates в отдельную таблицу
**Проблема**: Hardcoded валюты в схеме
**Цель**: Динамические валютные пары

**Задачи**:
- [ ] 21.1. Создать таблицу
  ```sql
  CREATE TABLE exchange_rates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(10, 6) NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, from_currency, to_currency)
  );

  CREATE INDEX idx_exchange_rates_user ON exchange_rates(user_id);
  ```

- [ ] 21.2. Мигрировать данные
  ```typescript
  // server/migrations/migrate-exchange-rates.ts
  export async function migrateExchangeRates() {
    const settings = await db.select().from(settingsTable);

    for (const setting of settings) {
      const rates = [
        { from: 'USD', to: 'RUB', rate: setting.exchangeRateRUB },
        { from: 'USD', to: 'IDR', rate: setting.exchangeRateIDR },
        { from: 'USD', to: 'KRW', rate: setting.exchangeRateKRW },
        { from: 'USD', to: 'EUR', rate: setting.exchangeRateEUR },
        { from: 'USD', to: 'CNY', rate: setting.exchangeRateCNY },
      ];

      for (const { from, to, rate } of rates) {
        if (rate) {
          await db.insert(exchangeRates).values({
            userId: setting.userId,
            fromCurrency: from,
            toCurrency: to,
            rate: rate.toString(),
          });
        }
      }
    }
  }
  ```

- [ ] 21.3. Обновить API
  ```typescript
  router.get("/exchange-rates", async (req, res) => {
    const rates = await db
      .select()
      .from(exchangeRates)
      .where(eq(exchangeRates.userId, req.user.id));

    res.json(rates);
  });

  router.post("/exchange-rates", async (req, res) => {
    const { fromCurrency, toCurrency, rate } = req.body;

    await db.insert(exchangeRates).values({
      userId: req.user.id,
      fromCurrency,
      toCurrency,
      rate,
    }).onConflictDoUpdate({
      target: [exchangeRates.userId, exchangeRates.fromCurrency, exchangeRates.toCurrency],
      set: { rate, updatedAt: new Date() }
    });

    res.json({ success: true });
  });
  ```

**Результат**: Поддержка любых валют

---

### 22. Real-time уведомления через WebSocket
**Проблема**: Telegram бот - единственный способ уведомлений
**Цель**: Пуши в веб-интерфейсе

**Задачи**:
- [ ] 22.1. Настроить Socket.io
  ```bash
  npm install socket.io
  ```

  ```typescript
  // server/lib/websocket.ts
  import { Server } from 'socket.io';
  import type { Server as HttpServer } from 'http';

  export function setupWebSocket(httpServer: HttpServer) {
    const io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
      },
    });

    io.on('connection', (socket) => {
      const userId = socket.handshake.auth.userId;

      if (!userId) {
        socket.disconnect();
        return;
      }

      socket.join(`user:${userId}`);

      socket.on('disconnect', () => {
        socket.leave(`user:${userId}`);
      });
    });

    return io;
  }
  ```

- [ ] 22.2. Отправлять события
  ```typescript
  // server/services/notification.service.ts
  import { io } from '../lib/websocket';

  export function notifyBudgetExceeded(userId: number, data: any) {
    io.to(`user:${userId}`).emit('budget:exceeded', data);
  }

  export function notifyTransactionCreated(userId: number, transaction: any) {
    io.to(`user:${userId}`).emit('transaction:created', transaction);
  }
  ```

- [ ] 22.3. Подключиться на клиенте
  ```typescript
  // client/src/lib/socket.ts
  import { io } from 'socket.io-client';

  export const socket = io('/', {
    auth: {
      userId: getUserId(),
    },
    autoConnect: false,
  });

  socket.on('budget:exceeded', (data) => {
    toast({
      title: 'Budget Alert',
      description: `You've exceeded your ${data.category} budget`,
      variant: 'destructive',
    });
  });
  ```

**Результат**: Real-time уведомления

---

### 23. Audit Log
**Проблема**: Нет истории изменений
**Цель**: Трекинг всех действий

**Задачи**:
- [ ] 23.1. Создать таблицу
  ```sql
  CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE INDEX idx_audit_log_user ON audit_log(user_id);
  CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
  CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
  ```

- [ ] 23.2. Создать middleware
  ```typescript
  // server/middleware/audit.ts
  export function auditMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const originalJson = res.json;

      res.json = function (data) {
        // Логировать успешные действия
        if (res.statusCode < 400 && req.user) {
          logAudit({
            userId: req.user.id,
            action: `${req.method} ${req.path}`,
            entityType: extractEntityType(req.path),
            entityId: data?.id,
            newValues: data,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          });
        }

        return originalJson.call(this, data);
      };

      next();
    };
  }
  ```

**Результат**: История всех действий

---

### 24. Automatic Currency Updates
**Проблема**: Курсы валют обновляются вручную
**Цель**: Автообновление

**Задачи**:
- [ ] 24.1. Интеграция с API курсов
  ```bash
  npm install axios
  ```

  ```typescript
  // server/services/currency-api.service.ts
  import axios from 'axios';

  const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

  export async function fetchLatestRates(): Promise<Record<string, number>> {
    const response = await axios.get(API_URL);
    return response.data.rates;
  }

  export async function updateUserRates(userId: number) {
    const rates = await fetchLatestRates();

    await db.update(settings)
      .set({
        exchangeRateRUB: rates.RUB.toString(),
        exchangeRateIDR: rates.IDR.toString(),
        exchangeRateKRW: rates.KRW.toString(),
        exchangeRateEUR: rates.EUR.toString(),
        exchangeRateCNY: rates.CNY.toString(),
        exchangeRatesUpdatedAt: new Date(),
      })
      .where(eq(settings.userId, userId));
  }
  ```

- [ ] 24.2. Cron job
  ```typescript
  // server/cron/currency-update.ts
  import cron from 'node-cron';

  export function initCurrencyUpdates() {
    // Каждый день в 00:00
    cron.schedule('0 0 * * *', async () => {
      logger.info('Updating currency rates');

      const users = await db.select().from(settingsTable);

      for (const user of users) {
        try {
          await updateUserRates(user.userId);
        } catch (err) {
          logger.error({ err, userId: user.userId }, 'Failed to update rates');
        }
      }
    });
  }
  ```

**Результат**: Актуальные курсы валют

---

### 25. Advanced Analytics
**Проблема**: Базовая аналитика
**Цель**: Расширенные инсайты

**Задачи**:
- [ ] 25.1. Spending Patterns
  ```typescript
  // Анализ паттернов трат по дням недели
  export async function getSpendingPatterns(userId: number) {
    const result = await db.execute(sql`
      SELECT
        EXTRACT(DOW FROM date) as day_of_week,
        AVG(amount_usd) as avg_amount,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE user_id = ${userId}
        AND type = 'expense'
        AND date >= NOW() - INTERVAL '90 days'
      GROUP BY day_of_week
      ORDER BY day_of_week
    `);

    return result.rows;
  }
  ```

- [ ] 25.2. Category Trends
  ```typescript
  // Тренды по категориям
  export async function getCategoryTrends(userId: number) {
    const result = await db.execute(sql`
      SELECT
        c.name as category,
        DATE_TRUNC('month', t.date) as month,
        SUM(t.amount_usd) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ${userId}
        AND t.type = 'expense'
      GROUP BY c.name, month
      ORDER BY month DESC, total DESC
    `);

    return result.rows;
  }
  ```

- [ ] 25.3. Savings Rate
  ```typescript
  // Процент сбережений
  export async function getSavingsRate(userId: number, months = 6) {
    const result = await db.execute(sql`
      WITH monthly_totals AS (
        SELECT
          DATE_TRUNC('month', date) as month,
          SUM(CASE WHEN type = 'income' THEN amount_usd ELSE 0 END) as income,
          SUM(CASE WHEN type = 'expense' THEN amount_usd ELSE 0 END) as expenses
        FROM transactions
        WHERE user_id = ${userId}
          AND date >= NOW() - INTERVAL '${months} months'
        GROUP BY month
      )
      SELECT
        month,
        income,
        expenses,
        income - expenses as savings,
        CASE
          WHEN income > 0 THEN ((income - expenses) / income * 100)
          ELSE 0
        END as savings_rate
      FROM monthly_totals
      ORDER BY month DESC
    `);

    return result.rows;
  }
  ```

**Результат**: Глубокая аналитика финансов

---

## Чек-лист по приоритетам

### ✅ Что делать СЕЙЧАС (P0) - ЗАВЕРШЕНО! 🎉
- [x] Зашифровать API ключи (AES-256-GCM реализован)
- [x] Сессии в PostgreSQL (connect-pg-simple реализован)
- [x] Валидация env переменных (Zod schema реализован)
- [x] Фикс error handler (безопасный handler реализован)
- [x] Rate limiting (5 limiters реализованы)

### 🔶 Что делать СКОРО (P1) - ЗАВЕРШЕНО! 🎉
- [x] Structured logging (Winston с DailyRotateFile реализован)
- [x] Telegram webhooks (поддержка webhook + polling реализована)
- [x] Error boundaries (React ErrorBoundary с Sentry реализован)
- [x] Sentry мониторинг (интеграция на клиенте и сервере реализована)

### 🔷 Что делать ПОТОМ (P2)
- [ ] Docker + CI/CD
- [ ] Redis кеш
- [ ] Lazy loading
- [ ] Оптимизация bundle
- [ ] N+1 фиксы

### 🔹 Что делать КОГДА-НИБУДЬ (P3-P4)
- [ ] Unit тесты
- [ ] API docs
- [ ] Audit log
- [ ] Advanced analytics
- [ ] WebSocket уведомления

---

## Метрики успеха

После выполнения P0-P1:
- ✅ Security score: 9/10
- ✅ Uptime: 99.9%+
- ✅ Response time: <200ms (p95)
- ✅ Zero data loss при рестартах

После выполнения P2:
- ✅ Bundle size: -30%
- ✅ Load time: <2s
- ✅ DB queries: -50%
- ✅ Automated deploys

После выполнения P3-P4:
- ✅ Test coverage: >70%
- ✅ Full audit trail
- ✅ Real-time notifications
- ✅ Advanced insights

---

## Нужна помощь?

Выбери задачу из списка и я помогу её реализовать! 🚀

# Architecture

**Analysis Date:** 2026-02-19

## Pattern Overview

**Overall:** Three-tier monolithic full-stack application with clear separation between routing/middleware, business logic, and data access. Single Express backend serves two distinct web frontends (React SPA and React Native Expo Web) plus Telegram bot integration.

**Key Characteristics:**
- **Request-Response over WebSocket:** Primary patterns are REST API endpoints with optional WebSocket for real-time notifications
- **Repository pattern:** Data access layer abstracted via repositories, all queries use Drizzle ORM
- **Service layer:** Business logic isolated in domain-specific services (under 150 LOC guideline)
- **Middleware-first security:** Authentication, rate limiting, CORS applied globally before route handling
- **Multi-client architecture:** Single API backend serves budgetbot.online (web), m.budgetbot.online (mobile web), and Telegram bot

## Layers

**Middleware Layer:**
- Purpose: Request/response pipeline control—security headers, CORS, rate limiting, compression, auth checks, logging
- Location: `server/middleware/`
- Contains:
  - `cors.ts` — allowed origins (budgetbot.online, m.budgetbot.online)
  - `auth-utils.ts` — JWT and session authentication utilities
  - `rate-limiter.ts` — global API rate limiting
  - `security-headers.ts` — HSTS, CSP, X-Frame-Options
  - `compression.ts` — gzip response compression
- Depends on: Express, auth services
- Used by: Server entry point (`server/index.ts`) for global middleware chain

**Routing Layer:**
- Purpose: HTTP endpoint handlers, input validation, error catching, audit logging
- Location: `server/routes/`
- Contains: Domain-specific routers (transactions.routes.ts, budgets.routes.ts, etc.) and index.ts for mounting
- Pattern: Each route file exports Express Router with relative paths ('/'), mounted at full paths via index.ts
- Input validation: Uses Zod schemas from `@shared/schema`
- Error handling: Routes wrap service calls in try/catch, convert errors to HTTP responses
- Depends on: Services, repositories, middleware
- Used by: Express app in `server/index.ts`

**Service Layer:**
- Purpose: Domain-specific business logic—calculations, API integrations, external service calls, complex data transformations
- Location: `server/services/`
- Contains: 59 service files (admin-*.service.ts, transaction.service.ts, ai-service.ts, etc.)
- Examples:
  - `transaction.service.ts` — transaction CRUD, currency conversion, balance calculations
  - `ai-service.ts` — Claude API integration for expense analysis
  - `receipt-ocr-fallback.ts` — orchestrates Anthropic/OpenAI OCR with fallback logic
  - `billing.service.ts` — credit system, subscription tiers, quota tracking
  - `notification-scheduler.service.ts` — scheduled budget alerts and notifications
- Size constraint: Files should stay under 150 LOC; longer files should be split (e.g., admin-analytics.service.ts at 28KB is too large, split into focused modules)
- Depends on: Repositories, external APIs, utils (logger, errors, encryption)
- Used by: Routes, other services, cron jobs

**Repository Layer:**
- Purpose: Data access abstraction—all database queries encapsulated here
- Location: `server/repositories/`
- Contains: 24 repository files (transaction.repository.ts, budget.repository.ts, etc.)
- Pattern: Each repository exports singleton instance with typed query methods
- Example structure:
  ```typescript
  export const transactionRepository = {
    async getByUserId(userId: number) { /* Drizzle query */ },
    async create(data: InsertTransaction) { /* Drizzle insert */ },
    async update(id: number, data: Partial<Transaction>) { /* Drizzle update */ },
    async delete(id: number) { /* Drizzle delete */ }
  };
  ```
- ORM: Drizzle ORM (drizzle-orm) with PostgreSQL driver (pg)
- Depends on: Drizzle ORM, database connection pool
- Used by: Services (not called directly from routes; routes only call services)

**Data Model Layer:**
- Purpose: Shared database schema and TypeScript types
- Location: `shared/schema.ts` (50KB, ~1000 lines)
- Contains:
  - Drizzle table definitions (users, transactions, wallets, budgets, categories, notifications, etc.)
  - Relations defined via Drizzle relations()
  - Zod schemas for validation (insertTransactionSchema, insertBudgetSchema, etc.)
  - TypeScript types inferred from schemas
- Shared across: Server (all data operations) and Client (type safety for API responses)
- Pattern: Tables use serial IDs, timestamps, foreign key cascades for cleanup

**Client Layer:**
- Purpose: React UI for web (Vite) and mobile web (Expo Web) clients
- Location: `client/src/`
- Contains:
  - `pages/` — page-level components (dashboard-page.tsx, transactions-page.tsx, etc.)
  - `components/` — reusable UI components (modals, dialogs, forms, charts)
  - `hooks/` — custom React hooks (useAuth, useWebSocket, useImageUpload, etc.)
  - `lib/` — client utilities (queryClient for React Query, api helpers, auth protection)
  - `stores/` — Zustand stores (chat-sidebar-store)
  - `i18n/` — internationalization (Russian/English)
- API communication: React Query (@tanstack/react-query) for data fetching with caching and refetch logic
- WebSocket: Custom WebSocket hook (useWebSocket) for real-time notifications
- Styling: Tailwind CSS + Radix UI components (shadcn/ui)
- Depends on: Server API, shared types

**Telegram Bot Layer:**
- Purpose: Inline Telegram bot for quick expense logging without web UI
- Location: `server/telegram/`
- Contains:
  - `bot.ts` — main bot initialization and webhook handling
  - Command handlers (add_expense, add_income, export, etc.)
  - Miniapp integration for Telegram Web App
- Integration: Webhook-based (POST /api/telegram/webhook receives updates from Telegram)
- Authentication: Links Telegram user ID to budget database user via OAuth-like flow

**Infrastructure Services:**
- Purpose: Cross-cutting concerns (logging, error reporting, caching, sessions)
- Location: `server/lib/`
- Contains:
  - `logger.ts` — Winston logger with daily rotation
  - `sentry.ts` — error tracking integration
  - `redis.ts` — Redis cache and session store
  - `env.ts` — environment variable validation on startup
  - `errors.ts` — AppError class hierarchy
  - `encryption.ts` — AES encryption for sensitive fields (2FA secrets)
  - `websocket.ts` — Socket.IO initialization and event handlers

## Data Flow

**Typical Request Lifecycle:**

1. **Client Request:** React component (page or hook) calls `apiRequest()` via React Query
2. **Middleware Chain:** Request passes through:
   - Request ID tracking
   - CORS validation
   - Session authentication (Passport + express-session)
   - Rate limiter (express-rate-limit)
   - JSON parsing
3. **Route Handler:** Router receives validated request, extracts userId from session
   - Input validation via Zod schema
   - Calls service(s) to fetch/mutate data
4. **Service Logic:** Service executes business logic, may call:
   - Repository methods to query/mutate database
   - External APIs (Claude, OpenAI, currency exchange)
   - Other services (e.g., notification service to trigger alerts)
5. **Repository Query:** Drizzle ORM executes SQL query against PostgreSQL
6. **Response:** Service returns data, route formats response, middleware logs, client receives JSON
7. **Error Handling:** If any layer throws AppError or native Error, global error handler converts to HTTP response with user-friendly message

**Multi-Currency Transaction Flow:**

1. User creates transaction in EUR
2. Route validates input (amount, currency)
3. transactionService calls exchangeRateService for EUR→USD rate
4. transactionRepository.create() stores:
   - `amount`: 100 EUR
   - `originalAmount`: 100 EUR
   - `originalCurrency`: EUR
   - `currency`: EUR
   - `amountUsd`: 108 USD (converted via exchange rate)
   - `exchangeRate`: 1.08
5. Dashboard queries transactions with `amountUsd` for total calculations
6. User can view original or converted amounts

**Real-time Notification Flow:**

1. User creates budget: POST /api/budgets → budgetService.create()
2. Notification is stored in notifications table with status "pending"
3. Cron job (initHourlyBudgetNotifications) runs hourly, calculates current spend vs budget limit
4. If threshold crossed, notificationService.sendNotification() queues alert
5. Socket.IO emits "notification" event to all user's connected sessions
6. Client WebSocket listener receives update, displays toast/bell icon
7. User clicks bell → fetches notifications via GET /api/notifications

**WebSocket Real-time Updates:**

- Client connects: `socket.io-client` creates connection to `localhost:5000` (dev) or `budgetbot.online` (prod)
- Server initializes: Socket.IO middleware validates session
- Events emitted by server:
  - `notification`: New expense alert, budget warning, or system message
  - `transaction-created`: Broadcast to all sessions when transaction added
  - `balance-updated`: Wallet balance changes
- Client subscribes: `useWebSocket()` hook listens for events and updates React Query cache

**State Management:**

- **Server state:** PostgreSQL database is source of truth
- **Client state:** React Query caches API responses (Transaction[], Budget[], etc.) with stale-while-revalidate
- **Session state:** Express-session stores auth session in PostgreSQL (production) or memory (development)
- **UI state:** Zustand store for chat sidebar visibility, local component useState for form inputs
- **Real-time sync:** Socket.IO broadcasts changes, client invalidates React Query cache to refetch

## Key Abstractions

**AppError Hierarchy:**

- Purpose: Standardized error responses with HTTP status, user message, error code
- Examples: `BadRequestError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404)
- Pattern: Routes/services throw AppError, global error handler catches and responds
- File: `server/lib/errors.ts`

**Drizzle ORM Schema as Source of Truth:**

- Purpose: Single definition of database tables, fields, relationships
- File: `shared/schema.ts`
- Pattern: Drizzle table definitions generate TypeScript types via createSelectSchema, createInsertSchema
- Benefits: Type-safe queries in repositories, automatic validation in routes via Zod

**Passport Local Strategy:**

- Purpose: User authentication via email + bcrypt password hash
- Implementation: `server/auth.ts`
- Flow: Login route extracts credentials, passport validates against database, creates session on success
- Session storage: PostgreSQL (prod) or memory (dev)

**Rate Limiting Tiers:**

- Purpose: Prevent abuse and protect API from overload
- Implements: express-rate-limit with two configs:
  - `authLimiter`: 5 requests per 15 minutes (for auth routes)
  - `aiLimiter`: 10 requests per minute (for expensive AI endpoints)
- Applied globally: `app.use('/api', apiLimiter)` in index.ts
- Per-route: AIAnalysis routes get stricter `aiLimiter`

**API Key Manager:**

- Purpose: Centralized control over API credentials (Claude, OpenAI, DeepSeek)
- File: `server/services/api-key-manager.ts`
- Pattern: `getApiKey(userId, operation)` returns billing info (system key, BYOK key, or user credits)
- Usage: Prevents hardcoding API keys, allows per-user billing tracking

**Notification System:**

- Purpose: Multi-channel alerts (email, Telegram, in-app toast)
- Components:
  - notificationService: Creates notification records in database
  - notificationScheduler: Cron job that triggers budget/spending alerts
  - realtimeNotifications: Socket.IO broadcast to connected clients
  - notificationRepository: Stores notification history

## Entry Points

**Server Entry Point:**

- Location: `server/index.ts`
- Triggers: `npm run dev` (development) or `npm run start` (production)
- Responsibilities:
  1. Environment validation via `env.ts`
  2. Sentry error tracking initialization
  3. Redis initialization
  4. Express app creation
  5. Middleware setup (security, CORS, compression, rate limiting)
  6. Authentication setup via Passport
  7. Route registration
  8. Static file serving (production) or Vite dev server (development)
  9. Telegram bot initialization
  10. Scheduled job initialization (budget notifications, session cleanup)
  11. HTTP/WebSocket server listen on port 5000

**Client Entry Point:**

- Location: `client/src/main.tsx`
- Triggers: `npm run dev` (Vite dev server) or serves from `dist/` in production
- Bootstraps: App.tsx (main component router)

**App Component:**

- Location: `client/src/App.tsx`
- Contains: Route definitions, lazy loading, auth provider, WebSocket provider
- Pattern: Switch statement with Route for each page (Dashboard, Transactions, Settings, etc.)
- Protected routes: ProtectedRoute wrapper checks auth status before rendering

**Telegram Bot Entry Point:**

- Location: `server/telegram/bot.ts`
- Triggers: Server initialization calls `initTelegramBot()`
- Responsibilities: Command handler registration, webhook setup, message routing

## Error Handling

**Strategy:** Layered error catching with user-friendly conversion

**Patterns:**

- **Routes:** Try/catch around service calls, throw or return AppError to global handler
  ```typescript
  router.post('/', withAuth, async (req, res, next) => {
    try {
      const result = await transactionService.create(req.body);
      res.json(result);
    } catch (error) {
      next(error); // Global handler converts to HTTP response
    }
  });
  ```

- **Services:** Validate inputs, call repositories, catch DB errors, throw AppError with message
  ```typescript
  export const transactionService = {
    async create(data) {
      if (!data.amount) throw new BadRequestError('Amount required');
      return await transactionRepository.create(data);
    }
  };
  ```

- **Repositories:** Raw Drizzle queries, let DB errors bubble (services wrap in try/catch)
  ```typescript
  async create(data: InsertTransaction) {
    return await db.insert(transactions).values(data).returning();
  }
  ```

- **Global Error Handler:** Catches all errors, logs to Sentry, responds with status + user message
  ```typescript
  app.use((err, req, res, next) => {
    if (isAppError(err)) {
      return res.status(err.statusCode).json(err.toJSON());
    }
    // Unexpected error → 500 + log
    logError('Unhandled error', err);
    res.status(500).json({ error: 'Internal error', code: 'INTERNAL_ERROR' });
  });
  ```

- **Client Error Handling:** React Query catches responses, throwIfResNotOk() extracts error message, component shows toast
  ```typescript
  const { data, isError, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await fetch('/api/transactions');
      await throwIfResNotOk(res);
      return res.json();
    }
  });
  ```

## Cross-Cutting Concerns

**Logging:**

- Framework: Winston logger with daily rotating file store
- Configuration: `server/lib/logger.ts`
- Levels: debug, info, warn, error
- Output: Console (dev), files in `logs/` directory with rotation
- Pattern: `logInfo()`, `logWarning()`, `logError()` helpers imported from lib/logger
- API requests: Logged automatically in index.ts middleware (method, path, status, duration)

**Validation:**

- Input: Zod schemas in routes (derived from @shared/schema)
  ```typescript
  const insertTransactionInputSchema = insertTransactionSchema.omit({
    userId: true,
    amountUsd: true
  });
  const data = insertTransactionInputSchema.parse(req.body);
  ```
- Database constraints: PostgreSQL CHECK constraints (e.g., user must have email OR telegram_id)
- File uploads: Multer middleware validates MIME type, size limits

**Authentication:**

- Primary: Express-session + Passport (email + password)
- Secondary: Telegram OAuth (telegramId linked to user account)
- Secondary: JWT for API key operations (BYOK users)
- Middleware: `withAuth` wrapper checks req.user exists, throws UnauthorizedError if missing
- Ownership verification: Services/routes check `req.user.id === resource.userId` before update/delete

**Authorization:**

- Roles: Basic (free, pro, mega) via `user.tier` field
- Feature gates: Services check user tier before expensive operations (OCR, AI analysis)
- Admin: `user.id` hardcoded list in admin middleware (basic approach, not scalable)
- Ownership: All data queries filtered by `userId` to prevent cross-user data leaks

**Rate Limiting:**

- Global: `app.use('/api', apiLimiter)` — 100 requests/15 min per IP
- Auth routes: 5 requests/15 min (stricter, prevents brute force)
- AI routes: 10 requests/min (expensive, limited throughput)
- Storage: In-memory (development), Redis (production)

---

*Architecture analysis: 2026-02-19*

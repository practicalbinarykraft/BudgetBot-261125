# Codebase Structure

**Analysis Date:** 2026-02-19

## Directory Layout

```
BudgetBot-261125/
├── client/                    # React web app (Vite + shadcn/ui)
│   ├── index.html             # HTML entry point
│   ├── public/                # Static assets
│   └── src/
│       ├── main.tsx           # React root render
│       ├── App.tsx            # Main router component
│       ├── pages/             # Page-level components (41 files)
│       ├── components/        # Reusable UI components (46 directories)
│       ├── hooks/             # Custom React hooks (18 files)
│       ├── lib/               # Client utilities and helpers (19 files)
│       ├── stores/            # Zustand state (chat sidebar)
│       ├── i18n/              # Internationalization (Russian/English)
│       └── types/             # TypeScript type definitions
│
├── server/                    # Express API backend
│   ├── index.ts               # Server entry point
│   ├── auth.ts                # Passport authentication setup
│   ├── db.ts                  # PostgreSQL connection pool
│   ├── vite.ts                # Vite dev server setup
│   ├── static.ts              # Static file serving
│   ├── storage.ts             # File storage (disk/Redis)
│   ├── routes/                # HTTP endpoint handlers (42 files)
│   ├── services/              # Business logic (59 files)
│   ├── repositories/          # Data access layer (24 files)
│   ├── middleware/            # Express middleware (10 files)
│   ├── lib/                   # Server utilities (14 files)
│   ├── types/                 # TypeScript types
│   ├── telegram/              # Telegram bot (bot.ts + handlers)
│   ├── cron/                  # Scheduled jobs (hourly notifications, cleanup)
│   ├── ai/                    # AI provider integrations
│   ├── docs/                  # Swagger/API documentation
│   └── __tests__/             # Unit tests for server modules
│
├── shared/                    # Shared types and database schema
│   ├── schema.ts              # Drizzle tables, Zod schemas (50KB)
│   ├── schemas/               # Additional validation schemas
│   ├── types/                 # Shared TypeScript types
│   └── i18n/                  # Shared localization strings (36 directories)
│
├── mobile/                    # React Native Expo app (separate package.json)
│   ├── app/                   # Expo Router navigation
│   ├── components/            # React Native components
│   ├── hooks/                 # Mobile-specific hooks
│   ├── lib/                   # Mobile utilities
│   └── package.json           # Separate dependencies
│
├── nginx/                     # Production nginx configs (tracked in repo)
│   ├── m.budgetbot.online    # Mobile web subdomain config
│   └── budgetbot.online      # Main domain config
│
├── migrations/                # Drizzle ORM migration files
│   └── 0001_*.sql             # Database schema migrations
│
├── scripts/                   # Build and utility scripts
│   ├── migrate.ts             # Database migration runner
│   ├── verify-schema.ts       # Schema validation
│   ├── metrics/               # Code metrics scripts
│   └── deploy.sh              # Production deployment
│
├── docs/                      # Project documentation
│   ├── specs/                 # Technical specifications
│   ├── changelog-*.md         # Version changelogs
│   └── *.md                   # Architecture, integration docs
│
├── tests/                     # E2E tests (Playwright)
│   └── *.spec.ts              # Test files
│
├── load-tests/                # Load testing scripts
│   └── simple-load-test.ts    # Performance benchmarks
│
├── .github/                   # GitHub Actions workflows
│   └── workflows/             # CI/CD pipeline
│
├── logs/                      # Runtime logs (git-ignored)
│   └── *.log                  # Daily rotating logs
│
├── dist/                      # Production build output (generated)
│   ├── index.js               # Bundled server
│   ├── public/                # Bundled client (Vite build)
│   └── ...
│
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite bundler config (client)
├── vitest.config.ts           # Vitest test runner config
├── playwright.config.ts       # E2E test config
├── tailwind.config.ts         # Tailwind CSS config
├── postcss.config.js          # PostCSS config
├── docker-compose.yml         # Production Docker setup
├── docker-compose.dev.yml     # Development Docker setup
├── Dockerfile                 # Container image definition
├── drizzle.config.ts          # Drizzle ORM config
├── package.json               # Root monorepo dependencies
└── .env.example               # Environment variable template
```

## Directory Purposes

**client/ — React Web Application:**
- Purpose: Desktop/tablet web UI for BudgetBot (served at budgetbot.online)
- Tech: React 18 + Vite (fast dev server, optimized production build)
- Components: shadcn/ui (Radix UI + Tailwind CSS)
- Build output: `dist/public/` (served by Express static middleware)
- Key files:
  - `src/App.tsx` — main router with lazy-loaded pages
  - `src/main.tsx` — React root render to DOM
  - `src/lib/queryClient.ts` — React Query setup, API fetch logic
  - `src/hooks/use-auth.tsx` — authentication context

**server/ — Express API Backend:**
- Purpose: RESTful API backend serving web and mobile clients, Telegram bot
- Port: 5000 (development and production)
- Database: PostgreSQL via Drizzle ORM
- Key patterns:
  - Routes → Services → Repositories → Database
  - Middleware-first security and logging
  - Express-session for user authentication
  - Socket.IO for real-time notifications

**server/routes/ — HTTP Endpoints:**
- Purpose: Handler logic for each API endpoint
- Pattern: Domain-specific routers mounted on paths (e.g., transactionsRouter on '/api/transactions')
- Key files:
  - `index.ts` — central registration of all routers
  - `transactions.routes.ts` — CRUD endpoints for transactions
  - `budgets.routes.ts` — budget management endpoints
  - `ai/` — directory for AI-related routes (receipts, analysis, forecasting)
  - `assets/` — asset management endpoints
  - `telegram-webhook.routes.ts` — incoming Telegram updates
- Pattern: Input validation via Zod, ownership checks, service calls

**server/services/ — Business Logic:**
- Purpose: Domain-specific operations (calculations, API calls, DB manipulation)
- Organization by domain:
  - Transaction services: `transaction.service.ts`, `recurring.service.ts`
  - Budget services: `budget-stats.service.ts`, `budget-progress.service.ts`
  - AI services: `ai-service.ts`, `receipt-ocr-fallback.ts`
  - Admin services: `admin-users.service.ts`, `admin-analytics.service.ts`
  - Integration services: `billing.service.ts`, `currency-service.ts`
  - Notification services: `notification-scheduler.service.ts`, `realtime-notifications.service.ts`
- Size guideline: Keep each file under 150 LOC; split larger ones

**server/repositories/ — Data Access:**
- Purpose: Encapsulate all database queries using Drizzle ORM
- Pattern: Each repo exports singleton instance with typed methods
- Files (24 total):
  - `transaction.repository.ts` — transactions CRUD, filtering, pagination
  - `budget.repository.ts` — budgets CRUD
  - `user.repository.ts` — user CRUD, authentication queries
  - `wallet.repository.ts` — wallet balance tracking
  - `tag.repository.ts` — transaction tags (categories, personal tags)
  - `settings.repository.ts` — user preferences, localization
- All queries filtered by userId to prevent cross-user leaks
- Example method: `getByUserId(userId: number): Promise<Transaction[]>`

**server/middleware/ — Request Pipeline:**
- Purpose: Cross-cutting concerns (auth, CORS, rate limiting, compression)
- Key files:
  - `cors.ts` — allowed origins (budgetbot.online, m.budgetbot.online, localhost)
  - `auth-utils.ts` — withAuth middleware, session checking
  - `rate-limiter.ts` — express-rate-limit configuration
  - `security-headers.ts` — Helmet integration (HSTS, CSP, X-Frame-Options)
  - `compression.ts` — gzip response encoding
  - `request-id.ts` — X-Request-ID tracking for logs

**server/lib/ — Utilities:**
- Purpose: Shared infrastructure (logging, errors, encryption, WebSocket)
- Key files:
  - `logger.ts` — Winston logger with daily rotating file store
  - `errors.ts` — AppError class hierarchy
  - `env.ts` — environment variable validation on startup
  - `sentry.ts` — error tracking integration
  - `redis.ts` — Redis cache and session store initialization
  - `encryption.ts` — AES encryption for 2FA secrets
  - `websocket.ts` — Socket.IO initialization and CORS
  - `alerts.ts` — alert message templates

**server/telegram/ — Telegram Bot:**
- Purpose: Inline Telegram bot for quick expense/income logging
- Key files:
  - `bot.ts` — main bot initialization, webhook routing
  - Command handlers directory with files for each command (add_expense, add_income, export, etc.)
  - Miniapp integration for Telegram Web App
- Integration: Webhook-based (POST /api/telegram/webhook receives Telegram updates)
- Authentication: Links Telegram user ID to budget app user via OAuth-like flow

**server/cron/ — Scheduled Jobs:**
- Purpose: Time-based tasks (budget notifications, session cleanup, cache cleanup)
- Key files:
  - `hourly-budget-notifications.ts` — runs hourly, checks budget thresholds
  - `session-cleanup.ts` — runs daily, removes expired sessions
  - Initialized in server/index.ts via initHourlyBudgetNotifications(), initSessionCleanup()

**server/ai/ — AI Provider Integrations:**
- Purpose: Anthropic Claude, OpenAI GPT, DeepSeek integrations
- Key files:
  - `register-providers.ts` — initializes available providers based on env vars
  - `anthropic-receipt-parser.ts` — Claude Sonnet for receipt OCR
  - `openai-receipt-parser.ts` — GPT-4o for receipt OCR fallback
  - `deepseek-categorizer.ts` — DeepSeek for expense categorization
- Pattern: Each provider has consistent interface (parse, categorize, etc.)

**shared/schema.ts — Database Schema:**
- Purpose: Single source of truth for database structure and types
- Contains (~1000 lines):
  - Drizzle table definitions (users, transactions, wallets, budgets, categories, notifications, etc.)
  - Drizzle relations for foreign key relationships
  - Zod validation schemas (insertUserSchema, insertTransactionSchema, etc.)
  - TypeScript types inferred from schemas
- Shared by: Server (all data operations), Client (type-safe API responses)
- Pattern: Tables use serial IDs, timestamps defaultNow(), cascade deletes, check constraints

**shared/i18n/ — Localization:**
- Purpose: Shared translation strings (Russian/English)
- Structure: 36 directories for different feature domains
- Files: en.ts (English) and ru.ts (Russian) in each directory
- Used by: Client components and server error messages

**mobile/ — React Native Expo App:**
- Purpose: Native mobile app (iOS/Android) with same backend as web
- Note: Also compiles to web via Expo Web (served at m.budgetbot.online)
- Structure: Separate package.json, dependencies, and build process
- Tested via: `npm run test:mobile` (Jest)

**nginx/ — Production Configuration:**
- Purpose: Production reverse proxy and static file serving
- Files:
  - `m.budgetbot.online` — Mobile web subdomain (Expo Web build)
  - `budgetbot.online` — Main domain (React Vite build)
- Pattern: Proxies `/api/` and `/socket.io/` to backend on localhost:5000, serves static files with cache headers
- Important: Tracked in git repo, applied manually on server via `cp` and `nginx -s reload`

**tests/ — E2E Tests:**
- Purpose: End-to-end browser automation tests
- Framework: Playwright
- Run: `npm run test:e2e`
- Pattern: Tests full user flows (login → transaction → dashboard)

**docs/ — Documentation:**
- Purpose: Specs, changelogs, architecture decisions
- Key files:
  - `docs/specs/MOBILE_FULL_AUDIT.md` — web vs mobile parity audit
  - `docs/changelog-2026-02-*.md` — version history
  - `CLAUDE.md` — developer onboarding guide
  - `README.md`, `replit.md` — project overview

## Key File Locations

**Entry Points:**
- `server/index.ts` — Server startup (port 5000, Express app)
- `client/src/main.tsx` — Client startup (React root)
- `client/src/App.tsx` — Client router (pages and layout)
- `mobile/app/_layout.tsx` — Mobile app navigation (Expo Router)
- `server/telegram/bot.ts` — Telegram bot initialization

**Configuration:**
- `.env` or `.env.example` — Environment variables (secrets, API keys, database URL)
- `tsconfig.json` — TypeScript compiler options, path aliases (`@/*` for client/src)
- `vite.config.ts` — Client bundler settings
- `vitest.config.ts` — Server test runner settings
- `drizzle.config.ts` — Database migration settings
- `tailwind.config.ts` — CSS utility configuration
- `components.json` — shadcn/ui configuration

**Core Logic:**
- `shared/schema.ts` — Database schema (tables, types, validations)
- `server/auth.ts` — Passport authentication (email/password + Telegram)
- `server/db.ts` — PostgreSQL connection pool
- `server/lib/errors.ts` — Error classes and handling
- `server/services/transaction.service.ts` — Transaction CRUD and calculations
- `server/services/billing.service.ts` — Credit system and quota tracking
- `server/services/api-key-manager.ts` — API key routing (system vs BYOK)

**Testing:**
- `vitest.config.ts` — Server test configuration
- `playwright.config.ts` — E2E test configuration
- `server/**/__tests__/*.test.ts` — Unit tests co-located with code
- `tests/` — E2E test files

**Runtime:**
- `logs/` — Daily rotating log files (Winston)
- `.git/` — Version control history

## Naming Conventions

**Files:**
- Services: `{domain}.service.ts` (transaction.service.ts, budget-stats.service.ts)
- Repositories: `{domain}.repository.ts` (transaction.repository.ts, user.repository.ts)
- Routes: `{domain}.routes.ts` (transactions.routes.ts, budgets.routes.ts)
- Components: `{FeatureName}.tsx` (Dashboard.tsx, TransactionForm.tsx)
- Hooks: `use{FunctionName}.ts` or `use{FunctionName}.tsx` (useAuth.tsx, useImageUpload.ts)
- Tests: `{module}.test.ts` (transaction.service.test.ts)
- Types: `{DomainType}.ts` (User.ts, Transaction.ts)

**Directories:**
- Feature domains: lowercase plural (`transactions/`, `budgets/`, `categories/`)
- UI components by feature: feature name (ai/, assets/, dashboard/, charts/)
- Utilities: lowercase descriptive (lib/, utils/, hooks/, stores/)
- Middleware: lowercase functional (middleware/, cron/, ai/)

## Where to Add New Code

**New Feature (e.g., Bills Splitting):**
- Route: `server/routes/bill-split.routes.ts` (mounted in routes/index.ts)
- Service: `server/services/bill-split.service.ts` (business logic)
- Repository: `server/repositories/bill-split.repository.ts` (database queries)
- Schema: Add tables to `shared/schema.ts` (billSplits, billSplitParticipants)
- Tests: `server/services/__tests__/bill-split.service.test.ts`
- Client: Create `client/src/pages/bill-split-page.tsx` + `client/src/components/bill-split/` components

**New Component/Module:**
- Implementation: `client/src/components/{FeatureName}/{ComponentName}.tsx`
- Styles: Inline Tailwind classes or create `{ComponentName}.module.css`
- Hook if needed: `client/src/hooks/use{FeatureName}.ts` (data fetching, state)
- Test: `client/src/components/__tests__/{ComponentName}.test.tsx` if complex logic

**Utilities:**
- Shared helpers: `server/lib/{functionality}.ts` (logger, encryption, etc.)
- Client utilities: `client/src/lib/{functionality}.ts` (API calls, formatting, etc.)
- Shared types: `shared/types/{TypeName}.ts` if not in schema.ts

**Database Migration:**
- Create file in `migrations/` directory with timestamp (Drizzle auto-generates)
- Or use `npm run db:migrate:create {name}` to generate template
- Run migrations: `npm run db:push` (Drizzle) or `npm run db:migrate run`

**Tests:**
- Unit (server): `server/services/__tests__/{module}.test.ts` next to source
- Unit (client): `client/src/components/__tests__/{ComponentName}.test.tsx`
- E2E: `tests/{feature}.spec.ts` (Playwright)
- Run: `npm run test` (vitest), `npm run test:mobile` (Jest), `npm run test:e2e` (Playwright)

## Special Directories

**build/ and dist/ — Build Output:**
- Purpose: Generated production bundles
- Generated: Via `npm run build` (esbuild for server, Vite for client)
- Contents: Minified JavaScript, compiled CSS, static assets
- Committed: No (git-ignored)
- Deployed: `dist/` copied to production server

**node_modules/ — Dependencies:**
- Purpose: npm package installations
- Generated: Via `npm install` (lockfile: package-lock.json)
- Committed: No (git-ignored)
- Size: ~600MB on disk (monorepo root + mobile/node_modules/)

**.git/ — Version Control:**
- Purpose: Git repository history and branches
- Contains: Commits, branches, remote tracking
- Key: Origin points to GitHub remote for CI/CD

**logs/ — Runtime Logs:**
- Purpose: Daily rotating log files (Winston)
- Format: YYYY-MM-DD.log (one per day)
- Contents: API requests, errors, info messages
- Committed: No (git-ignored)
- Retention: Managed by Winston daily-rotate plugin (keep ~30 days)

**nginx/ — Production Reverse Proxy:**
- Purpose: Nginx configuration files for production
- Committed: **YES** (unusual, but tracked in repo for deployment)
- Location on server: `/etc/nginx/sites-enabled/`
- Update process: Edit in repo, push to main, manually copy to server, reload nginx

**migrations/ — Database Migrations:**
- Purpose: Track schema changes over time
- Format: Drizzle migration files (auto-generated)
- Committed: Yes (part of version control)
- Running: Via `npm run db:push` or `npm run db:migrate run`

---

*Structure analysis: 2026-02-19*

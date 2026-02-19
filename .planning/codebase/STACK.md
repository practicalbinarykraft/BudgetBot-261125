# Technology Stack

**Analysis Date:** 2026-02-19

## Languages

**Primary:**
- TypeScript 5.6.3 - Used across server, client, and shared code for type safety
- JavaScript (Node.js) - Runtime for server-side code

**Secondary:**
- CSS/SCSS - Tailwind CSS styling framework
- SQL - PostgreSQL database queries via Drizzle ORM

## Runtime

**Environment:**
- Node.js 20 (Alpine base in Docker)
- Module system: ESM (ES Modules, `"type": "module"` in package.json)

**Package Manager:**
- npm 10+ (specified via package.json)
- Lockfile: `package-lock.json` (present and committed)

## Frameworks

**Core:**
- Express 4.21.2 - HTTP API server framework
- React 18.3.1 - Client-side UI framework
- Vite 5.4.20 - Frontend build tool and dev server
- React Native (Expo Web) - Mobile web client via Expo (`mobile/` directory)

**Database/ORM:**
- Drizzle ORM 0.39.1 - Type-safe SQL query builder with migrations
- PostgreSQL 16 (Docker image) - Primary relational database
- drizzle-kit 0.31.4 - Migration tool for Drizzle

**Testing:**
- Vitest 4.0.13 - Unit/integration testing for server code (`npm run test`)
- Jest (in mobile/) - Testing framework for React Native (`npm run test:mobile`)
- Playwright 1.57.0 - E2E testing framework (`npm run test:e2e`)
- Testing Library (@testing-library/react 16.3.0) - Component testing utilities
- Happy DOM 20.0.10 - DOM implementation for unit tests

**Build/Dev:**
- esbuild 0.25.0 - Fast JavaScript bundler for server production build
- TSX 4.20.5 - Execute TypeScript directly (used in npm scripts)
- Rollup - Bundler for Vite
- rollup-plugin-visualizer 6.0.5 - Bundle size analyzer

**UI Component Library:**
- Radix UI (multiple packages @radix-ui/react-*) - Headless component system
- shadcn/ui (via Radix UI) - Styled component library built on Radix
- Tailwind CSS 3.4.17 - Utility-first CSS framework
- tailwindcss-animate 1.0.7 - Animation utilities

**Real-time Communication:**
- Socket.IO 4.8.1 - WebSocket library for real-time notifications
- Socket.IO Client 4.8.1 - Client-side WebSocket connection

**State Management:**
- Zustand 5.0.8 - Lightweight state management for React
- React Query (@tanstack/react-query) 5.60.5 - Server state synchronization

**Utilities:**
- Drizzle-Zod 0.7.0 - Generates Zod schemas from Drizzle tables
- Zod 3.24.2 - Runtime schema validation
- date-fns 3.6.0 - Date utility library
- date-fns-tz 3.2.0 - Timezone support for date-fns
- Lucide React 0.453.0 - Icon library
- Recharts 2.15.2 - Chart/visualization library
- Framer Motion 11.13.1 - Animation library
- Wouter 3.3.5 - Minimal React router

**Authentication/Security:**
- Passport.js 0.7.0 - Authentication middleware
- passport-local 1.0.0 - Username/password authentication strategy
- bcryptjs 3.0.3 - Password hashing (JavaScript implementation)
- bcrypt 6.0.0 - Password hashing (native C++ implementation, faster)
- jsonwebtoken 9.0.3 - JWT token creation and verification
- Helmet 8.1.0 - HTTP security headers middleware
- express-rate-limit 8.2.1 - Rate limiting middleware
- express-session 1.18.1 - Session management middleware
- connect-pg-simple 10.0.0 - PostgreSQL session store for express-session

**Caching/In-Memory:**
- Redis (via ioredis 5.8.2) - Optional in-memory cache for categories, wallets, exchange rates
- ioredis 5.8.2 - Redis client for Node.js
- node-cache 5.1.2 - In-memory cache fallback if Redis unavailable
- memorystore 1.6.7 - Memory session store fallback if PostgreSQL unavailable

**API/Request:**
- Axios 1.13.2 - HTTP client for external API calls
- Compression 1.8.1 - gzip compression middleware

**Scheduled Tasks:**
- node-cron 4.2.1 - Cron job scheduler for background tasks (budget notifications, session cleanup)

## Key Dependencies

**Critical:**
- drizzle-orm 0.39.1 - Database abstraction layer; breaking changes in new versions impact all queries
- express 4.21.2 - Core API server; critical for all HTTP endpoints
- react 18.3.1 - Client rendering; requires careful dependency deduplication (overrides in package.json)

**Infrastructure:**
- @sentry/node 10.26.0 - Server-side error tracking and performance monitoring
- @sentry/react 10.26.0 - Client-side error tracking
- winston 3.18.3 - Structured logging framework (JSON logs to files)
- winston-daily-rotate-file 5.0.0 - Rotating daily log files

**AI/External Services:**
- @anthropic-ai/sdk 0.37.0 - Claude API for OCR and AI chat
- openai 6.9.1 - OpenAI API for Whisper (voice) and GPT-4o (OCR fallback)
- node-telegram-bot-api 0.66.0 - Telegram bot integration

**Misc:**
- validator 13.15.23 - String validation utilities
- qrcode 1.5.4 - QR code generation
- csv-parse 6.1.0 - CSV parsing for bulk imports
- form-data - Multipart form submission
- class-variance-authority 0.7.1 - CSS class generation
- clsx 2.1.1 - Conditional classname utility

## Configuration

**Environment:**
- Configuration via environment variables in `.env` (see `.env.example`)
- Validation via Zod in `server/lib/env.ts` - crashes on startup if required vars missing
- TypeScript strict mode enforced (`tsconfig.json`)

**Build:**
- Vite config: `vite.config.ts` - Client build, manual chunk splitting for caching, bundle analyzer
- esbuild config: In `package.json` build script - Server bundle
- Drizzle config: `drizzle.config.ts` - Database schema, migrations output directory
- TypeScript config: `tsconfig.json` - Path aliases (`@/*`, `@shared/*`)
- Tailwind config: `tailwind.config.ts` - Custom themes, CSS utilities
- PostCSS config: `postcss.config.js` - Tailwind processor
- Vitest config: `vitest.config.ts` - Happy DOM environment, setupFiles
- Playwright config: `playwright.config.ts` - E2E test configuration

## Platform Requirements

**Development:**
- Node.js 20+
- npm 10+
- PostgreSQL 16 (local or Docker)
- Redis (optional, for caching)
- Docker/Docker Compose (for containerized development)

**Production:**
- Docker container (multi-stage build in `Dockerfile`)
- Deployed on Linux VPS (5.129.230.171) running:
  - Node.js 20
  - PostgreSQL 16
  - pm2 (process manager for Node.js)
  - nginx (reverse proxy for two separate SPAs)
- Automatic deployment from git (CI/CD via GitHub Actions)

## Development Scripts

**Server:**
- `npm run dev` - Start dev server with hot reload via tsx
- `npm run build` - Build both client (Vite) and server (esbuild)
- `npm start` - Run production build

**Database:**
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run migrations
- `npm run db:migrate:create` - Create new migration
- `npm run db:verify` - Verify database schema

**Testing:**
- `npm run test` - Watch mode for server tests (vitest)
- `npm run test:run` - Single run of server tests
- `npm run test:mobile` - Mobile tests (jest)
- `npm run test:e2e` - Run Playwright E2E tests

**Docker:**
- `npm run docker:dev` - Start dev containers (docker-compose.dev.yml)
- `npm run docker:build` - Build production image
- `npm run docker:up` - Start production containers

## Key Architectural Decisions

**Monorepo Structure:**
- Root package.json manages all dependencies
- Client, server, and mobile share types via `shared/` directory
- Single TypeScript compilation target

**API Key Management:**
- Multi-provider support: Anthropic Claude, OpenAI, DeepSeek, OpenRouter
- User bring-your-own-key (BYOK) mode or system credits
- Fallback routing: Tries Anthropic first, falls back to OpenAI if rate-limited or billing error

**Session Storage:**
- Prefers PostgreSQL store (via connect-pg-simple) for persistence
- Fallback to memory store if database unavailable (for development)

**Caching Strategy:**
- Redis for distributed caching (optional)
- Fallback to node-cache for in-memory caching
- Cached data: categories, wallets, exchange rates

**Two Separate SPAs:**
- `budgetbot.online` - Express serves Vite build from `/dist/public`
- `m.budgetbot.online` - nginx serves Expo Web build from `/var/www/m.budgetbot.online`
- Both proxied to same Node.js API on port 5000

---

*Stack analysis: 2026-02-19*

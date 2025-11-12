# Budget Buddy - Personal Finance Manager

## Overview

Budget Buddy is a solo personal finance management application designed to help users track income, expenses, wallets, and financial goals. It offers AI-powered spending analysis, receipt OCR, and multi-currency support, all within an intuitive and user-friendly interface. The project aims to provide a comprehensive and simplified tool for managing personal finances.

**Key Capabilities:**
- Transaction, wallet, category, and budget management
- Recurring payments and wishlist tracking
- AI-powered spending analysis and receipt OCR (via Anthropic Claude)
- Multi-currency support with historical exchange rates (USD, RUB, IDR)
- Financial Health Score based on user's spending habits

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

**Technology Stack:** React 18 (TypeScript, Vite), Wouter for routing, TanStack Query for server state, React Hook Form with Zod for forms, Context API for auth.
**UI/UX:** Shadcn/ui (Radix UI primitives), Tailwind CSS with a custom design system adhering to Material Design principles. Features a neutral color scheme, Inter and JetBrains Mono fonts, responsive grid layouts, and consistent spacing.
**Design Principles:** Emphasizes data clarity, trust, and intuitive user interaction through hover effects and elevation.

### Backend

**Technology Stack:** Express.js (TypeScript), Drizzle ORM for PostgreSQL (Neon serverless).
**Authentication:** Passport.js with Local Strategy, session-based using `express-session` (MemoryStore for dev), BCrypt for password hashing.
**API Structure:** RESTful API (`/api` prefix) with modular routes organized by domain (e.g., `transactions.routes.ts`, `budgets.routes.ts`). Includes middleware for authentication and ownership checks.
**Data Model:** Core entities include Users, Transactions (with multi-currency history), Wallets (dual balance tracking), Categories, Budgets, Recurring Payments, Wishlist, and Settings.
**Database Schema Design:** User-centric, with cascade deletions, decimal precision for financial amounts, timestamp tracking, and robust currency handling (original amount + USD equivalent, stored exchange rates).

### System Design Choices

**Multi-Currency System:** Implemented with full history tracking, storing `originalAmount`, `originalCurrency`, and `exchangeRate` in transactions. Wallets track both native and USD equivalent balances. Exchange rates are currently static but designed for future API integration.
**Financial Health Score:** A real-time, deterministic score (0-100) based on Budget Adherence (40%), Cashflow Balance (35%), and Expense Stability (25%). Scores are categorized into status bands (Excellent, Stable, Needs Attention, Critical).
**Category Management:** Full-featured category system with automatic initialization and intuitive UI:
  - Default Categories: 8 categories auto-created on user registration (Food & Drinks, Transport, Shopping, Entertainment, Bills, Salary, Freelance, Unaccounted)
  - System Category: "Unaccounted" (expense type) reserved for calibration adjustments
  - Quick Creation: "Create new category" button integrated directly into transaction form selector
  - Type Synchronization: Category dialog automatically matches transaction type (income/expense)
  - CategoryCreateDialog: Standalone reusable component (client/src/components/categories/)
  - Immediate Feedback: Newly created category auto-selects in transaction form
**ML Auto-Categorization:** Production-ready machine learning system that automatically suggests transaction categories based on merchant name patterns. Key features:
  - merchant_categories table tracks merchant→category associations with usage counts
  - Confidence-based thresholds: 60% (usageCount=1), 80% (usageCount=2-4), 95% (usageCount≥5)
  - Auto-applies categories only when confidence ≥70% (usageCount≥2)
  - Category changes reset usage count to prevent incorrect suggestions
  - Merchant name normalization (lowercase, trimmed) ensures consistent matching
  - Frontend displays toast notifications showing auto-applied category with confidence percentage
  - Fully integrated with transaction creation workflow via transaction.service.ts
**Wallet Calibration System:** Production-ready feature for syncing app balances with real-world bank/wallet balances:
  - Database: calibrations table tracks old/new balance, difference, linked transaction
  - API: POST /api/wallets/:id/calibrate, GET /api/calibrations with full transaction hydration
  - "Unaccounted" Category: 8th default system category for calibration-generated adjustment expenses
  - Multi-Currency: Converts to USD using centralized currency service (static rates: RUB=92.5, IDR=15750)
  - Conditional Transactions: Only creates "Unaccounted" expense if actualBalance < appBalance (difference < -0.01)
  - Category Linkage: Properly assigns categoryId for analytics inclusion in spending reports
  - Zero-Balance Support: Validation explicitly allows 0 as valid actualBalance
  - Enhanced UI (Variant 1 - Compact with Real-time Preview):
    - Shows all wallets simultaneously without checkboxes
    - Real-time difference calculation with visual indicators (✅ green/⚠️ yellow/🔴 red based on % change)
    - Smart badges: "Matches" (no change), percentage warnings (5-10% yellow, >10% red)
    - Preview of transaction creation ("📝 Expense will be created")
    - Summary section with total impact on net worth (USD) and count of expenses to create
    - Dynamic button text showing changed wallet count: "Calibrate (N)"
    - Card-based layout with icon, currency badge, two-column balance display
  - Security: userId from session, ownership verification, foreign key validation
  - E2E Tested: Verified real-time preview, visual indicators, multi-wallet calibration, summary calculations, transaction creation
**Telegram Bot Integration:** Centralized Telegram bot (@BudgetBuddyBot) for on-the-go expense tracking with AI-powered receipt OCR:
  - Architecture: Single bot instance (polling mode) serves all users via unique verification codes with 10-minute TTL
  - Database: telegram_verification_codes table (userId FK, code, expiresAt, isUsed) enforces code expiry and one-time use; users table extended with telegramId (bigint) and telegramUsername (text) for account linking
  - Verification Flow: Users generate 6-digit code in Settings → send `/verify <code>` to bot → telegramId/username stored in users table → connection established
  - Internationalization (i18n): Full bilingual support (English/Russian) with language preference stored in settings.language
    - Language Resolution: Centralized helpers in language.ts eliminate duplicate queries
      - getUserLanguageByTelegramId(telegramId): Initial language fetch before user verification
      - getUserLanguageByUserId(userId): Optimized fetch when user already loaded
    - All bot messages localized: welcome, verification, balance, transactions, receipts, errors, help text, parsing feedback
    - Language persistence: User's choice saved in database and honored across all bot interactions
    - i18n System: server/telegram/i18n.ts contains translations object with 'en' and 'ru' keys, t() helper function
  - Commands:
    - `/start` - Welcome message with quick start guide
    - `/verify <code>` - Link Telegram account using verification code from web app
    - `/language` or `/lang` - Toggle between English and Russian with inline keyboard
    - `/add <text>` - Parse expense from free-form text (e.g., "Coffee 50 RUB" → creates transaction)
    - `/income <text>` - Parse income from free-form text with inline confirmation dialog (e.g., "Salary 50000 RUB" → creates income)
    - `/last` - Display last 5 transactions with formatted date, type, description, amount, and category
    - `/balance` - Show current balances across all wallets with USD equivalents
  - Text Parsing (parser.ts): Extracts amount, currency, and merchant from natural language using regex patterns and category mapping (config.ts); supports formats like "50 RUB coffee", "taxi 300", "lunch $15"
    - Enhanced Feedback: Pre-parse validation distinguishes empty text, missing amounts, and invalid amounts with detailed bilingual error messages and helpful examples
  - Receipt OCR (ocr.ts): Photo messages processed via Anthropic Vision API to extract merchant, total amount, and currency; user confirms/edits before transaction creation
  - Transaction Creation: All bot-created transactions use primary wallet, convert to USD via centralized currency service, apply ML auto-categorization, and notify via toast on web app
  - API Routes (/api/telegram):
    - POST /generate-code - Creates verification code, invalidates previous codes
    - POST /disconnect - Removes telegramId/telegramUsername, maintains historical data
    - GET /status - Returns connection status and linked username
  - Security: userId always derived from authenticated session (never from request body), callback handlers re-validate user via telegramId (prevents privilege escalation), ownership verification on all database operations, bot initialization in server/index.ts post-listen
  - Frontend: Settings page Telegram card with real-time verification code timer, copy-to-clipboard, connection status badge, and disconnect flow
  - Integration: Bot modules in server/telegram/ (bot.ts, commands.ts, parser.ts, ocr.ts, config.ts, i18n.ts), uses existing transaction/category/wallet systems
**Financial Trend Chart with AI Forecasting:** Production-ready dashboard visualization showing cumulative income, expenses, and capital trends with AI-powered predictions:
  - Architecture: Backend services (forecast.service.ts, chart-formatters.ts) + frontend hook/component (use-financial-trend.ts, financial-trend-chart.tsx)
  - Chart Visualization: Three lines rendered via recharts - Income (green), Expense (red), Capital (blue solid for history, blue dashed for forecast)
  - BYOK Pattern: User provides own Anthropic API key in Settings (anthropicApiKey field) for forecast generation, separate from system TELEGRAM_BOT_TOKEN used for bot OCR
  - Configurable Periods: History (7/30/60/90/365 days), Forecast (0/7/30/90/365 days) via dropdown filters
  - AI Forecast: Claude analyzes historical transactions + recurring payments to predict future capital trajectory
  - Smart Fallback: Simple linear projection if Claude API fails (maintains usability without AI key)
  - "Today" Marker: Vertical reference line separates historical data from predictions
  - API: GET /api/analytics/trend?historyDays=30&forecastDays=365 returns combined historical + forecast data points
  - Security: API key redacted in responses, userId from session, ownership verification
  - Database: settings.anthropic_api_key column (nullable text) stores user BYOK key
**Security Hardening:** Critical measures include stripping `userId` from request bodies in PATCH endpoints, foreign key ownership verification to prevent cross-tenant associations, and comprehensive ownership checks on all PATCH/DELETE routes. All POST endpoints force `userId` from the authenticated session.
**Budget Management:** Comprehensive system with `categoryId` foreign key, period-based tracking (week, month, year), and progress calculation based on expenses. UI provides visual progress bars and alerts for exceeded budgets.

## External Dependencies

### Third-Party Services

-   **Anthropic Claude API:** Used for AI-powered spending analysis and receipt OCR. Integrated via `@anthropic-ai/sdk`.
-   **Neon Serverless PostgreSQL:** Primary database, integrated via `@neondatabase/serverless`.

### UI Component Libraries

-   **Radix UI Primitives:** Provides accessible, unstyled UI components, wrapped with Tailwind CSS via Shadcn/ui.
-   **Utility Libraries:** `class-variance-authority`, `clsx`, `tailwind-merge` for styling; `date-fns` for date manipulation; `zod` for schema validation.

### Development Tools

-   **Vite:** Frontend bundling and HMR.
-   **esbuild:** Backend bundling.
-   **TypeScript:** Language compiler.
-   **Drizzle Kit:** Database migrations.
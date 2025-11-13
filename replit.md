# Budget Buddy - Personal Finance Manager

## Overview

Budget Buddy is a personal finance management application designed to help users track income, expenses, wallets, and financial goals. It offers AI-powered spending analysis, receipt OCR, and multi-currency support within an intuitive interface. The project aims to provide a comprehensive and simplified tool for managing personal finances.

## Recent Changes

**November 13, 2025:**
- **Personal Tags Feature:** Implemented third classification axis for transactions (WHO spent/received money) alongside category (WHAT) and type (income/expense)
  - Backend: `personal_tags` table with lucide icon names, 3 types (personal/shared/person), ownership checks in routes
  - Service: `tag.service.ts` with 7 functions (CRUD + stats + default tag creation)
  - Frontend: 5 components (TagBadge, TagSelector, TagCard, CreateTagDialog, TagsSettingsPage at /tags)
  - Transaction integration: personalTagId field added to add/edit transaction dialogs
  - Registration: Automatically creates 2 default tags ("Personal (Me)" with User icon, "Shared" with Home icon)
  - Icons: Lucide-react icons (no emojis) with 10 options, customizable colors
  - Security: Route-level ownership verification prevents unauthorized tag access/modification
  - Known optimizations deferred: TagSelector double-fetch, N+1 stats queries (non-critical)
- **Cumulative Financial Charts:** Refactored analytics to display cumulative (running total) charts instead of daily impulse charts for smoother visualization
  - Created modular architecture: `server/lib/charts/cumulative.ts` (utility), `server/services/trend-calculator.service.ts` (service layer)
  - Income/Expense lines show accumulated totals over time (smooth curves vs. spiky daily bars)
  - Capital calculated as `cumulativeIncome - cumulativeExpense` (simplified formula)
  - Forecast continues smoothly from last historical point using `makeCumulativeFromBase`
  - Capital baseline alignment (matching current wallet balance) deferred to future iteration per Architect recommendation
- Added edit/delete transaction functionality to Dashboard page
- Fixed TanStack Query cache invalidation using `exact: false` flag to ensure Dashboard refreshes after mutations
- Dashboard now supports full transaction management (create, edit, delete) without navigating to Transactions page
- Fixed transaction sorting: Added `ORDER BY date DESC, id DESC` to `getTransactionsByUserId` to ensure transactions always display in chronological order (newest first)
- Resolved issue where edited transactions would disappear from Dashboard due to unsorted database results
- Implemented date-grouped transaction display on Dashboard with localized headers (Russian: "Сегодня", "Вчера", specific dates)
- Fixed date grouping to normalize by calendar date (yyyy-MM-dd) so same-day transactions with different timestamps group together

**Key Capabilities:**
- Transaction, wallet, category, and budget management
- Recurring payments and wishlist tracking
- AI-powered spending analysis and receipt OCR
- Multi-currency support with historical exchange rates (USD, RUB, IDR)
- Financial Health Score based on user's spending habits
- Telegram Bot integration for on-the-go expense tracking
- AI-powered financial trend forecasting

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

**Technology Stack:** React 18 (TypeScript, Vite), Wouter, TanStack Query, React Hook Form with Zod, Context API.
**UI/UX:** Shadcn/ui (Radix UI primitives), Tailwind CSS with a custom design system adhering to Material Design principles. Features a neutral color scheme, responsive grid layouts, and consistent spacing.
**Design Principles:** Emphasizes data clarity, trust, and intuitive user interaction.

### Backend

**Technology Stack:** Express.js (TypeScript), Drizzle ORM for PostgreSQL (Neon serverless).
**Authentication:** Passport.js with Local Strategy, session-based using `express-session`, BCrypt for password hashing.
**API Structure:** RESTful API with modular routes and middleware for authentication and ownership checks.
**Data Model:** Core entities include Users, Transactions (with multi-currency history), Wallets, Categories, Budgets, Recurring Payments, Wishlist, and Settings.
**Database Schema Design:** User-centric, with cascade deletions, decimal precision for financial amounts, timestamp tracking, and robust currency handling.

### System Design Choices

**Multi-Currency System:** Transactions store original amount, currency, and exchange rate. Wallets track native and USD equivalent balances. Users can set custom exchange rates with an hourly cache.
**Financial Health Score:** A real-time score (0-100) based on Budget Adherence (40%), Cashflow Balance (35%), and Expense Stability (25%), categorized into status bands.
**Category Management:** Full-featured category system with default categories, "Unaccounted" for calibration, quick creation in transaction forms, and type synchronization.
**ML Auto-Categorization:** Automatically suggests transaction categories based on merchant name patterns and usage counts, applying categories when confidence thresholds are met.
**Category Resolution Service:** Bridges English parser output with localized user categories for Telegram bot integration, using exact match, synonym match, type-based fallback, and default categories.
**Wallet Calibration System:** Allows users to sync app balances with real-world balances, tracking differences and creating "Unaccounted" adjustment expenses when necessary. Features a compact UI with real-time previews, visual indicators, and net worth impact summaries.
**Telegram Bot Integration:** A centralized bot for expense tracking. Users link accounts via verification codes. Supports i18n (English/Russian), commands (`/start`, `/verify`, `/add`, `/income`, `/balance`, `/last`), natural language parsing, and receipt OCR. Bot-created transactions automatically link to the user's primary wallet (first wallet or auto-created USD default "My Wallet"), update balances atomically, convert currencies using user exchange rates, and apply ML auto-categorization. Enhanced notifications include conversion rates, USD equivalents, capital totals with delta display (e.g., "$9800 (-$18)"), budget progress, and inline action buttons. Implements in-memory receipt storage with 16-character IDs to comply with Telegram's 64-byte callback_data limit, including 5-minute TTL, cross-user security validation, and automatic cleanup. Features full transaction editing via "Edit" button: validates old USD amount BEFORE database update using 3-tier fallback strategy (originalAmount/exchangeRate → amountUsd → amount), aborts cleanly on validation failure to prevent balance corruption, updates transaction and wallet atomically on success. Edit flow maintains primary wallet association and cannot change wallets (parser limitation).
**Scheduled Notification System:** Uses node-cron for timezone-aware daily notifications. Users configure notification time and timezone in Settings (supports 22 popular IANA timezones). Scheduler automatically updates when settings change, initializes on server startup, and sends daily summaries to Telegram users based on their preferences.
**Financial Trend Chart with AI Forecasting:** Dashboard visualization showing cumulative income, expenses, and capital trends. Uses user-provided Anthropic API keys for Claude to analyze historical data and recurring payments for future capital trajectory predictions. Includes configurable history and forecast periods, with a linear projection fallback.
**Personal Tags System:** Third classification axis for transactions answering "WHO spent/received this money?" (complementing category="WHAT" and type="income/expense"). Tags have types: 'personal' (me), 'shared' (household), 'person' (others like "Маша", "Дима"). Features lucide-react icons (10 options: User, Heart, Home, Users, Baby, UserPlus, Briefcase, Gift, Dog, Cat) with customizable colors. Default tags auto-created on registration. Full CRUD at /tags settings page. Transaction forms include optional tag selector. Route-level ownership verification ensures users can only access/modify their own tags. Backend service layer provides stats (transaction count, total spent per tag). Frontend components: TagBadge (display), TagSelector (dropdown), TagCard (management), CreateTagDialog (create/edit with form sync), TagsSettingsPage (list view).
**Security Hardening:** Implemented measures include stripping `userId` from request bodies, foreign key ownership verification, and comprehensive ownership checks on all data manipulation routes.
**Budget Management:** Supports category-based budgeting with period tracking (week, month, year) and progress calculation, featuring UI alerts for exceeded budgets.

## External Dependencies

### Third-Party Services

-   **Anthropic Claude API:** Used for AI-powered spending analysis and receipt OCR.
-   **Neon Serverless PostgreSQL:** Primary database.

### UI Component Libraries

-   **Radix UI Primitives:** Accessible, unstyled UI components.
-   **Shadcn/ui:** Components styled with Tailwind CSS, built on Radix UI.
-   **class-variance-authority, clsx, tailwind-merge:** Utilities for styling.
-   **date-fns:** Date manipulation.
-   **zod:** Schema validation.

### Development Tools

-   **Vite:** Frontend bundling and HMR.
-   **esbuild:** Backend bundling.
-   **TypeScript:** Language compiler.
-   **Drizzle Kit:** Database migrations.
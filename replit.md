# Budget Buddy - Personal Finance Manager

## Overview

Budget Buddy is a personal finance management application designed to help users track income, expenses, wallets, and financial goals. It offers AI-powered spending analysis, receipt OCR, and multi-currency support within an intuitive interface. The project aims to provide a comprehensive and simplified tool for managing personal finances.

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
**Telegram Bot Integration:** A centralized bot for expense tracking. Users link accounts via verification codes. Supports i18n (English/Russian), commands (`/start`, `/verify`, `/add`, `/income`, `/balance`, `/last`), natural language parsing, and receipt OCR. Bot-created transactions use the primary wallet, convert currencies, and apply ML auto-categorization. Enhanced notifications include conversion rates, USD equivalents, capital totals, budget progress, and inline action buttons.
**Financial Trend Chart with AI Forecasting:** Dashboard visualization showing cumulative income, expenses, and capital trends. Uses user-provided Anthropic API keys for Claude to analyze historical data and recurring payments for future capital trajectory predictions. Includes configurable history and forecast periods, with a linear projection fallback.
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
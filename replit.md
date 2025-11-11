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
  - Default Categories: 7 categories auto-created on user registration (Food & Drinks, Transport, Shopping, Entertainment, Bills, Salary, Freelance)
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
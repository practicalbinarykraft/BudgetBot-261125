# Budget Buddy - Personal Finance Manager

## Overview

Budget Buddy is a personal finance management application designed to help users track income, expenses, wallets, and financial goals. It offers AI-powered spending analysis, receipt OCR, and multi-currency support within an intuitive interface. The project aims to provide a comprehensive and simplified tool for managing personal finances, offering features like transaction classification, financial analytics, and AI-powered forecasting to enhance financial literacy and control.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The application uses Shadcn/ui (Radix UI primitives) and Tailwind CSS with a custom design system adhering to Material Design principles. It features a neutral color scheme, responsive grid layouts, and consistent spacing, emphasizing data clarity, trust, and intuitive user interaction.

### Technical Implementations

*   **Frontend:** Built with React 18 (TypeScript, Vite), Wouter for routing, TanStack Query for data fetching, React Hook Form with Zod for form management, and Context API for state.
*   **Backend:** Developed using Express.js (TypeScript) and Drizzle ORM for PostgreSQL (Neon serverless).
*   **Authentication:** Session-based authentication using Passport.js (Local Strategy) and `express-session`, with BCrypt for password hashing.
*   **API Structure:** RESTful API with modular routes and middleware for authentication and ownership checks.

### Feature Specifications

*   **Multi-Currency System:** Transactions store original amount, currency, and exchange rate. Wallets track native and USD equivalent balances.
*   **Financial Health Score:** A real-time score (0-100) based on Budget Adherence, Cashflow Balance, and Expense Stability.
*   **Category Management:** Full-featured category system with default categories, "Unaccounted" for calibration, and quick creation in transaction forms.
*   **ML Auto-Categorization:** Automatically suggests transaction categories based on merchant name patterns.
*   **Category Resolution Service:** Bridges English parser output with localized user categories for Telegram bot integration.
*   **Wallet Calibration System:** Allows users to sync app balances with real-world balances, tracking differences and creating "Unaccounted" adjustment expenses.
*   **Telegram Bot Integration:** A centralized bot for expense tracking supporting i18n, commands, natural language parsing, and receipt OCR. It links bot-created transactions to the user's primary wallet, updates balances atomically, and applies ML auto-categorization. Enhanced notifications include conversion rates, USD equivalents, capital totals, budget progress, and inline action buttons.
*   **Scheduled Notification System:** Uses node-cron for timezone-aware daily notifications, sending summaries to Telegram users.
*   **Financial Trend Chart with AI Forecasting:** Dashboard visualization showing cumulative income, expenses, and capital trends. Uses Anthropic API for Claude to analyze historical data and recurring payments for future capital trajectory predictions.
*   **Personal Tags System:** Implements a third classification axis for transactions (WHO spent/received money) alongside category (WHAT) and type (income/expense). Tags have types ('personal', 'shared', 'person') and use Lucide-react icons with customizable colors.
*   **Budget Management:** Supports category-based budgeting with period tracking and progress calculation.
*   **Transaction Classification & Editing:** Comprehensive system for backfilling and editing transaction classifications (personal tags and financial types).
*   **Financial Classification Analytics:** Provides a 3D transaction analysis framework (Category + Personal Tag + Financial Type) with dedicated analytics pages.
*   **Swipe-Sort Game:** A gamified mini-game for classifying unsorted transactions using a Tinder-style swipe interface, integrating with backend services for session management and statistics.
*   **AI Goal Predictor:** Calculates affordability timeline for wishlist items based on 3-month rolling averages of income and expenses. Provides realistic "when can I afford this" predictions using free capital calculations (income - expenses - budget commitments). Optimized to avoid N+1 queries with batch stats computation and robust guards for new users without transaction history.

### System Design Choices

*   **Data Model:** User-centric, with cascade deletions, decimal precision for financial amounts, timestamp tracking, and robust currency handling.
*   **Security Hardening:** Implemented measures include stripping `userId` from request bodies, foreign key ownership verification, and comprehensive ownership checks on all data manipulation routes.

## External Dependencies

### Third-Party Services

*   **Anthropic Claude API:** Used for AI-powered spending analysis and receipt OCR.
*   **Neon Serverless PostgreSQL:** The primary database.

### UI Component Libraries

*   **Radix UI Primitives:** Accessible, unstyled UI components.
*   **Shadcn/ui:** Components styled with Tailwind CSS, built on Radix UI.
*   **class-variance-authority, clsx, tailwind-merge:** Utilities for styling.
*   **date-fns:** Date manipulation.
*   **zod:** Schema validation.

### Development Tools

*   **Vite:** Frontend bundling and HMR.
*   **esbuild:** Backend bundling.
*   **TypeScript:** Language compiler.
*   **Drizzle Kit:** Database migrations.
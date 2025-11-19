# Budget Buddy - Personal Finance Manager

## Overview

Budget Buddy is a personal finance management application designed to help users track income, expenses, wallets, and financial goals. It offers AI-powered spending analysis, receipt OCR, and multi-currency support within an intuitive interface. The project aims to provide a comprehensive and simplified tool for managing personal finances, offering features like transaction classification, financial analytics, and AI-powered forecasting to enhance financial literacy and control.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The application utilizes Shadcn/ui (Radix UI primitives) and Tailwind CSS with a custom design system based on Material Design principles. It features a neutral color scheme, responsive grid layouts, and consistent spacing to ensure data clarity, user trust, and intuitive interaction.

### Technical Implementations

*   **Internationalization (i18n):** A unified bilingual system (English/Russian) is implemented for both the Web and Telegram bot, ensuring consistent translations across platforms. This includes comprehensive coverage for dashboards, AI tools, and proper handling of Russian plural forms.
*   **Frontend:** Built with React 18 (TypeScript, Vite), using Wouter for routing, TanStack Query for data fetching, React Hook Form with Zod for form management, and Context API for state management.
*   **Backend:** Developed using Express.js (TypeScript) and Drizzle ORM for PostgreSQL.
*   **Authentication:** Session-based authentication is handled using Passport.js (Local Strategy) and `express-session`, with BCrypt for secure password hashing.
*   **API Structure:** A RESTful API with modular routes and middleware ensures proper authentication and ownership checks.
*   **Multi-Currency System:** Transactions store original amounts, currencies, and exchange rates. Wallets track both native and USD equivalent balances. The system allows user-configurable exchange rates, with robust currency conversion architecture and precision handling.
*   **Telegram Bot Integration:** A centralized bot facilitates expense tracking, supporting i18n, commands, natural language parsing, and receipt OCR. It links bot-created transactions to the user's primary wallet, atomically updates balances, and applies ML auto-categorization.
*   **Financial Trend Chart with AI Forecasting:** The dashboard includes a visualization for cumulative income, expenses, and capital trends, with AI predicting future capital trajectories. It features interactive forecast filters for "what-if" scenarios, persistent user preferences, and alerts for potential negative balances. **Unified Forecast Filter Architecture:** Filters (recurring payments, planned expenses/income, budget limits) are applied centrally for both LINEAR (free, default) and AI (opt-in, BYOK) forecast paths, ensuring consistent behavior. LINEAR forecast uses historical averages as baseline, AI forecast uses Claude predictions; both apply identical filter logic before cumulative conversion and capital calculation.
*   **AI Agent Tool Calling:** The AI Assistant can execute actions through natural language using tool detection and confirmation flows. Tools include `get_balance` (read-only, immediate execution), `create_category`, and `add_transaction` (write operations requiring user confirmation).
*   **Editable Confirmation Card:** For AI-initiated write operations, an interactive UI allows users to review and edit transaction details (amount, description, category, currency, personal tag) before execution, with full i18n support.

### System Design Choices

*   **Data Model:** User-centric data model with cascade deletions, decimal precision for financial amounts, timestamp tracking, and robust currency handling.
*   **Security Hardening:** Implements measures such as stripping `userId` from request bodies, foreign key ownership verification, and comprehensive ownership checks to ensure data security.

## External Dependencies

### Third-Party Services

*   **Anthropic Claude API:** Used for AI-powered spending analysis, receipt OCR, and financial chat.
*   **Neon Serverless PostgreSQL:** The primary database.

### UI Component Libraries

*   **Radix UI Primitives:** Accessible, unstyled UI components.
*   **Shadcn/ui:** Components styled with Tailwind CSS, built on Radix UI.
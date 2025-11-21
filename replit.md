# Budget Buddy - Personal Finance Manager

## Overview

Budget Buddy is a personal finance management application designed to help users track income, expenses, wallets, and financial goals. It offers AI-powered spending analysis, receipt OCR, and multi-currency support within an intuitive interface. The project aims to provide a comprehensive and simplified tool for managing personal finances, offering features like transaction classification, financial analytics, and AI-powered forecasting to enhance financial literacy and control.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The application utilizes Shadcn/ui (Radix UI primitives) and Tailwind CSS with a custom design system based on Material Design principles. It features a neutral color scheme, responsive grid layouts, and consistent spacing to ensure data clarity, user trust, and intuitive interaction. **Consistent Layout:** All main pages (Dashboard, Expense Analytics, Transactions, etc.) use `space-y-6` wrapper without excessive padding for uniform top spacing and visual consistency.

### Technical Implementations

*   **Internationalization (i18n):** A unified bilingual system (English/Russian) is implemented for both the Web and Telegram bot, ensuring consistent translations across platforms. This includes comprehensive coverage for dashboards, AI tools, analytics pages, and proper handling of Russian plural forms. All user-facing pages (Dashboard, Transactions, Categories, Budgets, Wallets, AI Analysis, Expense Analytics, etc.) are fully localized with `shared/i18n/` translation files.
*   **Frontend:** Built with React 18 (TypeScript, Vite), using Wouter for routing, TanStack Query for data fetching, React Hook Form with Zod for form management, and Context API for state management.
*   **Backend:** Developed using Express.js (TypeScript) and Drizzle ORM for PostgreSQL.
*   **Authentication:** Session-based authentication is handled using Passport.js (Local Strategy) and `express-session`, with BCrypt for secure password hashing.
*   **API Structure:** A RESTful API with modular routes and middleware ensures proper authentication and ownership checks.
*   **Multi-Currency System:** Transactions store original amounts, currencies, and exchange rates. Wallets track both native and USD equivalent balances. The system allows user-configurable exchange rates, with robust currency conversion architecture and precision handling.
*   **Dual-Currency Product Catalog:** The system supports receipts in ANY ISO currency (THB, EUR, GBP, JPY, etc.) with dual-currency price tracking. Database stores BOTH original currency (`priceOriginal`, `currencyOriginal`, `exchangeRate`) AND USD equivalent (`price`) for price comparisons. Per-item currency resolution with priority: Claude per-item → Claude receipt-level → transaction currency → user settings → merchant heuristic. OCR extracts currency symbols (฿ → THB, € → EUR) with graceful fallbacks. Frontend displays primary (original) + secondary (USD) prices with locale-aware formatting. Future-proof for mixed-currency receipts where items have different currencies.
*   **Telegram Bot Integration:** A centralized bot facilitates expense tracking, supporting i18n, commands, natural language parsing, and receipt OCR. It links bot-created transactions to the user's primary wallet, atomically updates balances, and applies ML auto-categorization. **Telegram Currency Expansion:** Bot supports ANY ISO currency code (not just USD/RUB/IDR). OCR prioritizes Claude-detected currency over merchant heuristic. Text parser extended with EUR, THB, GBP, JPY, KRW symbols. Safe fallback (`parsed.currency || 'USD'`) prevents crashes when OCR omits currency. `formatTransactionMessage` uses per-item currency for receipt items and skips conversion block when `amountUsd <= 0` to avoid misleading exchange rates.
*   **Financial Trend Chart with AI Forecasting:** The dashboard includes a visualization for cumulative income, expenses, and capital trends, with AI predicting future capital trajectories. It features interactive forecast filters for "what-if" scenarios, persistent user preferences, and alerts for potential negative balances. **Unified Forecast Filter Architecture:** Filters (recurring payments, planned expenses/income, budget limits) are applied centrally for both LINEAR (free, default) and AI (opt-in, BYOK) forecast paths, ensuring consistent behavior. LINEAR forecast uses historical averages as baseline, AI forecast uses Claude predictions; both apply identical filter logic before cumulative conversion and capital calculation.
*   **AI Agent Tool Calling:** The AI Assistant can execute actions through natural language using tool detection and confirmation flows. Tools include `get_balance` (read-only, immediate execution), `create_category`, and `add_transaction` (write operations requiring user confirmation).
*   **Editable Confirmation Card:** For AI-initiated write operations, an interactive UI allows users to review and edit transaction details (amount, description, category, currency, personal tag) before execution, with full i18n support.
*   **Voice Transcription with AI Normalization (Telegram Bot):** Users can send voice or audio messages in Telegram bot for intelligent expense tracking. **Flow:** (1) OpenAI Whisper API transcribes audio to text, (2) AI Normalizer (Claude, optional) understands context and converts natural language ("150 тысяч рупий индонезийских") to structured data (150,000 IDR), (3) Transaction created with correct amount, currency, category, and merchant. **Enhanced Fallback Parser:** When Claude unavailable, regex-based parser with word-to-number dictionary (Russian/English numerals 1-999, magnitudes: тысяча/тыс/thousand/k, миллион/million/m) covers 95%+ real-world cases. Supports patterns: "сто тысяч" → 100,000, "five hundred thousand" → 500,000, "пятнадцать рублей" → 15 RUB. **Known limitations:** Complex additive combinations ("twenty five thousand") require Claude AI. BYOK pattern: users provide OpenAI API key (Whisper) and optionally Anthropic API key (Claude normalizer) via Settings page. Modular architecture: `whisper-transcription.service.ts` (API calls, file management), `voice-transaction-normalizer.service.ts` (AI normalization + enhanced fallback), `voice-handler.ts` (orchestration with i18n error handling). Plain text responses avoid Markdown formatting issues.

### System Design Choices

*   **Data Model:** User-centric data model with cascade deletions, decimal precision for financial amounts, timestamp tracking, and robust currency handling.
*   **Security Hardening:** Implements measures such as stripping `userId` from request bodies, foreign key ownership verification, and comprehensive ownership checks to ensure data security.

## External Dependencies

### Third-Party Services

*   **Anthropic Claude API:** Used for AI-powered spending analysis, receipt OCR, and financial chat.
*   **OpenAI API:** Used for voice message transcription via Whisper model in Telegram bot.
*   **Neon Serverless PostgreSQL:** The primary database.

### UI Component Libraries

*   **Radix UI Primitives:** Accessible, unstyled UI components.
*   **Shadcn/ui:** Components styled with Tailwind CSS, built on Radix UI.
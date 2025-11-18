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
*   **Budget Limits Checker + Personalized Notifications:** Real-time budget compliance monitoring with multi-tiered alerts (ok/caution/warning/exceeded at 0%/70%/90%/100% thresholds). Features include: (1) Limits Checker Service for category-wise budget analysis with Telegram alerts at 90%+, (2) Daily Summary Service formatting personalized reports with today's/week's expenses, budget status, and capital, (3) Hourly cron (every 15 min) with ±7 minute tolerance window supporting cross-hour/midnight edge cases for timezone-aware delivery, (4) Real-time alerts triggered on transaction creation (async, non-blocking), (5) On-demand POST /api/limits/check endpoint for manual compliance checks, (6) i18n support (en/ru) for all budget-related messages.
*   **Financial Trend Chart with AI Forecasting:** Dashboard visualization showing cumulative income, expenses, and capital trends. Uses Anthropic API for Claude to analyze historical data and recurring payments for future capital trajectory predictions.
*   **Personal Tags System:** Implements a third classification axis for transactions (WHO spent/received money) alongside category (WHAT) and type (income/expense). Tags have types ('personal', 'shared', 'person') and use Lucide-react icons with customizable colors.
*   **Budget Management:** Supports category-based budgeting with period tracking and progress calculation.
*   **Transaction Classification & Editing:** Comprehensive system for backfilling and editing transaction classifications (personal tags and financial types).
*   **Financial Classification Analytics:** Provides a 3D transaction analysis framework (Category + Personal Tag + Financial Type) with dedicated analytics pages.
*   **Swipe-Sort Game:** A gamified mini-game for classifying unsorted transactions using a Tinder-style swipe interface, integrating with backend services for session management and statistics. **Unsorted Logic:** Transaction is considered unsorted only if `financialType = NULL` (personalTagId and categoryId are optional secondary classifications). After swipe, transaction becomes sorted when financial type is set, regardless of tag/category selection. **Bug Fix (Nov 2025):** Changed swipe-deck to send explicit `null` values instead of `undefined` for unselected tags/categories, ensuring database updates succeed via partial() schema.
*   **AI Goal Predictor:** Calculates affordability timeline for wishlist items based on 3-month rolling averages of income and expenses. Provides realistic "when can I afford this" predictions using free capital calculations (income - expenses - budget commitments). Optimized to avoid N+1 queries with batch stats computation and robust guards for new users without transaction history.
*   **Timeline Events (Goal Markers):** Visual markers on FinancialTrendChart showing when wishlist items become affordable. Features include: (1) GoalTimelineMarker component (98 lines) with pure SVG animations and priority-based symbols (★ ◆ ●), (2) GoalTimelineTooltip component (66 lines) with Card-based goal details, (3) Flexible date matching (monthly predictions → daily trend data), (4) Capital fallback logic using last known value for forecast markers, (5) Safari/iOS compatibility via SVG animate elements (no foreignObject), (6) Click navigation to wishlist, (7) Hover feedback with radius/opacity animations, (8) HTML overlay tooltip outside SVG for cross-browser support.
*   **AI Training History:** Dedicated page (`/ai-training/history`) displaying user's training data history ("lightning bolts" from `aiTrainingExamples` table). Shows total examples, correct predictions, accuracy rate, and recent training sessions with category/tag/type classifications. Backend endpoint `/api/ai/training/history` includes input validation (limit: 1-100, offset: ≥0) and enriches data with category/tag names via joins.
*   **Receipt Item Parsing (Nov 2025):** New `receipt_items` table stores individual items parsed from receipt OCR. Each item links to a transaction (cascade delete) and includes: itemName, normalizedName (for price comparison), quantity, unit, pricePerUnit, totalPrice, currency, amountUsd (USD conversion for analytics), merchantName, and category. Supports multi-item receipt analysis and merchant price comparison features.
*   **Shopping List Parser (Nov 2025):** Telegram bot integration accepts shopping lists as text messages (e.g., "Pepito: арбуз 22к, мыло 189к") via `shopping-list-parser.ts` (195 lines). Supports multiple formats: (1) short comma-separated ("Mag: item 100, item 200"), (2) multiline dash-separated ("Mag:\n- item 100\n- item 200"), (3) simple lists without merchant. Handles "к" shorthand (22к = 22000), extracts merchant, items, prices. Items saved to `receipt_items` with USD conversion (via `amountUsd` column) for consistent analytics. Detection runs BEFORE normal transaction parsing, maintaining backward compatibility with OCR receipts.
*   **Default Currency System (Nov 2025):** User-configurable default currency via `settings.currency` field (USD/RUB/IDR). Used as fallback when currency not explicitly specified in transactions. Enhanced parser supports: (1) "k"/"к" thousand suffix (5k → 5000), (2) "USD" text currency code, (3) comma thousand separators (5,000). Web settings UI at `/settings`, Telegram bot `/currency` command with inline keyboard (🇺🇸/🇷🇺/🇮🇩 emoji flags). All `parseTransactionText()` and `parseShoppingList()` calls updated to pass user's default currency. UPSERT logic ensures currency persists for new users without existing settings records. Explicit currency symbols (₽, $) always take precedence over defaults.
*   **AI Chat Messages (Nov 2025):** New `ai_chat_messages` table stores chat history with AI financial advisor. Links to users (cascade delete) and includes: role ('user' | 'assistant'), content, contextType (e.g., 'budget', 'spending', 'goal'), and contextData (JSON string with relevant financial data). Enables personalized financial advice with full conversation context.
*   **AI Services (Nov 2025):** Modular AI service layer with junior-friendly architecture (files <200 lines):
    - `chat.service.ts` (163 lines): chatWithAI() function with BYOK pattern, Anthropic Messages API array format for multi-turn conversations, enhanced error handling (401/400/429/network errors), message length validation (max 4000 chars)
    - `financial-context.service.ts` (85 lines): buildFinancialContext() gathers wallets, transactions, budgets for AI consumption with accurate time windows
    - `financial-formatters.ts` (142 lines): Helper functions for formatting financial data (wallets, transactions, budgets limits, summary stats) with NaN guards and safe division
*   **AI Chat UI (Nov 2025):** Interactive chat interface with AI financial advisor:
    - `ai-chat.tsx` (145 lines): Main chat container with message history, input handling, auto-scroll, refactored into modular subcomponents
    - `chat-message.tsx` (45 lines): Message bubble component with markdown rendering, role-based styling (user/assistant), avatar icons
    - `typing-indicator.tsx` (32 lines): Animated "AI is thinking" indicator with bouncing dots, positioned inline with messages
    - `quick-actions.tsx` (47 lines): Pre-defined question buttons ("Ask about budget", "Analyze spending", "Savings tips")
    - `markdown-renderer.ts` (71 lines): Lightweight XSS-safe markdown parser supporting **bold**, *italic*, lists without external dependencies
    - **UX Improvements (Nov 2025):** Auto-scroll to new messages, inline typing indicator, markdown formatting for AI responses (lists, bold, italic), message-bubble design resembling modern chat apps
    - Features: Multi-turn conversation support, automatic context inclusion, error toasts, markdown-rendered AI responses
*   **Modular AI Routes (Nov 2025):** Refactored monolithic ai.routes.ts (348 lines) into domain-specific modules:
    - `server/routes/ai/chat.routes.ts` (111 lines): Chat endpoints (GET /history, POST /) with limit validation (1-100), message trimming, length checks
    - `server/routes/ai/training.routes.ts` (62 lines): Training stats, examples, and history endpoints
    - `server/routes/ai/analyze.routes.ts` (53 lines): Spending analysis, receipt scanning, prediction endpoints
    - `server/routes/ai/receipts.routes.ts` (85 lines): Receipt parsing with items extraction
    - `server/routes/ai/price.routes.ts` (52 lines): Price recommendations and AI insights
    - `server/routes/ai/index.ts` (17 lines): Aggregator mounting all sub-routers
    - **Design principle:** One file = one responsibility, all files <200 lines for junior-friendly maintenance

### System Design Choices

*   **Data Model:** User-centric, with cascade deletions, decimal precision for financial amounts, timestamp tracking, and robust currency handling.
*   **Security Hardening:** Implemented measures include stripping `userId` from request bodies, foreign key ownership verification, and comprehensive ownership checks on all data manipulation routes.

## External Dependencies

### Third-Party Services

*   **Anthropic Claude API:** Used for AI-powered spending analysis, receipt OCR, and financial chat. **Model:** Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) as of Nov 2025 - latest recommended model.
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
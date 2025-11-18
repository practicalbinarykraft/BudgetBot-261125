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
*   **Backend:** Developed using Express.js (TypeScript) and Drizzle ORM for PostgreSQL.
*   **Authentication:** Session-based authentication using Passport.js (Local Strategy) and `express-session`, with BCrypt for password hashing.
*   **API Structure:** RESTful API with modular routes and middleware for authentication and ownership checks.

### Feature Specifications

*   **Multi-Currency System:** Transactions store original amount, currency, and exchange rate. Wallets track native and USD equivalent balances.
*   **Financial Health Score:** A real-time score (0-100) based on Budget Adherence, Cashflow Balance, and Expense Stability.
*   **Category Management:** Full-featured category system with default categories and "Unaccounted" for calibration.
*   **ML Auto-Categorization:** Automatically suggests transaction categories based on merchant name patterns.
*   **Wallet Calibration System:** Allows users to sync app balances with real-world balances, tracking differences and creating "Unaccounted" adjustment expenses.
*   **Telegram Bot Integration:** A centralized bot for expense tracking supporting i18n, commands, natural language parsing, and receipt OCR. It links bot-created transactions to the user's primary wallet, updates balances atomically, and applies ML auto-categorization. Enhanced notifications include conversion rates, USD equivalents, capital totals, budget progress, and inline action buttons.
*   **Scheduled Notification System:** Uses node-cron for timezone-aware daily notifications, sending summaries to Telegram users.
*   **Budget Limits Checker + Personalized Notifications:** Real-time budget compliance monitoring with multi-tiered alerts and comprehensive reporting.
*   **Financial Trend Chart with AI Forecasting:** Dashboard visualization showing cumulative income, expenses, and capital trends, using AI to predict future capital trajectory.
*   **Personal Tags System:** Implements a third classification axis for transactions (WHO spent/received money) alongside category (WHAT) and type (income/expense).
*   **Budget Management:** Supports category-based budgeting with period tracking and progress calculation.
*   **Transaction Classification & Editing:** Comprehensive system for backfilling and editing transaction classifications.
*   **Financial Classification Analytics:** Provides a 3D transaction analysis framework (Category + Personal Tag + Financial Type).
*   **Swipe-Sort Game:** A gamified mini-game for classifying unsorted transactions using a Tinder-style swipe interface.
*   **AI Goal Predictor:** Calculates affordability timeline for wishlist items based on rolling averages of income and expenses.
*   **Timeline Events (Goal Markers):** Visual markers on FinancialTrendChart showing when wishlist items become affordable.
*   **AI Training History:** Dedicated page displaying user's training data history, including accuracy rates and recent sessions.
*   **Receipt Item Parsing:** New table stores individual items parsed from receipt OCR, linked to transactions, including itemName, quantity, price, and category.
*   **Shopping List Parser:** Telegram bot integration accepts shopping lists as text messages, extracting merchant, items, and prices, saving them to `receipt_items`.
*   **Default Currency System:** User-configurable default currency used as a fallback. Supports various currency input formats and provides UI/bot commands for selection.
*   **User-Configurable Exchange Rates:** Complete exchange rate customization system replacing all hardcoded rates. Users configure rates for RUB, IDR, KRW, EUR, CNY via Settings UI and Telegram bot. AI Assistant dynamically suggests only configured currencies. Currency dropdown always shows: USD (base) + default currency + current transaction currency + all configured rates. Handles edge cases: default without rate (no conversion), transaction currency after rate deletion (preserved in dropdown), fresh users (USD only).
*   **AI Chat Messages:** New table stores chat history with AI financial advisor, including role, content, contextType, and contextData for personalized advice.
*   **AI Services:** Modular AI service layer with functions for `chatWithAI()`, `buildFinancialContext()`, and `financial-formatters` for data preparation.
*   **AI Chat UI:** Interactive chat interface with AI financial advisor featuring message history, input handling, markdown rendering, and quick action buttons.
*   **Modular AI Routes:** Refactored AI routes into domain-specific modules for chat, training, analysis, receipts, and pricing.
*   **Telegram Menu System:** Modular menu interface with main sections for AI Chat, Wallets, Expenses/Income, and Settings, including state management and integration.
*   **AI Agent Tool Calling:** AI Assistant can execute actions through natural language with automatic tool detection and confirmation flows. Three tools implemented:
    - `get_balance`: Check wallet balances (READ operation - executes immediately without confirmation)
    - `create_category`: Create new transaction categories (WRITE operation - requires user confirmation)
    - `add_transaction`: Add income/expense transactions (WRITE operation - requires user confirmation)
*   **Editable Confirmation Card:** Fully interactive transaction confirmation UI with modular components:
    - **Editable Fields:** Amount and description are editable via input fields before execution
    - **Category Selection:** Dropdown with ML auto-categorization suggestions and confidence badges
    - **Currency Selection:** Multi-currency dropdown (KRW, USD, RUB, EUR, CNY) with context-aware detection from chat
    - **Personal Tag Selection:** "Who" classification dropdown for shared expense tracking
    - **Junior-Friendly Architecture:** All components <200 lines (CategoryDropdown 70, CurrencyDropdown 44, PersonalTagDropdown 59, EditableField 37)

### AI Tool Calling Architecture

The AI Tool Calling system enables the AI Assistant to perform automated actions based on user requests. Architecture:

*   **Tool Definitions** (`server/ai/tools.ts`): Declares available tools with Anthropic-compatible schemas, including `requiresConfirmation` flag to differentiate READ vs WRITE operations.
*   **Tool Handlers** (`server/ai/handlers/`): Modular handler functions for each tool:
    - `balance-handler.ts`: Retrieves wallet balances and capital from storage API
    - `category-handler.ts`: Creates new categories with validation and default values
    - `transaction-handler.ts`: Adds transactions to user's primary wallet
*   **Tool Executor** (`server/ai/tool-executor.ts`): Central dispatcher that routes tool calls to appropriate handlers with user context.
*   **Chat Integration** (`server/routes/ai/chat.routes.ts`): 
    - POST `/api/ai/chat`: Detects tool_use in Claude responses, executes READ operations immediately, returns confirmation requests for WRITE operations
    - POST `/api/ai/confirm-tool`: Executes user-confirmed tool actions
*   **Frontend UI** (`client/src/components/ai-chat-sidebar/`):
    - `confirmation-card.tsx`: Displays action preview with parameters and Execute/Cancel buttons
    - `action-preview.tsx`: Shows tool icon, title, and parameter count
    - `confirmation-buttons.tsx`: Handles confirmation/cancellation with loading states
    - `index.tsx`: Main sidebar integrating tool confirmation flow with retry logic

*   **Key Design Decisions**:
    - BYOK pattern: Uses user's Anthropic API key from settings (no fallback)
    - Security: All tools validate userId, use storage API with ownership checks
    - UX: READ operations execute immediately, WRITE operations show confirmation card
    - Retry: Failed confirmations keep the card visible for retry attempts
    - Junior-Friendly: All files <200 lines, modular architecture

### System Design Choices

*   **Data Model:** User-centric, with cascade deletions, decimal precision for financial amounts, timestamp tracking, and robust currency handling.
*   **Security Hardening:** Measures include stripping `userId` from request bodies, foreign key ownership verification, and comprehensive ownership checks.

## External Dependencies

### Third-Party Services

*   **Anthropic Claude API:** Used for AI-powered spending analysis, receipt OCR, and financial chat.
*   **Neon Serverless PostgreSQL:** The primary database.

### UI Component Libraries

*   **Radix UI Primitives:** Accessible, unstyled UI components.
*   **Shadcn/ui:** Components styled with Tailwind CSS, built on Radix UI.
*   **class-variance-authority, clsx, tailwind-merge:** Utilities for styling.
*   **date-fns:** Date manipulation.
*   **zod:** Schema validation.
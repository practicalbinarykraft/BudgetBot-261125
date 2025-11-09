# Budget Buddy - Personal Finance Manager

## Overview

Budget Buddy is a solo personal finance management application that allows users to track income, expenses, wallets, and financial goals. The application features AI-powered spending analysis, receipt OCR capabilities, and multi-currency support. Built with a focus on simplicity and clarity, it provides users with an intuitive dashboard for managing their financial life.

**Key Features:**
- Transaction tracking (income/expense)
- Multi-wallet support (cards, cash, crypto)
- Category management
- Budget tracking with spending limits (weekly/monthly/yearly)
- Recurring payments planning
- Wishlist for desired purchases
- AI-powered spending analysis (via Anthropic Claude)
- Receipt OCR scanning
- Multi-currency support (USD, RUB, IDR)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React 18 with TypeScript and Vite as the build tool

**Routing:** Wouter (lightweight React router)

**State Management:**
- TanStack Query (React Query) for server state management
- React Hook Form with Zod validation for form state
- Context API for authentication state

**UI Components:**
- Shadcn/ui component library (Radix UI primitives)
- Tailwind CSS for styling with custom design system
- Material Design principles with neutral color scheme
- Custom typography using Inter (primary) and JetBrains Mono (currency amounts)

**Design System:**
- Consistent spacing scale (2, 4, 6, 8, 12, 16, 20, 24 Tailwind units)
- Responsive grid layouts (3-column on desktop, single column on mobile)
- Hover and elevation effects for interactive elements
- System-based approach prioritizing data clarity and trust

### Backend Architecture

**Framework:** Express.js with TypeScript

**Database ORM:** Drizzle ORM configured for PostgreSQL via Neon serverless

**Authentication:**
- Passport.js with Local Strategy
- Session-based authentication using express-session
- MemoryStore for session storage (development)
- BCrypt for password hashing

**API Structure:**
- RESTful API endpoints under `/api` prefix
- Route organization in `server/routes.ts`
- Storage abstraction layer (`IStorage` interface) for data access
- Middleware-based authentication protection

**Data Model:**
- Users table with email/password authentication and optional Telegram integration
- Transactions table with multi-currency support (stores both original and USD amounts)
- Wallets table for different account types
- Categories table for transaction classification
- Budgets table for category-based spending limits with period tracking
- Recurring payments table for scheduled transactions
- Wishlist table for savings goals
- Settings table for user preferences

### Database Schema Design

**Core Principles:**
- Simple user-centric model (single user per account, no sharing/partnerships)
- Cascade deletions to maintain referential integrity
- Decimal precision for financial amounts (10,2)
- Timestamp tracking for audit trails
- Nullable foreign keys where appropriate (e.g., walletId on transactions)

**Currency Handling:**
- Dual storage: original currency + USD equivalent
- Static exchange rates in `currency-service.ts`
- Centralized conversion functions for consistency

### Authentication Flow

**Registration:** User provides email, password, and name → BCrypt hashing → Database storage

**Login:** Passport Local Strategy validates credentials → Session creation → Cookie-based session management

**Session Management:** 7-day cookie expiration with secure flag in production

**Route Protection:** `requireAuth` middleware checks session validity before API access

## External Dependencies

### Third-Party Services

**Anthropic Claude API:**
- Purpose: AI-powered spending analysis and receipt OCR
- Integration: `@anthropic-ai/sdk` package
- Configuration: Requires `ANTHROPIC_API_KEY` environment variable
- Usage: Optional feature with graceful degradation if API key not configured
- Models: claude-3-5-sonnet-20241022 for text analysis

**Neon Serverless PostgreSQL:**
- Purpose: Primary database
- Integration: `@neondatabase/serverless` package with WebSocket support
- Configuration: Requires `DATABASE_URL` environment variable
- Connection pooling via `Pool` from Neon package

### UI Component Libraries

**Radix UI Primitives:**
- Complete set of accessible, unstyled components
- Packages: accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, popover, select, tabs, toast, etc.
- Wrapped with Tailwind styling via Shadcn/ui conventions

**Utility Libraries:**
- `class-variance-authority`: Component variant management
- `clsx` + `tailwind-merge`: Conditional className handling
- `date-fns`: Date formatting and manipulation
- `zod`: Runtime schema validation

### Development Tools

**Replit-Specific Plugins:**
- `@replit/vite-plugin-runtime-error-modal`: Development error overlay
- `@replit/vite-plugin-cartographer`: Code navigation
- `@replit/vite-plugin-dev-banner`: Development environment indicator

**Build Tools:**
- Vite for frontend bundling and HMR
- esbuild for backend bundling
- TypeScript compiler for type checking
- Drizzle Kit for database migrations

### Session & Security

**Session Storage:** 
- Development: MemoryStore (in-memory sessions)
- Production: Should be migrated to connect-pg-simple for PostgreSQL-backed sessions

**Password Security:** BCrypt with automatic salt generation

**CORS & Trust Proxy:** Configured for production deployment with secure cookies

## Recent Changes

### Budget Management Feature (November 2025)

**Implementation:**
- Complete budget tracking system with database schema, API endpoints, and full-featured UI
- Budgets table with categoryId foreign key (migrated from text category to integer categoryId)
- Budget periods: week, month, year with automatic date range calculation
- Progress tracking based on expense transactions in USD within the budget period
- Color-coded status indicators: green (under 80%), yellow (80-100% warning), red (exceeded 100%)

**User Interface:**
- `/budgets` page with create/edit/delete functionality
- Budget cards showing progress bars with spent/limit amounts and percentages
- Alert components on dashboard showing exceeded and warning budgets
- Navigation link in sidebar with TrendingDown icon
- Empty state with call-to-action for new users

**Technical Details:**
- Enhanced Progress component with `indicatorClassName` prop for custom colors
- Budget progress calculation using date-fns for period bounds (startOfWeek, startOfMonth, startOfYear)
- Expense-only filtering with category name matching
- Security: userId sanitization in PATCH endpoint to prevent ownership hijacking
- Comprehensive test IDs on all interactive elements

**Architecture Notes:**
- Budget-category relationship: budgets.categoryId references categories.id
- Transaction matching by category name (transactions.category is text field)
- Fixed date ranges (non-rolling): budget periods calculated from startDate
- Warning thresholds: 80% (yellow alert), 100% (red alert and exceeded status)
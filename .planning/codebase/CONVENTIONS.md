# Coding Conventions

**Analysis Date:** 2026-02-19

## Naming Patterns

**Files:**
- Services: `{feature}.service.ts` (e.g., `notification.service.ts`, `api-key-manager.ts`, `wallet.service.ts`)
- Repositories: `{entity}.repository.ts` (e.g., `user.repository.ts`, `wallet.repository.ts`)
- Routes: `{domain}.routes.ts` (e.g., `transactions.routes.ts`, `wallets.routes.ts`)
- Middleware: `{feature}.ts` or `{feature}.middleware.ts` (e.g., `auth-utils.ts`, `cors.ts`, `admin-auth.middleware.ts`)
- Migrations: `{action}-{description}.ts` (e.g., `init-user-credits.ts`, `migrate-encrypt-keys.ts`)
- Tests: `__tests__/{name}.test.ts` or `{name}.test.ts` (co-located with code or in `__tests__` subdirectory)
- Utils/Libraries: `{purpose}.ts` (e.g., `logger.ts`, `errors.ts`, `env.ts`)

**Functions:**
- camelCase: `checkAndCreateNotifications()`, `getPrimaryWallet()`, `getUserExchangeRates()`
- Async functions: same pattern: `getUserByEmail()`, `createUser()`, `checkBudgetAlert()`
- Export functions as standalone or class methods: `export async function functionName()` or `export class ServiceName { async method() {} }`

**Variables:**
- camelCase: `userId`, `walletId`, `primaryWallets`, `isBlocked`, `isPrimary`
- Database results prefixed with domain: `result`, `plannedExpenses`, `allNotifications`
- Destructured from requests: `{ userId, walletId, limit, offset }` from `req.body` or `req.query`

**Types/Interfaces:**
- PascalCase: `User`, `Transaction`, `Wallet`, `NotificationService`, `ApiKeyResult`
- Schema types: `InsertUser`, `InsertTransaction` (from Drizzle ORM)
- Enums: UPPER_SNAKE_CASE: `AuditAction.REGISTER`, `AuditEntityType.USER`, `AIProvider.ANTHROPIC`

## Code Style

**Formatting:**
- TypeScript strict mode enabled (`tsconfig.json`: `"strict": true`)
- Module resolution: `"moduleResolution": "bundler"` (Vite)
- No auto-formatter enforced (no .eslintrc or .prettierrc present) - rely on developer discipline
- 2-space indentation (observed in all code)
- Line length: practical, no hard limit enforced

**Linting:**
- TypeScript compiler: `npm run check` runs `tsc` for type checking (must pass in CI)
- No ESLint configuration found - rely on IDE and type checking
- Comments in Russian and English are both used (`// Используем реальную БД`, `// If marked as primary`)

## Import Organization

**Order:**
1. External dependencies (Node.js, npm packages): `import express`, `import { db }`, `import { describe, it }`
2. Internal absolute imports (path aliases): `import { userRepository }`, `import { logInfo }`, `import { eq }`
3. Relative imports (same directory or parent): `from './users.repository'`, `from '../services'`
4. Type imports (grouped separately): `import type { Express }`, `import type { Request, Response }`

**Path Aliases:**
- `@/*`: points to `./client/src/*` (React app)
- `@shared/*`: points to `./shared/*` (shared schemas and types across server and client)

Example pattern from `server/services/api-key-manager.ts`:
```typescript
import { logInfo } from '../lib/logger';
import { settingsRepository } from '../repositories/settings.repository';
import { db } from '../db';
import { userCredits } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { AIProvider, AIOperation, ApiKeyResult } from '../types/billing';
```

## Error Handling

**Patterns:**
- Use custom error classes from `server/lib/errors.ts`: `BadRequestError`, `UnauthorizedError`, `NotFoundError`, `ValidationError`, etc.
- All errors extend `AppError` which includes: `statusCode`, `message`, `code`, `details`, and `toJSON()`
- Throw errors in services, catch and respond in route handlers
- Wrap external API calls in try-catch: `try { const response = await externalAPI() } catch (error) { throw new ServiceUnavailableError(...) }`
- Use `toAppError()` utility to convert unknown errors to AppError instances

Example from route handler:
```typescript
router.get("/", withAuth(async (req, res) => {
  try {
    // Logic here
    throw new BadRequestError("Invalid request data");
  } catch (error) {
    if (isAppError(error)) {
      res.status(error.statusCode).json(error.toJSON());
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}));
```

## Logging

**Framework:** Winston (v3.18.3)

**Exported functions:**
- `logInfo(message, metadata?)` - info level
- `logWarning(message, metadata?)` - warning level
- `logError(message, error?)` - error level with stack traces
- `logRequest(req, res, duration)` - request logging middleware

**Patterns:**
- Log context with user IDs: `logInfo('[User ${userId}] Processing transaction...')`
- Log operation stages: `logInfo('[NotificationService] Checking planned...')`, `logInfo('[SERVER] Routes registered')`
- Include metadata objects: `logInfo('Primary wallet selected', { userId, walletId, balance })`
- Errors logged with stack: `logError('Operation failed', error as Error)`
- In production: logs to stdout (JSON format for log aggregators)
- In development: logs to stdout (colored) + file (logs/combined-%DATE%.log and logs/error.log)

Example from `server/services/notification.service.ts`:
```typescript
logInfo(`[NotificationService] Found ${plannedExpenses.length} planned expenses for user ${userId}`);
logInfo(`[NotificationService] Checking planned ${planned.id}: status=${planned.status}, targetDate=${planned.targetDate}`);
```

## Comments

**When to Comment:**
- Complex business logic (e.g., date comparison edge cases, billing logic)
- Non-obvious design decisions: `// Only create notification if there's no notification at all (active or completed/dismissed)`
- SQL/ORM query intent: `// Load all notifications once at the beginning to avoid multiple database calls`
- Section dividers for long files: `// ===== Redis Initialization =====`
- Team notes: Russian comments are used alongside English for team context

**JSDoc/TSDoc:**
- Applied to exported functions and services
- Applied to public methods and complex parameters
- Example from `server/services/api-key-manager.ts`:
```typescript
/**
 * Get appropriate API key for an operation
 *
 * Flow:
 * 1. Check BYOK (user's own key)
 * 2. Check credits
 * 3. Use system key
 */
export async function getApiKey(userId: number, operation: AIOperation): Promise<ApiKeyResult> {
```

## Function Design

**Size:** Junior-focused guidance in CLAUDE.md recommends services stay under 150 lines - if a service grows larger, split it into focused modules. Many services follow this (under 350 lines observed, with largest being 772).

**Parameters:**
- Typed parameters: `async function getPrimaryWallet(userId: number)`
- Destructured objects for multiple params: `{ from, to, limit, offset }` from queries
- Optional params via object: `getPlannedIncomeByUserId(userId, { status: "pending" })`

**Return Values:**
- Explicit return types: `async function getApiKey(...): Promise<ApiKeyResult>`
- Null for not found: `async function getUserByEmail(email: string): Promise<User | null>`
- Arrays for collections: `async function getPlanned(userId: number): Promise<Planned[]>`
- Objects for structured data: `{ data, pagination: { total, limit, offset } }`

## Module Design

**Exports:**
- Services: export as singleton instance or export class + create instance:
  ```typescript
  export class UserRepository { ... }
  export const userRepository = new UserRepository();
  ```
  or
  ```typescript
  export async function getApiKey(...) { ... }
  export async function getUserCredits(...) { ... }
  ```

- Middleware: export function directly: `export const corsMiddleware = (req, res, next) => { ... }`

**Barrel Files:**
- Used in `tests/helpers/index.ts` and `tests/fixtures/index.ts` to group related exports
- Pattern: `export * from './db.helper'` to re-export from subdirectory

**Presentation:**
- Classes used for repositories (data access): `UserRepository`, `TransactionRepository`
- Functions used for services (business logic): `getApiKey()`, `checkAndCreateNotifications()`
- Middleware always functions

---

*Convention analysis: 2026-02-19*

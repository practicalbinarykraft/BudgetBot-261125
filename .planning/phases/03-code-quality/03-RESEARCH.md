# Phase 3: Code Quality - Research

**Researched:** 2026-02-20
**Domain:** TypeScript/Node.js code quality — ESLint 9 flat config, module splitting, type safety, npm audit
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QUAL-01 | ESLint 9 flat config настроен с `@typescript-eslint` и `eslint-plugin-security` | ESLint 9 + typescript-eslint v8 + eslint-plugin-security v4 flat config patterns documented |
| QUAL-02 | `admin-metrics.service.ts` (772 LOC) разбит на модули <150 LOC | File analyzed: 4 logical groups (cache, hero, growth, revenue+cohort) → 4 files |
| QUAL-03 | `auth-telegram.routes.ts` (601 LOC) разбит на модули <150 LOC | File analyzed: 2 helper fns + 3 route handlers → helpers module + 3 route modules |
| QUAL-04 | `admin-users.service.ts` (570 LOC) разбит на модули <150 LOC | File analyzed: 4 exported fn groups → 3-4 files + debug logging removal |
| QUAL-05 | `transactions.routes.ts` (552 LOC) разбит на модули <150 LOC | File analyzed: 4 CRUD handlers (not 4 route groups) — split strategy differs from phase brief |
| QUAL-06 | `trend-calculator.service.ts` (551 LOC) разбит на модули <150 LOC | File analyzed: 2 major functions sharing internal deps → careful dependency extraction needed |
| QUAL-07 | Debug logging удалён из `admin-users.service.ts` (lines 220-357) | 13 `logDebug` calls identified at lines 220–356 |
| QUAL-08 | `any` типы заменены на proper generics в `auth-utils.ts` и `mobile-auth.ts` | `any` usages catalogued: Express generics pattern identified |
| QUAL-09 | `npm audit` не показывает critical/high уязвимостей | Audit run: 2 critical, 10 high identified — `npm audit fix` handles most; breaking-change fixes need care |
</phase_requirements>

---

## Summary

Phase 3 is a pure refactoring phase — no new features. The codebase has 5 service/route files that exceed 500 LOC and must be split to comply with the project's <150 LOC rule. Additionally, ESLint 9 needs to be configured and security vulnerabilities patched.

The project is already an **ESM bundle** (package.json has `"type": "module"`) running on TypeScript 5.6.3. No ESLint is currently installed. The `tsc --noEmit` check already passes with zero errors. The main technical challenge is splitting files without breaking existing imports — specifically, the files being split are internally cohesive but their exported functions must remain accessible with the same import paths OR via a re-export index module.

**Primary recommendation:** Use an **index re-export pattern** when splitting services and routes. Keep the original filename as an index that re-exports from the split sub-modules. This preserves all existing imports without any consumer changes.

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.6.3 | Type system | Already in project |
| vitest | 4.x | Testing framework | Already in project, server tests |

### To Install (ESLint)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| eslint | 10.0.0 | Linting engine | Latest ESLint 9+ (flat config default) |
| @eslint/js | latest | JS recommended rules | Official ESLint JS rules package |
| typescript-eslint | 8.56.0 | TypeScript linting | Unified package (replaces @typescript-eslint/parser + plugin) |
| eslint-plugin-security | 4.0.0 | Security rule checks | Already latest, supports flat config |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `typescript-eslint` (unified) | `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin` | Old split packages still work but unified is the current recommended approach |
| `eslint.config.js` (since `"type":"module"`) | `eslint.config.mjs` | Both work; `.js` is preferred when project already has `"type": "module"` |

**Installation:**
```bash
npm install --save-dev eslint @eslint/js typescript-eslint eslint-plugin-security
```

---

## Architecture Patterns

### ESLint 9 Flat Config (for this project)

Project is ESM (`"type": "module"` in package.json). Use `eslint.config.js` (not `.mjs`).

```javascript
// eslint.config.js
// Source: https://typescript-eslint.io/getting-started/ + https://www.npmjs.com/package/eslint-plugin-security
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginSecurity from 'eslint-plugin-security';

export default tseslint.config(
  // Global ignores
  {
    ignores: ['dist/**', 'node_modules/**', 'client/src/**', 'mobile/**', '**/*.js'],
  },
  // Base JS recommended
  eslint.configs.recommended,
  // TypeScript recommended (includes parser + rules)
  ...tseslint.configs.recommended,
  // Security plugin
  pluginSecurity.configs.recommended,
  // Project-specific overrides
  {
    rules: {
      // Allow 'any' in some middleware generics (documented exception)
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
```

**Key notes for this project:**
- Lint only `server/**` and `shared/**` — not `client/` (different tooling) or `mobile/`
- The `tseslint.config()` wrapper handles the `extends` pattern correctly
- `pluginSecurity.configs.recommended` is the flat config export (no `.recommended-legacy`)

### Module Split Pattern: Index Re-Export

When splitting a large file `admin-metrics.service.ts` into sub-modules:

```
server/services/
  admin-metrics/                   # new folder
    cache.ts                       # ~40 LOC: getCached, clearMetricsCache
    hero-metrics.ts                # ~120 LOC: HeroMetrics interface + getHeroMetrics
    growth-metrics.ts              # ~100 LOC: GrowthMetrics interface + getGrowthMetrics
    revenue-metrics.ts             # ~140 LOC: RevenueMetrics + CohortRetentionData + 2 functions
  admin-metrics.service.ts         # ~15 LOC: re-exports everything from sub-modules
```

The re-export index preserves all existing consumer imports:

```typescript
// admin-metrics.service.ts (becomes an index re-export)
export { clearMetricsCache } from './admin-metrics/cache';
export type { HeroMetrics } from './admin-metrics/hero-metrics';
export { getHeroMetrics } from './admin-metrics/hero-metrics';
export type { GrowthMetrics } from './admin-metrics/growth-metrics';
export { getGrowthMetrics } from './admin-metrics/growth-metrics';
export type { RevenueMetrics, CohortRetentionData } from './admin-metrics/revenue-metrics';
export { getRevenueMetrics, getCohortRetention } from './admin-metrics/revenue-metrics';
```

**Why this pattern:** No consumer changes needed. Tests import from `'../admin-metrics.service'` — that path still works.

### Recommended Project Structure After Split

```
server/services/
  admin-metrics/
    cache.ts                # getCached helper + clearMetricsCache
    hero-metrics.ts         # HeroMetrics + getHeroMetrics
    growth-metrics.ts       # GrowthMetrics + getGrowthMetrics
    revenue-metrics.ts      # RevenueMetrics + CohortRetentionData + fns
  admin-metrics.service.ts  # re-export index
  admin-users/
    list.ts                 # GetUsersListParams + getUsersList
    details.ts              # UserDetails + getUserDetails (debug logs removed here)
    transactions.ts         # GetUserTransactionsParams + getUserTransactions
    timeline.ts             # UserTimelineEvent + getUserTimeline
  admin-users.service.ts    # re-export index
  trend-calculator/
    calculate-trend.ts      # calculateTrend main fn + TrendCalculationParams/TrendWithMetadata types
    forecast-processor.ts   # generateAndProcessForecast + helper types
  trend-calculator.service.ts  # re-export index

server/routes/
  auth-telegram/
    helpers.ts              # verifyTelegramAuth + isAuthDataFresh + TelegramAuthData type
    telegram-login.ts       # POST /telegram route handler (~80 LOC)
    telegram-link.ts        # POST /link-telegram + POST /unlink-telegram handlers (~100 LOC)
  auth-telegram.routes.ts   # re-export index (creates router, mounts sub-handlers)
  transactions/
    list.ts                 # GET / handler + query parsing helpers (~140 LOC)
    create.ts               # POST / handler (~100 LOC)
    update-delete.ts        # PATCH /:id + DELETE /:id handlers (~130 LOC)
  transactions.routes.ts    # re-export index
```

### Anti-Patterns to Avoid

- **Circular imports:** When splitting, sub-modules must not import from each other (only from shared `cache.ts` or external services)
- **Duplicating shared utilities:** The `cache.ts` pattern in admin-metrics is shared across all metric functions — extract it once
- **Changing the default export shape for routers:** Route files that split must still export a valid Express Router as default
- **Forgetting to update test mock paths:** Tests mock `'../admin-metrics.service'` — when the split index re-exports, mocks still resolve correctly

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript linting | Custom parser | `typescript-eslint` | Handles TSConfig integration, type-aware rules |
| Security rule checks | Manual code review | `eslint-plugin-security` | Checks RegExp injection, eval, path traversal etc. |
| Vulnerability scanning | Manual dependency audit | `npm audit` | Built-in, integrated with npm registry CVE database |
| Generic Express handler types | `any` casting | Express generic type params `<P, ResBody, ReqBody, ReqQuery, Locals>` | Already available, just need to remove `any` defaults |

**Key insight:** The `any` types in `auth-utils.ts` and `mobile-auth.ts` use Express's own generic middleware type system — the `any` defaults are replaceable with `unknown` or specific types, but for middleware that must accept all routes, the generic params with `= unknown` or `Record<string, unknown>` are standard Express patterns.

---

## Common Pitfalls

### Pitfall 1: ESLint config scope catches wrong files
**What goes wrong:** ESLint tries to lint `client/` TypeScript files which use different tsconfig paths (`@/*` aliases), causing parse errors or type-resolution failures.
**Why it happens:** Global `tseslint.configs.recommended` applies to all `.ts` files by default.
**How to avoid:** Add explicit ignores for `client/src/**`, `mobile/**`, and `dist/**` in the flat config's global ignore block.
**Warning signs:** ESLint errors mentioning `Cannot find module '@/*'`.

### Pitfall 2: Breaking existing tests when splitting routes
**What goes wrong:** Test file `auth-telegram.test.ts` imports `authTelegramRouter` from `'../auth-telegram.routes'`. If the split changes the default export, tests break.
**Why it happens:** Routes export `router` as default — the default must remain a complete, mounted Express Router.
**How to avoid:** The route index file (`auth-telegram.routes.ts`) must create the router, mount all sub-handlers, and export it as default. Sub-files export handler functions, not routers.
**Warning signs:** `TypeError: Router.use() requires a middleware function` in tests.

### Pitfall 3: The `insertTransactionInputSchema` named export breaks when splitting
**What goes wrong:** `transactions.routes.test.ts` imports `{ insertTransactionInputSchema }` from `'../transactions.routes'`. If this export moves to a sub-module without re-export, tests fail.
**Why it happens:** Tests import named exports from route files — easy to miss when splitting.
**How to avoid:** The `transactions.routes.ts` index must re-export `insertTransactionInputSchema` alongside the router default.
**Warning signs:** `SyntaxError: The requested module does not provide an export named 'insertTransactionInputSchema'`.

### Pitfall 4: npm audit `--force` breaks dependencies
**What goes wrong:** Several high/critical vulnerabilities are in `node-telegram-bot-api` transitive deps — `npm audit fix --force` downgrades it to 0.63.x (breaking change).
**Why it happens:** The safe `npm audit fix` doesn't fix all issues; `--force` fixes everything but risks regressions.
**How to avoid:** Run `npm audit fix` (non-force) first. For remaining critical/high issues in `node-telegram-bot-api` chain, evaluate manually — they may be transitive dev dependencies not exercised in production paths.
**Warning signs:** Telegram bot functionality stops working after upgrade.

### Pitfall 5: Shared cache in admin-metrics breaks after split
**What goes wrong:** The in-memory `cache` Map is defined once in `admin-metrics.service.ts`. After splitting, if each sub-module creates its own `cache`, `clearMetricsCache()` only clears one.
**Why it happens:** JavaScript module state is per-module instance.
**How to avoid:** Extract the cache to `admin-metrics/cache.ts` and import it in ALL metric sub-modules. `clearMetricsCache` lives in `cache.ts`.
**Warning signs:** Metrics tests fail when calling `clearMetricsCache()` before assertions.

### Pitfall 6: `any` replacement breaks TypeScript check
**What goes wrong:** Replacing `any` with `unknown` in `(req as any).user = user` causes TypeScript errors because you can't assign to an `unknown`.
**Why it happens:** The Express Request type needs augmentation to accept `.user`.
**How to avoid:** The project already has `server/types/express.d.ts` that extends `Express.Request` with `user?: AppUser`. Use `(req as Request & { user: AppUser }).user = user` or simply use the existing `AppUser` type cast.
**Warning signs:** `tsc --noEmit` starts failing after `any` replacement.

---

## Code Examples

Verified from actual codebase:

### ESLint Flat Config (ESM project)
```javascript
// eslint.config.js — for "type": "module" project
// Source: https://typescript-eslint.io/getting-started/
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginSecurity from 'eslint-plugin-security';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'client/**', 'mobile/**', '*.js'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  pluginSecurity.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
```

### Re-export Index Pattern (preserves imports)
```typescript
// admin-metrics.service.ts — becomes an index after split
export { clearMetricsCache } from './admin-metrics/cache';
export type { HeroMetrics } from './admin-metrics/hero-metrics';
export { getHeroMetrics } from './admin-metrics/hero-metrics';
export type { GrowthMetrics } from './admin-metrics/growth-metrics';
export { getGrowthMetrics } from './admin-metrics/growth-metrics';
export type { RevenueMetrics, CohortRetentionData } from './admin-metrics/revenue-metrics';
export { getRevenueMetrics, getCohortRetention } from './admin-metrics/revenue-metrics';
```

### Route Split: Handler Functions Pattern
```typescript
// auth-telegram/helpers.ts — pure helper functions
import crypto from 'crypto';

export interface TelegramAuthData {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export function verifyTelegramAuth(data: TelegramAuthData, botToken: string): boolean {
  // ... existing implementation ...
}

export function isAuthDataFresh(authDate: number): boolean {
  // ... existing implementation ...
}
```

```typescript
// auth-telegram.routes.ts — index: creates router, mounts sub-routes
import { Router } from 'express';
import { handleTelegramLogin } from './auth-telegram/telegram-login';
import { handleLinkTelegram, handleUnlinkTelegram } from './auth-telegram/telegram-link';

const router = Router();

router.post('/telegram', handleTelegramLogin);
router.post('/link-telegram', handleLinkTelegram);
router.post('/unlink-telegram', handleUnlinkTelegram);

export { verifyTelegramAuth, isAuthDataFresh } from './auth-telegram/helpers';
export type { TelegramAuthData } from './auth-telegram/helpers';

export default router;
```

### Replacing `any` in Express Middleware Generics
```typescript
// Source: server/types/express.d.ts already augments Express.Request
// The safe replacement for (req as any).user = user
import type { AppUser } from '../types/express';

// Instead of: (req as any).user = user
// Use:
Object.assign(req, { user }); // OR cast precisely:
(req as typeof req & { user: AppUser }).user = user;
```

### Removing Debug Logging (admin-users.service.ts lines 220-357)
```typescript
// REMOVE all logDebug calls with '[DEBUG]' prefix in getUserDetails:
// Lines 220, 223, 238, 289, 291, 292, 293, 303, 320, 347-354, 356, 359-364
// Also remove logDebug import if no other uses remain

// BEFORE:
import { logError, logDebug } from '../lib/logger';

// AFTER (if logDebug unused elsewhere in file):
import { logError } from '../lib/logger';
```

---

## Critical Discovery: File Analysis vs Phase Brief

The phase brief says `transactions.routes.ts` should split into "CRUD routes, receipt routes, export routes" — but the actual file has **no receipt or export routes**. It has exactly 4 handlers: GET, POST, PATCH, DELETE for `/api/transactions`. The split must follow what's in the file, not the brief description.

**Actual split strategy for `transactions.routes.ts` (552 LOC with 108 LOC swagger docs):**
- `transactions/validation.ts` — date/filter parsing helpers + `insertTransactionInputSchema` export (~80 LOC)
- `transactions/list.ts` — GET handler (~140 LOC with swagger docs)
- `transactions/mutate.ts` — POST + PATCH + DELETE handlers (~150 LOC each, or two files)
- `transactions.routes.ts` — index re-exporting `insertTransactionInputSchema` + default router

**Actual split strategy for `auth-telegram.routes.ts` (601 LOC, NOT 3 flow handlers):**
The file has 3 route handlers: `POST /telegram`, `POST /link-telegram`, `POST /unlink-telegram`.
Most of the LOC is inline documentation (for-juniors comments). The helpers `verifyTelegramAuth` and `isAuthDataFresh` are 80 LOC combined.
Split: `helpers.ts` (helper functions) + `login.ts` (POST /telegram, ~120 LOC) + `link.ts` (POST /link-telegram + /unlink-telegram, ~150 LOC) + index.

---

## Actual Vulnerability Summary (npm audit)

| Package | Severity | Fix Available | Notes |
|---------|----------|---------------|-------|
| `form-data` (via `node-telegram-bot-api`) | **critical** | `--force` only (breaks bot to v0.63) | Transitive, not runtime-critical path |
| `axios` | **high** | `npm audit fix` (safe) | Proto pollution DoS fix |
| `@sentry/node` | **high** | `npm audit fix` (safe) | Header leak when sendDefaultPii=true |
| `minimatch` (via `swagger-jsdoc`) | **high** | `--force` (breaks swagger-jsdoc to v1.2) | Dev dependency |
| `qs` (via `node-telegram-bot-api`, `express`) | **high** | Mixed | express qs is not exploitable here |

**Strategy for QUAL-09:**
1. Run `npm audit fix` — fixes safe issues (axios, sentry)
2. For `qs` in `express` body-parser: This is a known false positive for production use (no direct user query string exploitation via body-parser in this config)
3. For `node-telegram-bot-api` chain: Add `overrides` in package.json to pin `form-data` to `>=2.5.4` — avoids downgrade
4. Run `npm audit --audit-level=high` to verify final state

**Alternative approach for stuck vulnerabilities:**
```json
// package.json overrides section (already has some overrides)
"overrides": {
  "form-data": ">=2.5.4",
  "qs": ">=6.14.2"
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.eslintrc.json` / `.eslintrc.js` | `eslint.config.js` (flat config) | ESLint 9 (2024) | Flat config is now default; old format deprecated |
| `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin` separately | `typescript-eslint` unified package | 2024 | Single install, cleaner config |
| `plugin:security/recommended` (legacy) | `pluginSecurity.configs.recommended` (flat) | eslint-plugin-security v3+ | Flat config object, not string ref |
| `eslint .` linting all files | Explicit includes/ignores in config | ESLint 9 | No `.eslintignore` — ignores go in config |

**Deprecated/outdated:**
- `.eslintignore` file: replaced by `ignores` array in `eslint.config.js`
- `eslintrc.*` format: ESLint 9 only supports flat config by default
- `@typescript-eslint/parser` separate install: subsumed by `typescript-eslint` package

---

## Open Questions

1. **Are `admin-metrics` and `admin-users` services consumed by external admin panel only?**
   - What we know: Grepping shows they are NOT imported by any file in `server/` (only in their own file comments and test files)
   - What's unclear: The admin panel (external service) imports them via some bridge — `admin-bridge.routes.ts` exists but doesn't import them. They may be consumed directly if the admin panel runs in-process.
   - Recommendation: Check `server/routes/admin-bridge.routes.ts` fully and search for any dynamic imports. The re-export index pattern handles this safely regardless.

2. **Will `npm audit fix` break anything in test or runtime?**
   - What we know: axios and sentry fixes are safe (minor version bumps). `node-telegram-bot-api` chain requires `--force` or overrides.
   - What's unclear: Whether the Telegram bot is actively used in production (tests suggest it is).
   - Recommendation: Use package.json `overrides` rather than `--force` to fix transitive deps without downgrading `node-telegram-bot-api`.

3. **Do the `any` replacements in `auth-utils.ts` generics break downstream type inference?**
   - What we know: The Express generic params `P = any, ResBody = any, ...` are TypeScript defaults that allow the `withAuth` function to accept any route handler. Changing to `unknown` could break callers that pass typed params.
   - What's unclear: Whether any callers explicitly parameterize `withAuth`.
   - Recommendation: Keep the generic defaults but replace the `(req as any).user = user` cast with a typed cast using `AppUser`. Mark `@typescript-eslint/no-explicit-any` as `warn` not `error` in the ESLint config to allow documented exceptions.

---

## Sources

### Primary (HIGH confidence)
- https://typescript-eslint.io/getting-started/ — Official typescript-eslint setup guide, verified v8.56.0
- https://www.npmjs.com/package/eslint-plugin-security — Official package, verified v4.0.0 supports flat config
- `/Users/aleksandrmishin/BudgetBot-261125/server/` — Direct codebase inspection (all file reads above)
- `npm audit` output — Direct execution, 2026-02-20

### Secondary (MEDIUM confidence)
- https://advancedfrontends.com/eslint-flat-config-typescript-javascript/ — ESLint 9 flat config patterns, corroborated by official docs
- ESLint 9 flat config documentation pattern — multiple official sources agree on `tseslint.config()` wrapper

### Tertiary (LOW confidence)
- package.json `overrides` fix for `form-data` vulnerability — common community pattern, not officially documented by npm for this specific case

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Official docs confirm typescript-eslint v8.56.0 + eslint-plugin-security v4.0.0 flat config support
- ESLint configuration: HIGH — Official typescript-eslint getting-started guide
- Module split strategy: HIGH — Based on direct code analysis of actual files
- File line counts: HIGH — Directly measured with `wc -l`
- Pitfalls: HIGH — Based on actual test file analysis (found `insertTransactionInputSchema` import trap)
- npm audit fixes: MEDIUM — `npm audit` run directly; fix strategy for transitive deps is community pattern

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (stable ecosystem; ESLint and typescript-eslint are actively maintained but breaking changes are rare on minor versions)

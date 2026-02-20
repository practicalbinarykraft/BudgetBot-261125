# Phase 1: Security Audit & Fixes - Research

**Researched:** 2026-02-20
**Domain:** Node.js/Express security hardening (logging, secrets, rate limiting, CORS, HSTS)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Coding Principles
- **Junior-friendly код** — простой, явный, без магии
- **Файлы < 200 строк** — один файл = одна ответственность
- **Переиспользуемый код (2+ раз) → отдельная функция**
- **TDD** — сначала тест, потом реализация. Для каждого security fix пишем тест ДО правки кода.

#### Test-Driven Approach for Security Fixes
1. Написать тест, который ЛОМАЕТСЯ на текущем (небезопасном) поведении
2. Убедиться что тест красный
3. Исправить код
4. Убедиться что тест зелёный
5. Прогнать весь test suite

### Claude's Discretion
- Конкретная реализация Redis store для rate limiters
- Структура нового `PASSWORD_RESET_SECRET` в env schema
- Порядок выполнения security fixes внутри фазы

### Deferred Ideas (OUT OF SCOPE)
- Refresh token rotation (v2)
- Token revocation (v2)
- Email service (v2)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEC-01 | Recovery code не логируется в plaintext — удалён `code` из `logInfo` в `password-recovery.service.ts` | Identified exact location: line 81, `saveRecoveryCode()` function logs `{ code, expiresAt }`. Fix: remove `code` from log object. |
| SEC-02 | JWT signing и password reset HMAC используют разные секреты — добавлен `PASSWORD_RESET_SECRET` | Two files use SESSION_SECRET for HMAC: `password-recovery.service.ts:299` and `password-reset.service.ts:67`. Zod env schema in `server/lib/env.ts` needs new required field. |
| SEC-03 | Fallback `|| 'default-secret'` удалён — приложение падает при отсутствии секрета | Fallback string `'default-secret-change-in-production'` found in `password-recovery.service.ts:299` and `password-reset.service.ts:67`. After adding env validation for `PASSWORD_RESET_SECRET`, `env.PASSWORD_RESET_SECRET` will throw at startup if missing — no runtime fallback needed. |
| SEC-04 | Rate limiters используют Redis store вместо in-memory | `rate-limit-redis` v4.3.1 with ioredis v5.8.2 already installed. Pattern: `new RedisStore({ sendCommand: (cmd, ...args) => client.call(cmd, ...args) })`. Two files contain limiters: `rate-limit.ts` (5 limiters) and `rate-limiter.ts` (3 limiters). |
| SEC-05 | HSTS включён в production (`security-headers.ts`) | `security-headers.ts` currently has `hsts: false`. Helmet v8.1.0 is installed. Fix: set `hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false`. |
| SEC-06 | `localhost:5000` удалён из CORS `ALLOWED_ORIGINS` | Found in `server/middleware/cors.ts:20` inside `if (process.env.NODE_ENV === 'development')` block. Remove `'http://localhost:5000'` from that array. |
| SEC-07 | Socket.IO CORS синхронизирован с Express CORS origins | `server/lib/websocket.ts` already imports `ALLOWED_ORIGINS` from `../middleware/cors` and uses it. After fixing SEC-06, Socket.IO CORS is automatically fixed. No code change needed in websocket.ts. |
</phase_requirements>

## Summary

This phase addresses 7 concrete security vulnerabilities in the existing BudgetBot Express backend. All vulnerabilities are localized to specific lines in specific files — no architectural changes are required, only targeted surgical fixes.

The codebase already has solid foundations: a Zod-based env validation system (`server/lib/env.ts`), an existing Redis client (`server/lib/redis.ts` with ioredis 5.8.2), and `rate-limit-redis` is already a dependency (not installed yet — it's listed in package.json but needs `npm install`). The fixes range from trivially simple (remove one string from an array for SEC-06) to slightly more involved (adding Redis store to 8 rate limiters for SEC-04).

The TDD constraint means each fix follows the red-green cycle: write a failing test first, then fix the code. The existing test files for password recovery and rate limiting provide good patterns to follow.

**Primary recommendation:** Execute fixes in this order: SEC-01 (easiest, pure log removal) → SEC-06 (remove string) → SEC-07 (verify auto-fixed) → SEC-05 (helmet config) → SEC-02/SEC-03 (env schema + secret replacement) → SEC-04 (Redis store). Each fix is self-contained.

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `express-rate-limit` | 8.2.1 | Rate limiting middleware | Installed, used in rate-limit.ts and rate-limiter.ts |
| `rate-limit-redis` | 4.3.1 (latest) | Redis store for express-rate-limit | Official companion package by same org |
| `ioredis` | 5.8.2 | Redis client | Already used in server/lib/redis.ts |
| `helmet` | 8.1.0 | Security headers | Installed, used in security-headers.ts |
| `zod` | 3.24.2 | Env schema validation | Used in server/lib/env.ts |

**Installation needed:**
```bash
npm install rate-limit-redis
```

Note: `rate-limit-redis` is NOT currently in `node_modules` (verified: absent). It needs `npm install`.

### Rate Limiter Files in Codebase
Two files contain rate limiters — both need Redis store added:

**`server/middleware/rate-limit.ts`** (5 limiters):
- `authRateLimiter` — 5 req / 15 min
- `aiRateLimiter` — 20 req / 1 min (user-keyed)
- `generalRateLimiter` — 100 req / 15 min
- `strictRateLimiter` — 3 req / 1 hr
- `heavyOperationRateLimiter` — 30 req / 5 min (user-keyed)

**`server/middleware/rate-limiter.ts`** (3 limiters):
- `apiLimiter` — 100 req / 1 min
- `authLimiter` — 5 req / 1 min
- `aiLimiter` — 10 req / 1 min

## Architecture Patterns

### Pattern 1: TDD Red-Green Cycle for Security Fixes

**What:** Write a test that asserts secure behavior, confirm it fails, fix the code, confirm it passes.
**When to use:** Every single security fix in this phase.

**Test pattern used in this project:**
```typescript
// Source: server/services/__tests__/password-recovery.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../some-dependency', () => ({
  someFunction: vi.fn(),
}));

describe('ModuleName', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does the expected thing', () => {
    // arrange → act → assert
  });
});
```

### Pattern 2: Redis Store for express-rate-limit v8

**What:** Replace default in-memory store with RedisStore to persist rate limit counters across pm2 restarts.
**When to use:** SEC-04 — all 8 rate limiters in both files.

```typescript
// Source: https://github.com/express-rate-limit/rate-limit-redis (verified v4.3.1)
import { rateLimit } from 'express-rate-limit';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import { getRedisClient } from '../lib/redis';

// Create store only if Redis is available
function createStore(prefix: string) {
  const client = getRedisClient();
  if (!client) return undefined; // Falls back to in-memory if Redis not connected
  return new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      client.call(command, ...args) as Promise<RedisReply>,
    prefix,
  });
}

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  store: createStore('rl:auth:'),
  // ... rest of config unchanged
});
```

**Key insight:** The `getRedisClient()` function already exists in `server/lib/redis.ts` and returns `null` when Redis is not configured. The `store: undefined` fallback means the limiter uses memory — graceful degradation.

### Pattern 3: Env Schema Addition (Zod)

**What:** Add `PASSWORD_RESET_SECRET` as a required field to the existing Zod schema in `server/lib/env.ts`.
**When to use:** SEC-02 and SEC-03.

```typescript
// Pattern from existing server/lib/env.ts
SESSION_SECRET: z.string()
  .min(32, 'SESSION_SECRET must be at least 32 characters for security')
  .describe('Session secret for cookie signing'),

// Add this for SEC-02:
PASSWORD_RESET_SECRET: z.string()
  .min(32, 'PASSWORD_RESET_SECRET must be at least 32 characters for security')
  .describe('HMAC secret for password reset tokens (generate with: openssl rand -base64 32)'),
```

Then in `password-recovery.service.ts` and `password-reset.service.ts`, replace:
```typescript
// BEFORE (fallback — SEC-03 violation):
const secret = process.env.SESSION_SECRET || 'default-secret-change-in-production';

// AFTER (no fallback — crashes at startup if missing):
import { env } from '../lib/env';
const secret = env.PASSWORD_RESET_SECRET;
```

### Pattern 4: HSTS Production-Only

**What:** Enable HSTS header only when `NODE_ENV === 'production'` via helmet.
**When to use:** SEC-05.

```typescript
// Source: helmetjs.github.io (verified with helmet v8.1.0)
import { isProduction } from '../lib/env'; // already exported from env.ts

export const securityHeaders = helmet({
  // ... existing config ...
  hsts: isProduction
    ? {
        maxAge: 31536000,        // 1 year
        includeSubDomains: true,
        preload: true,
      }
    : false,
  // ... rest unchanged ...
});
```

### Pattern 5: Plaintext Secret Removal from Logs

**What:** Remove sensitive fields from `logInfo` call arguments.
**When to use:** SEC-01.

```typescript
// BEFORE (server/services/password-recovery.service.ts:81):
logInfo(`Recovery code generated for user ${userId}`, {
  code,          // <-- THIS IS THE PROBLEM
  expiresAt: expiresAt.toISOString(),
});

// AFTER:
logInfo(`Recovery code generated for user ${userId}`, {
  expiresAt: expiresAt.toISOString(),
});
```

### Recommended Fix Order
```
1. SEC-01: Remove code from logInfo     (1 line change, 1 new test)
2. SEC-06: Remove localhost:5000        (1 line change, 1 new test)
3. SEC-07: Verify websocket.ts OK       (already imports ALLOWED_ORIGINS — no change needed)
4. SEC-05: HSTS in production           (2 line change in security-headers.ts, 1 new test)
5. SEC-02: Add PASSWORD_RESET_SECRET    (env.ts + 2 service files, tests updated)
6. SEC-03: Remove || fallback           (same files as SEC-02, done together)
7. SEC-04: Redis store for limiters     (rate-limit.ts + rate-limiter.ts, new tests)
```

### Anti-Patterns to Avoid
- **Hardcoding secrets:** Never use `|| 'some-fallback'` for security-critical values. Crash at startup instead.
- **Re-importing process.env:** Use `env.VARIABLE_NAME` from `server/lib/env.ts` — it validates at startup.
- **Custom Redis connection in rate-limit files:** Reuse `getRedisClient()` from `server/lib/redis.ts` — don't create a second connection.
- **Global Redis store initialization at module level:** The Redis client may not be connected yet when the module loads. Use a factory function (`createStore()`) that's called after Redis init.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Redis rate limit persistence | Custom Redis counter logic | `rate-limit-redis` RedisStore | Handles sliding window, TTL, atomic increments correctly |
| HSTS header | Manual `res.setHeader('Strict-Transport-Security', ...)` | `helmet({ hsts: {...} })` | Helmet already installed, correct max-age format, preload support |
| Env validation | Manual `if (!process.env.X) throw` checks | `zod` schema in `env.ts` | Already the project pattern; validates all vars at once with clear errors |
| HMAC secret isolation | Rotating SESSION_SECRET | Separate `PASSWORD_RESET_SECRET` | Principle of least privilege; rotating one doesn't invalidate the other |

**Key insight:** All required libraries are either already installed or are officially maintained companions. No new architectural patterns needed.

## Common Pitfalls

### Pitfall 1: RedisStore Created Before Redis Init
**What goes wrong:** Rate limiter modules are imported at app startup, potentially before `initRedis()` is called. If RedisStore is instantiated at module load time with a null client, all limiters fall back to memory.
**Why it happens:** Node.js module loading is synchronous; `getRedisClient()` returns null until `initRedis()` is called.
**How to avoid:** Use a lazy factory pattern — check `getRedisClient()` at the moment of limiter creation, or ensure Redis is initialized before the rate-limiter modules are first used. Alternatively, check `server/index.ts` to confirm `initRedis()` is called before Express routes are registered.
**Warning signs:** Rate limiter works but doesn't persist across restarts.

### Pitfall 2: Test Pollution with PASSWORD_RESET_SECRET
**What goes wrong:** After adding `PASSWORD_RESET_SECRET` as required in env.ts, existing tests in `password-reset.service.test.ts` that use `process.env.SESSION_SECRET || 'default-secret-change-in-production'` will break because the service now reads `env.PASSWORD_RESET_SECRET`.
**Why it happens:** Tests don't set `PASSWORD_RESET_SECRET` in `process.env`.
**How to avoid:** Add `process.env.PASSWORD_RESET_SECRET = 'test-password-reset-secret-32chars!';` to `tests/setup.ts` alongside the existing `SESSION_SECRET` setup.
**Warning signs:** `password-reset.service.test.ts` tests fail with "Environment variable validation failed."

### Pitfall 3: rate-limit-redis Package Not Installed
**What goes wrong:** `import { RedisStore } from 'rate-limit-redis'` throws "Cannot find module" even though it appears in package.json search results.
**Why it happens:** `rate-limit-redis` is not currently in `node_modules/` (verified). Must run `npm install rate-limit-redis`.
**How to avoid:** Run `npm install rate-limit-redis` before writing tests.
**Warning signs:** TypeScript compile error or runtime module-not-found error.

### Pitfall 4: HSTS Locks Users Out If Applied on HTTP
**What goes wrong:** If HSTS is enabled on an HTTP endpoint, browsers remember to always use HTTPS for the domain. If HTTPS later breaks, users can't visit the site.
**Why it happens:** HSTS `maxAge` gets cached by browsers.
**How to avoid:** The fix uses `isProduction` from `env.ts` — this is safe because production runs with nginx HTTPS termination. Never set `hsts: true` globally.
**Warning signs:** Current code already has `hsts: false` as a comment saying "Disabled for HTTP-only deployments."

### Pitfall 5: SEC-07 Already Fixed by SEC-06
**What goes wrong:** Implementing SEC-07 as a separate code change when it's already auto-fixed.
**Why it happens:** `server/lib/websocket.ts` already imports `ALLOWED_ORIGINS` from `../middleware/cors`. Removing `localhost:5000` from `cors.ts` automatically fixes Socket.IO CORS too.
**How to avoid:** Read `server/lib/websocket.ts` before implementing SEC-07. Only write a test to VERIFY the sync, not a new implementation.

## Code Examples

Verified patterns from codebase and official sources:

### SEC-01: Remove Plaintext Code from Log
```typescript
// File: server/services/password-recovery.service.ts
// Source: Direct codebase inspection (line 81)

// BEFORE (insecure — logs recovery code in plaintext):
logInfo(`Recovery code generated for user ${userId}`, {
  code,
  expiresAt: expiresAt.toISOString(),
});

// AFTER (secure):
logInfo(`Recovery code generated for user ${userId}`, {
  expiresAt: expiresAt.toISOString(),
});
```

### SEC-01: TDD Test (write BEFORE the fix)
```typescript
// File: server/services/__tests__/password-recovery.security.test.ts
import { describe, it, expect, vi } from 'vitest';
import { logInfo } from '../../lib/logger';

vi.mock('../../lib/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));
// ... mock db, telegram, etc.

it('should NOT log recovery code in plaintext', async () => {
  // Arrange
  await requestPasswordRecovery('user@example.com');

  // Assert: logInfo was called but never with 'code' in its data
  const calls = (logInfo as any).mock.calls;
  for (const [message, data] of calls) {
    expect(data).not.toHaveProperty('code');
  }
});
```

### SEC-04: RedisStore Integration
```typescript
// Source: https://github.com/express-rate-limit/rate-limit-redis v4.3.1
import { rateLimit } from 'express-rate-limit';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import { getRedisClient } from '../lib/redis';

function createRedisStore(prefix: string) {
  const client = getRedisClient();
  if (!client) return undefined; // graceful fallback to memory
  return new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      client.call(command, ...args) as Promise<RedisReply>,
    prefix,
  });
}

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  store: createRedisStore('rl:auth:'),
  message: { error: 'Too many authentication attempts...' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});
```

### SEC-02/03: Add env.ts field and use it
```typescript
// In server/lib/env.ts — add to envSchema:
PASSWORD_RESET_SECRET: z.string()
  .min(32, 'PASSWORD_RESET_SECRET must be at least 32 characters for security')
  .describe('HMAC secret for password reset tokens (generate with: openssl rand -base64 32)'),

// In password-recovery.service.ts and password-reset.service.ts:
import { env } from '../lib/env';

// Replace:
const secret = process.env.SESSION_SECRET || 'default-secret-change-in-production';
// With:
const secret = env.PASSWORD_RESET_SECRET;
```

### SEC-05: HSTS Production-Only
```typescript
// Source: helmetjs.github.io docs (verified helmet v8.1.0)
// In server/middleware/security-headers.ts:
import { isProduction } from '../lib/env';
import helmet from 'helmet';

export const securityHeaders = helmet({
  frameguard: { action: 'deny' },
  noSniff: true,
  hidePoweredBy: true,
  hsts: isProduction
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  // ... rest unchanged
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| In-memory rate limit store | Redis-backed rate limit store (rate-limit-redis) | Must implement | Survives pm2 restarts |
| Single JWT secret for everything | Separate secrets per cryptographic purpose | Must implement | Least privilege, independent rotation |
| `hsts: false` always | `hsts: {...}` in production, false in dev | Must implement | HTTPS enforcement on production |
| `|| 'default-secret'` fallback | Required env var, crash on missing | Must implement | No silent insecure deployments |

## Open Questions

1. **Redis initialization order in index.ts**
   - What we know: `initRedis()` is called somewhere in `server/index.ts` or startup code
   - What's unclear: Whether rate-limiter modules are imported before Redis is initialized
   - Recommendation: Read `server/index.ts` during planning to verify order; use `createStore()` lazy factory pattern regardless to be safe

2. **rate-limit-redis with Redis fallback behavior**
   - What we know: If `store: undefined`, express-rate-limit uses memory. If Redis disconnects mid-flight, the store may throw.
   - What's unclear: Whether `rate-limit-redis` v4.3.1 handles Redis connection drops gracefully (falls back to memory or throws)
   - Recommendation: Wrap the `createStore()` call defensively; test will catch this

3. **Tests that hardcode `'default-secret-change-in-production'`**
   - What we know: `password-reset.service.test.ts` has 6 occurrences of this string used to construct tokens for testing
   - What's unclear: After the fix, these tests need `PASSWORD_RESET_SECRET` set to match
   - Recommendation: In `tests/setup.ts`, add `process.env.PASSWORD_RESET_SECRET = 'test-password-reset-secret-32-chars!!'`. Then update the 6 test occurrences to use `process.env.PASSWORD_RESET_SECRET` (or just `env.PASSWORD_RESET_SECRET`).

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `server/services/password-recovery.service.ts` (line 81: code logged, line 299: fallback secret)
- Direct codebase inspection — `server/services/password-reset.service.ts` (line 67: fallback secret)
- Direct codebase inspection — `server/middleware/cors.ts` (line 20: localhost:5000)
- Direct codebase inspection — `server/middleware/security-headers.ts` (line 33: hsts: false)
- Direct codebase inspection — `server/lib/websocket.ts` (line 15: imports ALLOWED_ORIGINS)
- Direct codebase inspection — `server/lib/env.ts` (Zod schema pattern)
- Direct codebase inspection — `server/lib/redis.ts` (`getRedisClient()` function)
- `node_modules/express-rate-limit/package.json` — version 8.2.1 confirmed
- `node_modules/ioredis/package.json` — version 5.8.2 confirmed
- `node_modules/helmet/package.json` — version 8.1.0 confirmed

### Secondary (MEDIUM confidence)
- [GitHub: express-rate-limit/rate-limit-redis](https://github.com/express-rate-limit/rate-limit-redis) — v4.3.1 release (Nov 30, 2025), ioredis sendCommand pattern verified
- [helmetjs.github.io](https://helmetjs.github.io/) — HSTS configuration options confirmed

### Tertiary (LOW confidence)
- None — all critical claims verified from codebase or official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed installed (except rate-limit-redis which needs npm install), versions verified in node_modules
- Architecture: HIGH — codebase read directly, exact file/line locations documented
- Pitfalls: HIGH — pitfalls derived from direct code reading (test setup.ts, import patterns), not speculation
- SEC-04 Redis fallback behavior: MEDIUM — library behavior not verified from source, mitigated by defensive factory pattern

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (stable packages; rate-limit-redis 4.x API unlikely to change)

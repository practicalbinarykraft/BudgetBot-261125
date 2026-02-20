# Phase 2: Bug Fixes & Stability - Research

**Researched:** 2026-02-20
**Domain:** Node.js/Express bug fixes — error handling, JWT error types, silent failures
**Confidence:** HIGH

<user_constraints>
## User Constraints (from Phase 1 decisions and STATE.md)

### Locked Decisions

#### Coding Principles (inherited from Phase 1)
- **Junior-friendly code** — simple, explicit, no magic
- **Files under 200 lines** — one file = one responsibility
- **Code reused 2+ times -> extract to separate function**
- **TDD** — write tests first, then implementation. For each bug fix: write failing test BEFORE changing code.

#### TDD Approach for Bug Fixes
1. Write a test that FAILS against current (buggy) behavior
2. Confirm the test is red
3. Fix the code
4. Confirm the test is green
5. Run the full test suite

#### Prior Architecture Decisions (from STATE.md)
- PASSWORD_RESET_SECRET separate from SESSION_SECRET
- createRedisStore extracted to server/middleware/lib/
- vi.doMock for per-test env mocking (not vi.mock — it's hoisted)

### Claude's Discretion
- Exact wording of error messages (as long as they are specific and informative)
- Whether to add `logInfo` or just `logError` for credits fallback (logError is appropriate)
- Order of bug fixes within the phase

### Deferred Ideas (OUT OF SCOPE)
- Email service for password recovery (v2 — SEC-V2-03)
- Refresh token rotation (v2)
- Token revocation (v2)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BUG-01 | Password recovery корректно сообщает об отсутствии email-сервиса вместо ложного `method: 'email'` | Found at `server/services/password-recovery.service.ts` lines 199-207: when user has email but Telegram send fails, the code returns `{ success: false, method: 'email', error: '...' }`. Bug: `method: 'email'` is misleading — no email service exists. Fix: return `method: 'none'` instead. One-line fix. |
| BUG-02 | Сервисы возвращают конкретные ошибки вместо silent null — `transaction.service.ts`, `api-key-manager.ts`, `admin-users.service.ts` | Found 3 silent nulls: (1) `transaction.service.ts:65` — `getTransaction()` returns null with no log when transaction exists but belongs to wrong user (authorization failure); (2) `api-key-manager.ts:108` — `checkUserOwnKey()` returns null silently when no BYOK key found (this is expected behavior, NOT a bug — internal function); (3) `admin-users.service.ts:241` — `getUserDetails()` returns null when user not found (already has logError in outer catch). Assessment: only transaction.service.ts:65 is a meaningful silent null for auth failures — the others are legitimate null returns for "not found" scenarios. |
| BUG-03 | `getUserDetails()` credits calculation — добавлено конкретное логирование ошибок вместо silent zero fallback | Found at `admin-users.service.ts` lines 288-319: the `catch` block for `getCreditBalance()` uses `logDebug` instead of `logError`, silently returning zeros. Also has excessive `logDebug` calls (lines 220, 289-293, 303, 311-312, 321, 348-357). Fix: replace `logDebug` with `logError` in the catch block; keep the zero fallback (correct behavior — don't crash getUserDetails if credits fail); remove redundant debug logs. |
| BUG-04 | JWT error handling в `mobile-auth.ts` покрывает все типы ошибок (не только JsonWebTokenError, TokenExpiredError) | Found at `server/middleware/mobile-auth.ts` lines 65-73. The jsonwebtoken library exports 3 error classes: `JsonWebTokenError`, `TokenExpiredError`, and `NotBeforeError`. Currently only the first two are caught. Fix: add `NotBeforeError` handling. Note: `TokenExpiredError` extends `JsonWebTokenError`, so the order matters — check `TokenExpiredError` first, then `NotBeforeError`, then `JsonWebTokenError` as fallback. |
</phase_requirements>

## Summary

Phase 2 fixes four specific, well-localized bugs. The codebase is already well-structured (junior-friendly, services/middleware separation, logError/logInfo/logDebug utilities). All four bugs are small, targeted changes to existing files — none require architectural changes or new files.

**BUG-01** is the most misleading: `password-recovery.service.ts` returns `method: 'email'` when no email service exists, which could confuse callers into thinking email recovery was attempted. It's a one-line fix changing `'email'` to `'none'`.

**BUG-02** requires careful scoping. The three files named in the requirement each have "null returns", but not all are bugs: `api-key-manager.ts:108` returns null for "no BYOK key found" — this is the correct behavior for an internal lookup function. `admin-users.service.ts:241` returns null for "user not found" — also correct, and the outer catch already has `logError`. The actionable fix is `transaction.service.ts:65`, where returning `null` silently for an authorization failure (user tries to access another user's transaction) loses context. Adding `logInfo` or `logDebug` with userId and transactionId clarifies the authorization denial in logs.

**BUG-03** is purely a logging quality issue: the credits catch block in `getUserDetails()` uses `logDebug` (which is invisible at default log level) instead of `logError`. The zero fallback behavior is correct — don't let a credits DB failure crash the entire getUserDetails call. The fix: replace `logDebug` in the catch with `logError`, and prune the excessive debug log statements.

**BUG-04** is the most clear-cut: `jwt.NotBeforeError` is a valid JWT error when a token is used before its `nbf` (not-before) claim. It extends `JsonWebTokenError` in the jsonwebtoken library but can be caught independently for a more specific error message. Currently it falls through to `next(error)` as an unhandled error, causing 500s instead of 401s.

**Primary recommendation:** Fix all four bugs using TDD. Write one test file per bug (or per service), confirm red, apply fix, confirm green. Total scope: 4 small file edits + 4 new test cases.

## Standard Stack

### Core (already installed — no new dependencies needed)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| jsonwebtoken | 9.x | JWT signing/verification | Already used in mobile-auth.ts |
| vitest | 4.x | Test runner | Already configured |
| winston | 3.x | Logging (logError, logInfo, logDebug) | Already in server/lib/logger.ts |

**No new npm packages needed for this phase.**

### JWT Error Hierarchy (HIGH confidence — verified from live node_modules)

The `jsonwebtoken` package exports exactly 3 error classes:
- `jwt.JsonWebTokenError` — base class for all JWT errors (invalid signature, malformed)
- `jwt.TokenExpiredError` — extends JsonWebTokenError (token past `exp` claim)
- `jwt.NotBeforeError` — extends JsonWebTokenError (token used before `nbf` claim)

**Critical ordering:** `TokenExpiredError` and `NotBeforeError` both extend `JsonWebTokenError`. If you check `instanceof jwt.JsonWebTokenError` first, it matches all three. Always check the subclasses first.

**Correct order:**
```typescript
if (error instanceof jwt.TokenExpiredError) {
  return res.status(401).json({ error: "Token expired" } as any);
}
if (error instanceof jwt.NotBeforeError) {
  return res.status(401).json({ error: "Token not yet valid" } as any);
}
if (error instanceof jwt.JsonWebTokenError) {
  return res.status(401).json({ error: "Invalid token" } as any);
}
next(error);
```

## Architecture Patterns

### Existing Project Structure (relevant files)

```
server/
├── middleware/
│   ├── __tests__/            # admin-auth, cors, rate-limit, rate-limiter, security-headers
│   │                          # NO mobile-auth test exists yet
│   └── mobile-auth.ts         # BUG-04: JWT error handling
├── services/
│   ├── __tests__/            # Many test files exist
│   │   ├── password-recovery.service.test.ts  # BUG-01 tests partially here
│   │   ├── admin-users.service.test.ts        # BUG-02/03 tests (currently trivial)
│   │   └── transaction.service.test.ts        # BUG-02 tests exist
│   ├── password-recovery.service.ts           # BUG-01
│   ├── transaction.service.ts                 # BUG-02
│   ├── api-key-manager.ts                     # BUG-02 (assess only — likely not a bug)
│   ├── admin-users.service.ts                 # BUG-02 + BUG-03
│   └── credits.service.ts                     # Used by getUserDetails
└── lib/
    └── logger.ts              # logError, logInfo, logWarning, logDebug exports
```

### TDD Pattern Used in Phase 1 (matches project CLAUDE.md)

```typescript
// Source: server/services/__tests__/password-recovery.security.test.ts (Phase 1)
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../some-dependency', () => ({
  someFunction: vi.fn(),
}));

describe('ServiceName', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does the expected thing', () => {
    // arrange -> act -> assert
  });
});
```

**For per-test env mocking** (vi.doMock pattern — confirmed in STATE.md):
```typescript
// Use vi.doMock (not vi.mock) when you need per-test env overrides
// vi.mock is hoisted to file top; vi.doMock is not
beforeEach(() => {
  vi.resetModules();
});

it('test with specific env', async () => {
  vi.doMock('../../lib/env', () => ({ env: { SOME_VAR: 'value' } }));
  const { myFunction } = await import('../my-service');
  // ...
});
```

### Pattern: Silent Null Logging

When a function returns null for an authorization-related reason (not just "not found"), add a log:

```typescript
// BEFORE (silent)
async getTransaction(id: number, userId: number) {
  const transaction = await transactionRepository.getTransactionById(id);
  if (!transaction || transaction.userId !== userId) {
    return null;
  }
  return transaction;
}

// AFTER (with context logging)
async getTransaction(id: number, userId: number) {
  const transaction = await transactionRepository.getTransactionById(id);
  if (!transaction) {
    return null;
  }
  if (transaction.userId !== userId) {
    logInfo('Transaction access denied: userId mismatch', { transactionId: id, requestingUserId: userId });
    return null;
  }
  return transaction;
}
```

**Note:** Routes already handle the null correctly (return 404). This is purely a logging improvement for observability.

### Pattern: Error Logging in Catch Blocks

```typescript
// BEFORE (silent zero fallback)
} catch (error) {
  logDebug('[DEBUG] ERROR getting credits', { error: error instanceof Error ? error.message : String(error) });
  creditsBalance = { totalGranted: 0, totalUsed: 0, messagesRemaining: 0 };
}

// AFTER (explicit error logging with zero fallback kept)
} catch (error) {
  logError('Failed to get credit balance for user', error as Error, { userId });
  // Keep zero fallback — credits failure should not crash getUserDetails
  creditsBalance = { totalGranted: 0, totalUsed: 0, messagesRemaining: 0 };
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT error detection | Custom regex/string matching | `instanceof jwt.TokenExpiredError` etc. | Library error classes are reliable; string matching on error.message is fragile |
| Error logging | console.log, console.error | `logError` from `server/lib/logger.ts` | Already handles metadata, stack traces, production JSON format |
| Test mocking | Custom stub objects | `vi.mock`, `vi.fn()`, `vi.doMock` | Vitest's built-in mock system integrates with the test runner |

**Key insight:** All the infrastructure for error handling and logging is already in place. These bugs are about using the existing tools correctly, not building new ones.

## Common Pitfalls

### Pitfall 1: BUG-01 — Changing method type but forgetting to update the TypeScript union

**What goes wrong:** The `RecoveryRequestResult` interface has `method: 'telegram' | 'email' | 'none'`. When fixing BUG-01, you only need to change the returned value (from `'email'` to `'none'`), not the type — because `'none'` is already in the union. But if someone incorrectly removes `'email'` from the union, it breaks other callers.

**How to avoid:** Keep the `'email'` option in the interface (for future use when email service is added). Only change the returned value at line 204.

**Warning signs:** TypeScript errors about string literal types after the change.

### Pitfall 2: BUG-02 — Over-fixing api-key-manager.ts

**What goes wrong:** `checkUserOwnKey()` in `api-key-manager.ts` returns `null` when the user has no BYOK key. This is not a bug — it's an internal function used only by `getApiKey()`, which handles the null correctly (falls through to credits check). Adding error logging here would be misleading noise.

**How to avoid:** Scope BUG-02 fixes to `transaction.service.ts` and the authorization denial case. The `api-key-manager.ts:108` null is intentional design.

**Warning signs:** If you add `logError` in `checkUserOwnKey`, every API call without a BYOK key would generate an error log — which is most users.

### Pitfall 3: BUG-03 — Removing the zero fallback instead of fixing the log level

**What goes wrong:** Seeing the catch block with zero fallback and thinking "this hides errors, let's throw instead." But `getUserDetails()` is an admin function that aggregates many DB queries — crashing the entire call because credits lookup failed would be worse than returning zeros.

**How to avoid:** Keep the zero fallback. Only change `logDebug` -> `logError` in the catch block. The BUG-03 requirement specifically says "добавлено конкретное логирование ошибок вместо silent zero" — the zero is correct, the silence is the bug.

**Warning signs:** Tests that mock `getCreditBalance` to throw — getUserDetails should still return a result, just with zeros for credits.

### Pitfall 4: BUG-04 — Wrong order of JWT error checks

**What goes wrong:** Checking `instanceof jwt.JsonWebTokenError` before `instanceof jwt.TokenExpiredError`. Since `TokenExpiredError` extends `JsonWebTokenError`, the base class check would always match first, returning "Invalid token" even for expired tokens.

**How to avoid:** Always check subclasses before parent classes. Order: `TokenExpiredError` -> `NotBeforeError` -> `JsonWebTokenError`.

**Warning signs:** Test that creates an expired token returns "Invalid token" instead of "Token expired."

### Pitfall 5: BUG-03 — Pruning too many logDebug calls changes observable behavior

**What goes wrong:** The requirement says to fix the error logging in the catch block. The excessive `logDebug` statements are noisy at DEBUG log level, but they're not causing bugs. Removing them all in one PR may make the diff larger than needed and could remove diagnostic info.

**How to avoid:** Focus on the catch block (`logDebug -> logError`). The logDebug calls outside the catch are addressed in QUAL-07 (Phase 3), not here. Check the requirements — BUG-03 is specifically about the credits catch block.

**Warning signs:** If the PR touches lines 220, 289-293, 303, 321, 348-357 extensively — that's Phase 3 scope.

## Code Examples

Verified patterns from the existing codebase:

### Correct JWT Error Handling Pattern

```typescript
// Source: server/middleware/mobile-auth.ts (current — missing NotBeforeError)
// Fixed version:
} catch (error) {
  if (error instanceof jwt.TokenExpiredError) {
    return res.status(401).json({ error: "Token expired" } as any);
  }
  if (error instanceof jwt.NotBeforeError) {
    return res.status(401).json({ error: "Token not yet valid" } as any);
  }
  if (error instanceof jwt.JsonWebTokenError) {
    return res.status(401).json({ error: "Invalid token" } as any);
  }
  next(error);
}
```

### Correct logError Usage Pattern

```typescript
// Source: server/services/admin-users.service.ts (the outer catch, already correct)
} catch (error) {
  logError('Failed to get user details', error as Error, { userId });
  throw error;
}

// Pattern for BUG-03 credits catch:
} catch (error) {
  logError('Failed to get credit balance in getUserDetails', error as Error, { userId });
  creditsBalance = { totalGranted: 0, totalUsed: 0, messagesRemaining: 0 };
}
```

### Correct Password Recovery Return for BUG-01

```typescript
// Source: server/services/password-recovery.service.ts lines 199-207
// BEFORE (buggy):
if (user.email) {
  return {
    success: false,
    method: 'email',           // BUG: misleading — no email service
    error: 'Email recovery not yet implemented. Please use Telegram.',
  };
}

// AFTER (fixed):
if (user.email) {
  return {
    success: false,
    method: 'none',            // FIXED: honest — no recovery method works
    error: 'Email recovery not yet implemented. Please link your Telegram account.',
  };
}
```

### Test Pattern for Mobile Auth (vitest)

```typescript
// New file: server/middleware/__tests__/mobile-auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

vi.mock('../../repositories/user.repository', () => ({
  userRepository: {
    getUserById: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
    JsonWebTokenError: class JsonWebTokenError extends Error {},
    TokenExpiredError: class TokenExpiredError extends Error {},
    NotBeforeError: class NotBeforeError extends Error {},
  },
}));
```

**Note on mocking JWT error classes:** The real `jwt.NotBeforeError` has a `date` property. When mocking for tests, extend `Error` is sufficient for `instanceof` checks to work — but only if you set up the prototype chain correctly. A cleaner approach is to use the real `jsonwebtoken` package and create actual error instances by calling `jwt.verify` with manipulated tokens.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `method: 'email'` for unimplemented path | `method: 'none'` with honest error | Phase 2 | Callers get truthful feedback |
| `logDebug` in error catch blocks | `logError` with full error context | Phase 2 | Errors visible at default log level |
| Silent null from authorization failures | Null + `logInfo` context | Phase 2 | Observability for auth denials |
| 2-type JWT error handling | 3-type JWT error handling | Phase 2 | NotBeforeError returns 401 not 500 |

## Open Questions

1. **BUG-02 scope: is `admin-users.service.ts:241` (getUserDetails returns null) actually a bug?**
   - What we know: The function returns `null` when user not found, and the route layer handles it as 404.
   - What's unclear: The requirement says "admin-users.service.ts" is in scope — but the null at line 241 is for a legitimate "user not found" case with proper error logging in the outer catch.
   - Recommendation: No change needed for the null at 241. The issue is BUG-03 (credits catch uses logDebug). If the planner wants to add a `logInfo` at line 241, it's harmless but not strictly necessary.

2. **BUG-02 scope: what exactly needs fixing in transaction.service.ts?**
   - What we know: `getTransaction()` returns null for both "not found" and "wrong user" cases. Routes handle both as 404.
   - What's unclear: Should we differentiate the two cases? Or just add logging to the authorization failure case?
   - Recommendation: Split the condition and add `logInfo` for the authorization denial (wrong user). Keep combined null for "not found" — that's expected behavior.

## Sources

### Primary (HIGH confidence)
- Direct file inspection: `server/middleware/mobile-auth.ts` — confirmed 2 of 3 JWT error types caught
- Direct file inspection: `server/services/password-recovery.service.ts:204` — confirmed `method: 'email'` bug
- Direct file inspection: `server/services/admin-users.service.ts:311-312` — confirmed logDebug in catch
- Direct file inspection: `server/services/transaction.service.ts:62-67` — confirmed silent null
- Live node inspection: `node -e "const jwt = require('jsonwebtoken'); console.log(Object.keys(jwt))"` — confirmed 3 error classes: JsonWebTokenError, NotBeforeError, TokenExpiredError
- `.planning/STATE.md` — confirmed locked decisions (TDD, <200 LOC, vi.doMock)
- `.planning/REQUIREMENTS.md` — confirmed BUG-01..BUG-04 requirements

### Secondary (MEDIUM confidence)
- `server/services/__tests__/admin-users.service.test.ts` — confirms test coverage is minimal (type checks only, no behavior tests)
- `server/services/__tests__/transaction.service.test.ts` — confirms null return already tested (getTransaction returns null for wrong user)
- `server/middleware/__tests__/` listing — confirms NO mobile-auth test file exists yet

### Tertiary (LOW confidence)
- None — all findings from direct code inspection

## Metadata

**Confidence breakdown:**
- Bug locations: HIGH — all four bugs verified by direct file reading and line numbers confirmed
- Fix approach: HIGH — patterns are straightforward (one-line fixes for BUG-01 and BUG-04, logging level change for BUG-03)
- BUG-02 scope: MEDIUM — some judgment required about which null returns are truly bugs vs. design; api-key-manager.ts null is intentional
- Test patterns: HIGH — Phase 1 TDD patterns established and confirmed working

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (stable codebase, no fast-moving dependencies)

---
phase: 02-bug-fixes-stability
plan: "02"
subsystem: server
tags: [bug-fix, tdd, logging, jwt, auth, credits]
dependency_graph:
  requires: []
  provides: [BUG-03-fix, BUG-04-fix]
  affects: [server/services/admin-users.service.ts, server/middleware/mobile-auth.ts]
tech_stack:
  added: []
  patterns: [TDD red-green, vi.spyOn for module method mocking, vi.hoisted for mock factories]
key_files:
  created:
    - server/middleware/__tests__/mobile-auth.test.ts
  modified:
    - server/services/admin-users.service.ts
    - server/services/__tests__/admin-users.service.test.ts
    - server/middleware/mobile-auth.ts
decisions:
  - "Use vi.spyOn(jwt, 'verify') instead of vi.mock('jsonwebtoken') to avoid ESM module boundary instanceof failures"
  - "Check JWT error subclasses before parent class: TokenExpiredError -> NotBeforeError -> JsonWebTokenError"
metrics:
  duration: 7min
  completed: 2026-02-20
  tasks_completed: 2
  files_changed: 4
requirements:
  - BUG-03
  - BUG-04
---

# Phase 02 Plan 02: Bug Fixes — Credits Error Logging and JWT NotBeforeError Summary

One-liner: Fixed logDebug->logError in credits catch block for production visibility, and corrected JWT error handling to add NotBeforeError and fix instanceof check order.

## Objective

Fix two production bugs using TDD:
1. BUG-03: Credit balance errors in `getUserDetails` silently logged at debug level, invisible in production
2. BUG-04: `mobile-auth` JWT catch block missing `NotBeforeError` and had wrong `instanceof` check order causing early match on parent class

## What Was Built

### BUG-03: Credits Error Logging Fix

**File:** `server/services/admin-users.service.ts`

**Before:**
```typescript
} catch (error) {
  logDebug('[DEBUG] getUserDetails ERROR getting credits', { error: error instanceof Error ? error.message : String(error) });
  logDebug('[DEBUG] getUserDetails ERROR stack', { stack: error instanceof Error ? error.stack : 'no stack' });
  creditsBalance = { totalGranted: 0, totalUsed: 0, messagesRemaining: 0 };
}
```

**After:**
```typescript
} catch (error) {
  logError('Failed to get credit balance in getUserDetails', error as Error, { userId });
  creditsBalance = { totalGranted: 0, totalUsed: 0, messagesRemaining: 0 };
}
```

Zero credits fallback preserved. Errors now visible at default log level in production.

### BUG-04: JWT NotBeforeError and Error Check Order Fix

**File:** `server/middleware/mobile-auth.ts`

**Before (wrong):**
```typescript
if (error instanceof jwt.JsonWebTokenError) { // catches ALL jwt errors!
  return res.status(401).json({ error: "Invalid token" });
}
if (error instanceof jwt.TokenExpiredError) { // never reached
  return res.status(401).json({ error: "Token expired" });
}
```

**After (correct):**
```typescript
if (error instanceof jwt.TokenExpiredError) {  // subclass first
  return res.status(401).json({ error: "Token expired" });
}
if (error instanceof jwt.NotBeforeError) {      // subclass first
  return res.status(401).json({ error: "Token not yet valid" });
}
if (error instanceof jwt.JsonWebTokenError) {   // base class last
  return res.status(401).json({ error: "Invalid token" });
}
next(error); // non-JWT errors pass through
```

## Tests Written

### BUG-03 Test (`admin-users.service.test.ts`)

Added to existing test file:
- `'logs credit balance error with logError and returns zero credits (BUG-03)'`
  - Mocks `getCreditBalance` to throw `Error('Redis connection failed')`
  - Asserts `logError` called with `'credit balance'` substring, error instance, `{ userId }`
  - Asserts `result.credits.messagesRemaining === 0` (zero fallback preserved)

**TDD flow:** RED (logError not called, 0 calls) -> GREEN (logError called after fix)

### BUG-04 Tests (`mobile-auth.test.ts`) — NEW FILE

4 test cases:
1. `'returns 401 with "Token expired" for TokenExpiredError (BUG-04)'`
2. `'returns 401 with "Token not yet valid" for NotBeforeError (BUG-04)'`
3. `'returns 401 with "Invalid token" for generic JsonWebTokenError (BUG-04)'`
4. `'calls next(error) for non-JWT errors'`

**TDD flow:** RED (test 2 returned "Invalid token", test 4 returned nothing) -> GREEN (all 4 pass after fix)

## Verification

- `npx vitest run server/services/__tests__/admin-users.service.test.ts` — 9/9 pass
- `npx vitest run server/middleware/__tests__/mobile-auth.test.ts` — 4/4 pass
- `npx tsc --noEmit` — no errors
- Full suite: 622 pass (6 failures are known pre-existing: notification.service 3, password-reset.service 2, register-miniapp isolation issue 3 when run together)

## Deviations from Plan

### Auto-fixed Issues

None.

### Implementation Notes

**Mock Strategy for BUG-04 tests:**

The plan suggested `vi.mock('jsonwebtoken')` with `vi.hoisted`. This approach was attempted but failed because `TokenExpiredError instanceof` checks in the production code's catch block returned false for error instances created with the mocked module's classes — a known ESM module boundary issue where the class reference from the mock factory differs from the class reference in the mocked import.

**Solution used:** `vi.spyOn(jwt, 'verify')` — spying directly on the real `jwt.verify` method. The production code's `verifyMobileToken` calls `jwt.verify(token, JWT_SECRET)`. The spy intercepts this call. Since both test and production code use the SAME `jwt` import (real jsonwebtoken), error class references are identical and `instanceof` checks work correctly.

**Tracked as:** `[Rule 1 - Bug] Fixed test mock strategy to use vi.spyOn for jwt.verify instead of vi.mock factory`

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 (BUG-03) | e3015fc | fix(02-02): use logError for credit balance failure in getUserDetails |
| Task 2 (BUG-04) | 144464e | fix(02-02): fix JWT error handling in mobile-auth — add NotBeforeError, correct instanceof order |

## Key Decisions

1. `vi.spyOn(jwt, 'verify')` over `vi.mock('jsonwebtoken')` — avoids ESM module boundary instanceof failures
2. JWT error check order: subclasses before parent (TokenExpiredError, NotBeforeError before JsonWebTokenError)

## Self-Check: PASSED

Files exist:
- FOUND: server/services/admin-users.service.ts
- FOUND: server/services/__tests__/admin-users.service.test.ts
- FOUND: server/middleware/mobile-auth.ts
- FOUND: server/middleware/__tests__/mobile-auth.test.ts

Commits exist:
- FOUND: e3015fc
- FOUND: 144464e

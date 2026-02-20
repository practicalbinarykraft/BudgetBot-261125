---
phase: 02-bug-fixes-stability
verified: 2026-02-20T12:00:00Z
status: passed
score: 8/8 must-haves verified
---

# Phase 2: Bug Fixes & Stability Verification Report

**Phase Goal:** Исправить известные баги, убрать silent failures. После этой фазы приложение стабильно и предсказуемо.
**Verified:** 2026-02-20
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Password recovery for email-only user returns `method: 'none'`, not `'email'` | VERIFIED | `password-recovery.service.ts` lines 203-207: `method: 'none'` returned when email recovery fallback hit |
| 2 | Transaction access by wrong user logs authorization denial with context | VERIFIED | `transaction.service.ts` lines 67-69: `logInfo('Transaction access denied: userId mismatch', { transactionId: id, requestingUserId: userId })` |
| 3 | Transaction not found returns null silently (expected behavior preserved) | VERIFIED | `transaction.service.ts` lines 63-66: separate `if (!transaction) { return null; }` without logging |
| 4 | Credits calculation error in getUserDetails is logged with `logError`, not `logDebug` | VERIFIED | `admin-users.service.ts` line 311: `logError('Failed to get credit balance in getUserDetails', error as Error, { userId })` |
| 5 | getUserDetails still returns zero credits (not crash) when getCreditBalance throws | VERIFIED | `admin-users.service.ts` lines 312-318: zero fallback `creditsBalance` preserved in catch block |
| 6 | JWT NotBeforeError returns 401 with 'Token not yet valid' message | VERIFIED | `mobile-auth.ts` lines 69-71: `instanceof jwt.NotBeforeError` check present, returns 401 |
| 7 | JWT TokenExpiredError returns 401 with 'Token expired' (checked before base class) | VERIFIED | `mobile-auth.ts` lines 66-68: `instanceof jwt.TokenExpiredError` checked first (subclass before parent) |
| 8 | JWT JsonWebTokenError returns 401 with 'Invalid token' as fallback | VERIFIED | `mobile-auth.ts` lines 72-74: `instanceof jwt.JsonWebTokenError` checked last as fallback |

**Score:** 8/8 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `server/services/password-recovery.service.ts` | Honest recovery method response (`method: 'none'`) | VERIFIED | Line 205: `method: 'none'` in email fallback block; `'email'` kept in type union for future v2 use |
| `server/services/transaction.service.ts` | Authorization denial logging for getTransaction | VERIFIED | Line 9: `logInfo` imported; line 68: `logInfo` called with transactionId + requestingUserId |
| `server/services/__tests__/password-recovery.service.test.ts` | Test for BUG-01 fix | VERIFIED | Lines 281-346: `'returns method "none" when user has email but no Telegram (BUG-01)'` test present; uses `vi.doMock` + `vi.resetModules` for DB-free isolation |
| `server/services/__tests__/transaction.service.test.ts` | Test for BUG-02 authorization denial logging | VERIFIED | Lines 150-168: `'logs authorization denial when user accesses another user transaction (BUG-02)'` test; asserts `logInfo` called with `{ transactionId: 1, requestingUserId: 123 }` |
| `server/services/admin-users.service.ts` | `logError` in credits catch block instead of `logDebug` | VERIFIED | Line 311: `logError('Failed to get credit balance in getUserDetails', error as Error, { userId })` |
| `server/middleware/mobile-auth.ts` | Complete JWT error handling with all 3 error types | VERIFIED | Lines 66-75: TokenExpiredError, NotBeforeError, JsonWebTokenError all handled in correct order |
| `server/services/__tests__/admin-users.service.test.ts` | Test for BUG-03 credits error logging | VERIFIED | Lines 77-150: `'logs credit balance error with logError and returns zero credits (BUG-03)'` test present |
| `server/middleware/__tests__/mobile-auth.test.ts` | Tests for all JWT error types including NotBeforeError | VERIFIED | NEW file created; 4 test cases covering TokenExpiredError, NotBeforeError, JsonWebTokenError, non-JWT errors |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `server/services/password-recovery.service.ts` | `RecoveryRequestResult` type | `method: 'none'` value | WIRED | Lines 203-207, 211-215, 219-223: all return paths yield `method: 'none'`; `'email'` remains in type union only |
| `server/services/transaction.service.ts` | `server/lib/logger.ts` | `logInfo` import | WIRED | Line 9: `import { logError, logInfo } from '../lib/logger'`; line 68: `logInfo(...)` called in authorization denial branch |
| `server/services/admin-users.service.ts` | `server/lib/logger.ts` | `logError` in catch block | WIRED | Line 17: `import { logError, logDebug } from '../lib/logger'`; line 311: `logError(...)` called in `getCreditBalance` catch |
| `server/middleware/mobile-auth.ts` | `jsonwebtoken` | `instanceof` checks for all 3 error classes | WIRED | Lines 66-74: `jwt.TokenExpiredError` -> `jwt.NotBeforeError` -> `jwt.JsonWebTokenError` in correct subclass-first order |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| BUG-01 | 02-01-PLAN.md | Password recovery корректно сообщает об отсутствии email-сервиса вместо ложного `method: 'email'` | SATISFIED | `password-recovery.service.ts:205` returns `method: 'none'` in email fallback; unit test (`BUG-01`) verifies this without DB |
| BUG-02 | 02-01-PLAN.md | Сервисы возвращают конкретные ошибки вместо silent null — `transaction.service.ts`, `api-key-manager.ts`, `admin-users.service.ts` | SATISFIED | Research confirmed scope: only `transaction.service.ts` authorization denial was actionable. `api-key-manager.ts` null is intentional design (internal function); `admin-users.service.ts:241` null already had proper error logging in outer catch. Fix: `getTransaction` logs authorization denial with `logInfo` + context |
| BUG-03 | 02-02-PLAN.md | `getUserDetails()` credits calculation — добавлено конкретное логирование ошибок вместо silent zero fallback | SATISFIED | `admin-users.service.ts:311` uses `logError` with `{ userId }` context in catch block; zero fallback preserved |
| BUG-04 | 02-02-PLAN.md | JWT error handling в `mobile-auth.ts` покрывает все типы ошибок (не только JsonWebTokenError, TokenExpiredError) | SATISFIED | `mobile-auth.ts` lines 66-74 handle all 3 JWT error types in correct order; new test file with 4 cases confirms behavior |

**BUG-02 scope note:** REQUIREMENTS.md lists `api-key-manager.ts` and `admin-users.service.ts` alongside `transaction.service.ts`. Research (02-RESEARCH.md, confirmed in plan task description) determined the `api-key-manager.ts` null is intentional design (not a bug), and `admin-users.service.ts:241` already had proper error logging. The requirement was interpreted correctly and narrowed to the actionable case: authorization denial in `transaction.service.ts`. This interpretation is consistent with the ROADMAP success criterion: "Ни один сервис не возвращает `null` без контекста ошибки" — the authorization denial now has context.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `server/services/password-recovery.service.ts` | 200 | `TODO: Implement email sending when email service is added` | Info | Intentional placeholder — documents v2 email service scope. Not a bug. The code correctly returns `method: 'none'` today. |

No blocker or warning anti-patterns found. The TODO at line 200 is intentional design documentation consistent with the PLAN's explicit instruction: "Do NOT remove `'email'` from the TypeScript union type — it will be used when email service is implemented (v2)."

---

### Human Verification Required

None required. All truths are verifiable programmatically via grep and file inspection:

- Bug fixes are code-level changes (not visual/UX)
- Test files exist and contain specific assertions for each bug
- No external service integrations tested in this phase
- No real-time behavior requiring observation

---

## Gaps Summary

No gaps found. All 8 must-haves are VERIFIED. All 4 requirements (BUG-01, BUG-02, BUG-03, BUG-04) are SATISFIED with evidence in the actual codebase.

**Phase goal achieved:** The application is now stable and predictable with respect to the four known bugs:

1. **BUG-01 fixed:** API callers get honest feedback when email recovery is unavailable — no more misleading `method: 'email'` response
2. **BUG-02 fixed:** Authorization denials in `getTransaction` are now logged with full context — no more silent null for security-relevant events
3. **BUG-03 fixed:** Credit balance errors in `getUserDetails` are logged at `logError` level, visible in production logs — zero fallback preserved to prevent cascading failures
4. **BUG-04 fixed:** All three JWT error types handled in correct instanceof order — `NotBeforeError` no longer falls through to unhandled 500 errors

---

_Verified: 2026-02-20_
_Verifier: Claude (gsd-verifier)_

---
phase: 02-bug-fixes-stability
plan: 01
subsystem: auth
tags: [password-recovery, transactions, logging, tdd, vitest]

# Dependency graph
requires:
  - phase: 01-security-audit-fixes
    provides: "Password recovery service with HMAC reset tokens; transaction service with authorization"
provides:
  - "BUG-01 fixed: password-recovery.service.ts returns method 'none' (not 'email') for email-only users with no working Telegram"
  - "BUG-02 fixed: transaction.service.ts logs authorization denial with transactionId and requestingUserId context"
  - "Unit tests for both bugs using TDD (RED -> GREEN) with module isolation"
affects: [03-code-quality, getTransaction callers, password recovery API consumers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "vi.doMock + vi.resetModules for per-test module isolation without DB dependency"
    - "Split compound null-check into two conditions for fine-grained observability"

key-files:
  created: []
  modified:
    - server/services/password-recovery.service.ts
    - server/services/__tests__/password-recovery.service.test.ts
    - server/services/transaction.service.ts
    - server/services/__tests__/transaction.service.test.ts

key-decisions:
  - "Used vi.doMock + vi.resetModules for BUG-01 unit test to avoid DB dependency — enables always-run tests"
  - "Kept 'email' in RecoveryRequestResult type union for future use (v2 email service)"
  - "Split getTransaction compound condition to log only authorization denials, not 'not found' (correct silent behavior)"

patterns-established:
  - "Authorization denial logging pattern: logInfo with transactionId + requestingUserId context"
  - "Honest API responses: placeholder code paths should return 'none'/'not implemented' states, not future-state values"

requirements-completed: [BUG-01, BUG-02]

# Metrics
duration: 7min
completed: 2026-02-20
---

# Phase 2 Plan 01: Service Layer Bug Fixes Summary

**BUG-01 and BUG-02 fixed via TDD: password recovery now returns honest 'none' method for email-only users; transaction authorization denials now log with full context using logInfo**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-20T03:19:08Z
- **Completed:** 2026-02-20T03:26:12Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- BUG-01: `requestPasswordRecovery` no longer returns misleading `method: 'email'` when email service is not implemented; returns `method: 'none'` with honest error message
- BUG-02: `getTransaction` now calls `logInfo('Transaction access denied: userId mismatch', { transactionId, requestingUserId })` when authorization check fails
- Both fixes backed by always-running unit tests using TDD (RED -> GREEN commits)
- TypeScript compiles cleanly (`npx tsc --noEmit` passes)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED — BUG-01 test** - `6a6f24a` (test)
2. **Task 1 GREEN — BUG-01 fix** - `d41c31a` (fix)
3. **Task 2 RED — BUG-02 test** - `d03a38a` (test)
4. **Task 2 GREEN — BUG-02 fix** - `6d7dc9a` (fix)

_Note: TDD tasks have separate RED (test) and GREEN (fix) commits per plan._

## Files Created/Modified

- `server/services/password-recovery.service.ts` — Changed `method: 'email'` to `method: 'none'` in email fallback; updated error message to be honest about status
- `server/services/__tests__/password-recovery.service.test.ts` — Added BUG-01 unit test using vi.doMock + vi.resetModules for DB-free isolation; added DB mock imports
- `server/services/transaction.service.ts` — Added `logInfo` import; split compound condition in `getTransaction` to add authorization denial logging
- `server/services/__tests__/transaction.service.test.ts` — Added vi.mock for logger; imported logInfo; added BUG-02 test asserting logInfo called with context

## Decisions Made

- **vi.doMock for BUG-01 unit test:** The existing password-recovery tests are integration tests that are skipped when DB is not available. The new BUG-01 test uses `vi.doMock` + `vi.resetModules` to mock the DB inline and always run without a database, providing permanent regression coverage.
- **'email' kept in TypeScript type union:** The plan explicitly required keeping `'email'` in `RecoveryRequestResult.method` type union for future v2 email service implementation. Only the returned value was changed.
- **Split compound condition:** The original `if (!transaction || transaction.userId !== userId)` was split into two conditions so the "not found" case stays silent (correct behavior) while the "wrong user" case logs with context.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — both fixes were straightforward. Pre-existing test failures in `notification.service.test.ts`, `password-reset.service.test.ts`, `register-miniapp.test.ts`, and `telegram-webapp-auth.test.ts` were confirmed as pre-existing before any changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- BUG-01 and BUG-02 are fixed and tested
- Remaining bugs in phase 02: BUG-03 (already fixed in prior commit e3015fc), BUG-04 (mobile auth JWT error handling)
- No blockers for next plan

## Self-Check: PASSED

All files verified present. All commits verified in git log.

- FOUND: server/services/password-recovery.service.ts
- FOUND: server/services/__tests__/password-recovery.service.test.ts
- FOUND: server/services/transaction.service.ts
- FOUND: server/services/__tests__/transaction.service.test.ts
- FOUND: .planning/phases/02-bug-fixes-stability/02-01-SUMMARY.md
- FOUND: 6a6f24a (test - BUG-01 RED)
- FOUND: d41c31a (fix - BUG-01 GREEN)
- FOUND: d03a38a (test - BUG-02 RED)
- FOUND: 6d7dc9a (fix - BUG-02 GREEN)

---
*Phase: 02-bug-fixes-stability*
*Completed: 2026-02-20*

---
phase: 01-security-audit-fixes
plan: 02
subsystem: infra
tags: [helmet, cors, hsts, security-headers, socket.io, vitest, tdd]

# Dependency graph
requires: []
provides:
  - "HSTS header enabled in production with 1-year maxAge, includeSubDomains, preload"
  - "localhost:5000 removed from CORS ALLOWED_ORIGINS in all environments"
  - "Socket.IO confirmed using same ALLOWED_ORIGINS as Express CORS"
  - "TDD tests guarding HSTS and CORS origin behavior"
affects: [app-store-preparation, build]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "isProduction guard for production-only security headers (HSTS)"
    - "Shared ALLOWED_ORIGINS export between Express CORS and Socket.IO"
    - "vi.doMock + vi.resetModules() for per-test env mocking in Vitest"
    - "Static analysis tests (readFileSync) alongside functional tests"

key-files:
  created:
    - server/middleware/__tests__/security-headers.test.ts
    - server/middleware/__tests__/cors.security.test.ts
  modified:
    - server/middleware/security-headers.ts
    - server/middleware/cors.ts

key-decisions:
  - "Use vi.doMock (not vi.mock) for dynamic mocking -- vi.mock is hoisted and cannot be called conditionally per-test"
  - "HSTS enabled with maxAge=31536000 (1yr), includeSubDomains=true, preload=true in production"
  - "localhost:5000 is the API server, not a client -- it was never a valid CORS origin"
  - "SEC-07 needed no code fix -- websocket.ts already imported ALLOWED_ORIGINS from cors.ts"

patterns-established:
  - "isProduction conditional for production-only security features"
  - "Shared origin list: add new domains to cors.ts ALLOWED_ORIGINS, both Express and Socket.IO auto-sync"

requirements-completed: [SEC-05, SEC-06, SEC-07]

# Metrics
duration: 6min
completed: 2026-02-20
---

# Phase 1 Plan 02: HSTS, CORS, and Socket.IO Security Fixes Summary

**Helmet HSTS enabled in production via isProduction guard (1yr maxAge), localhost:5000 purged from CORS origins, and Socket.IO CORS sync verified via shared ALLOWED_ORIGINS import**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-02-20T10:52:00Z
- **Completed:** 2026-02-20T10:57:00Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 4

## Accomplishments

- SEC-05: HSTS enabled in production with `maxAge: 31536000, includeSubDomains: true, preload: true` -- disabled in development to prevent browser lockout
- SEC-06: Removed `http://localhost:5000` from `ALLOWED_ORIGINS` -- port 5000 is the API server, never a valid client origin
- SEC-07: Confirmed Socket.IO already uses the same `ALLOWED_ORIGINS` exported from `cors.ts` -- removing port 5000 fixes WebSocket CORS too
- TDD test suite: 10 tests covering HSTS behavior per environment, CORS origin list, and Socket.IO sync

## Task Commits

Each task was committed atomically:

1. **Task 1: RED -- Write failing tests for HSTS, CORS, and Socket.IO CORS sync** - `446df60` (test)
2. **Task 2: GREEN -- Fix SEC-05 (HSTS), SEC-06 (CORS localhost), verify SEC-07** - `f0d42de` (feat)

_Note: TDD plan -- test commit followed by implementation commit_

## Files Created/Modified

- `server/middleware/__tests__/security-headers.test.ts` - Tests for HSTS in production vs development (3 tests)
- `server/middleware/__tests__/cors.security.test.ts` - Tests for CORS origin list and Socket.IO sync (7 tests)
- `server/middleware/security-headers.ts` - Added `isProduction` import and conditional HSTS config
- `server/middleware/cors.ts` - Removed `http://localhost:5000` from development origins push

## Decisions Made

- **vi.doMock over vi.mock for env mocking**: `vi.mock` is hoisted by Vitest to the top of the file (Babel-transform), so calling it inside a test body does not work as expected when different tests need different mock values. `vi.doMock` is not hoisted and works correctly with `vi.resetModules()` + dynamic import per-test.
- **HSTS only in production**: Enabling HSTS on HTTP (development) causes browsers to refuse future HTTP connections -- a developer lockout. The conditional guard is essential.
- **No SEC-07 fix needed**: `server/lib/websocket.ts` already imports `ALLOWED_ORIGINS` from `../middleware/cors` and passes it to Socket.IO. Fixing SEC-06 (removing port 5000) automatically fixes Socket.IO as well.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed mock res missing removeHeader for helmet**
- **Found during:** Task 1 (RED -- writing security-headers tests)
- **Issue:** Initial mock res had `setHeader` and `getHeader` but helmet also calls `res.removeHeader()` for `X-Powered-By`, causing `TypeError: res.removeHeader is not a function`
- **Fix:** Added `removeHeader: vi.fn()` to the mock res object in security-headers.test.ts
- **Files modified:** `server/middleware/__tests__/security-headers.test.ts`
- **Verification:** Tests run without TypeError
- **Committed in:** `446df60` (Task 1 commit)

**2. [Rule 1 - Bug] Switched from vi.mock to vi.doMock for per-test env mocking**
- **Found during:** Task 2 (GREEN -- tests still failing after implementation)
- **Issue:** `vi.mock` is hoisted to file top by Vitest's Babel transform, so two `vi.mock` calls in different test bodies get hoisted together and conflict. The production mock won when both tests ran.
- **Fix:** Replaced `vi.mock` with `vi.doMock` (non-hoisted) + `afterEach(() => vi.resetModules())`. This gives each test a fresh module with its own mock.
- **Files modified:** `server/middleware/__tests__/security-headers.test.ts`
- **Verification:** Both production (HSTS set) and development (HSTS absent) tests pass
- **Committed in:** `f0d42de` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug in test infrastructure)
**Impact on plan:** Both fixes were in test code only. Implementation changes were straightforward as planned. No scope creep.

## Issues Encountered

- Vitest `vi.mock` hoisting behavior: When two `vi.mock` calls appear in different test bodies, Vitest hoists both to file top which causes them to conflict. Solution: `vi.doMock` which is not hoisted and works with `vi.resetModules()`.

## User Setup Required

None - no external service configuration required. Changes are pure middleware config.

## Next Phase Readiness

- All three security requirements (SEC-05, SEC-06, SEC-07) are implemented and TDD-verified
- `security-headers.ts` and `cors.ts` are clean and ready for production
- Phase 1 Plan 03 (Redis rate limiting) can proceed independently

---
*Phase: 01-security-audit-fixes*
*Completed: 2026-02-20*

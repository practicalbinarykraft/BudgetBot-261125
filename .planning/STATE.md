# Project State

**Project:** BudgetBot — Code Audit + iOS App Store Release
**Current Phase:** 1
**Last Updated:** 2026-02-20

## Milestone: v1.0 iOS App Store Release

| Phase | Name | Status | Requirements |
|-------|------|--------|-------------|
| 1 | Security Audit & Fixes | In Progress (3/3 plans executed) | SEC-01..SEC-07 |
| 2 | Bug Fixes & Stability | Pending | BUG-01..BUG-04 |
| 3 | Code Quality | Pending | QUAL-01..QUAL-09 |
| 4 | App Store Preparation | Pending | IOS-01..IOS-14 |
| 5 | Build & TestFlight | Pending | BLD-01..BLD-05 |
| 6 | App Store Release | Pending | REL-01..REL-06 |

## Progress

- **Requirements:** 42 total, 7 complete (SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07)
- **Phases:** 6 total, 0 complete (Phase 1 all 3 plans executed, pending phase sign-off)
- **Blockers:** None

## Execution Log

| Phase | Plan | Name | Status | Duration | Completed |
|-------|------|------|--------|----------|-----------|
| 01 | 01 | Password Recovery/Reset Security Fixes | Complete | 4min | 2026-02-20 |
| 01 | 02 | HSTS, CORS, and Socket.IO Security Fixes | Complete | 6min | 2026-02-20 |
| 01 | 03 | Redis Rate Limiter Persistence | Complete | 4min | 2026-02-20 |

## Context for Next Session

- Phase 1 (Security Audit & Fixes) complete: all 3 plans executed (01-01, 01-02, 01-03)
- 01-02 complete: HSTS enabled in production, localhost:5000 removed from CORS, Socket.IO sync verified
- All 7 SEC requirements complete (SEC-01..SEC-07)
- **Следующий шаг:** Phase 2 (Bug Fixes & Stability) — BUG-01..BUG-04

## Key Decisions

| Decision | Date | Rationale |
|----------|------|-----------|
| Сначала аудит, потом App Store | 2026-02-19 | Нет смысла полировать UI на сломанном фундаменте |
| Только iOS | 2026-02-19 | Фокус на одной платформе |
| BillingScreen: скрыть на iOS | 2026-02-19 | Проще чем IAP; IAP можно добавить в v2 |
| ESLint 9 flat config | 2026-02-19 | ESM-совместимый, ESLint 8 — EOL |
| 6 фаз (security → bugs → quality → ios → build → release) | 2026-02-19 | Последовательность снижает риск; audit baseline перед нативной сборкой |
| PASSWORD_RESET_SECRET separate from SESSION_SECRET | 2026-02-20 | Rotating one secret doesn't invalidate the other; each operation has its own HMAC key |
| createRedisStore extracted to server/middleware/lib/ | 2026-02-20 | Reusable code 2+ times -> separate function (locked decision) |
| Unique Redis key prefixes per rate limiter | 2026-02-20 | rl:auth2:, rl:ai2: suffix prevents key collisions between rate-limit.ts and rate-limiter.ts |
| HSTS only in production via isProduction guard | 2026-02-20 | Enabling HSTS on HTTP development causes browser lockout; production-only ensures HTTPS-safe behavior |
| localhost:5000 removed from CORS origins | 2026-02-20 | Port 5000 is the API server itself, never a valid client origin; security misconfiguration |
| vi.doMock for per-test env mocking | 2026-02-20 | vi.mock is hoisted to file top by Vitest; vi.doMock is non-hoisted and works with vi.resetModules() per-test |

## Open Questions

- [ ] Bundle identifier — какой домен/компания? (e.g., `com.budgetbot.app`)
- [ ] Apple Developer Account — зарегистрирован?
- [ ] Privacy policy — кто пишет текст? Где хостить?

---
*State initialized: 2026-02-19*
*Last execution: 01-02 (HSTS, CORS, Socket.IO Security Fixes) — 2026-02-20*

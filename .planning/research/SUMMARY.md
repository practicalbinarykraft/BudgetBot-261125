# Research Summary

**Project:** BudgetBot — code audit + iOS App Store release
**Synthesized:** 2026-02-19
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

---

## Key Findings

### Critical Security Issues (fix immediately)

1. **Recovery code logged in plaintext** — `password-recovery.service.ts:81` logs 6-digit code via `logInfo`. Account takeover vector via log access.
2. **JWT secret reused as HMAC key** — `SESSION_SECRET` used for both JWT signing and password reset HMAC. Fallback `|| 'default-secret-change-in-production'` silently weakens security.
3. **Rate limiters use in-memory store** — all `rateLimit()` calls lack `store:` option. Counters reset on pm2 restart. Redis already available but not wired.
4. **HSTS disabled in production** — `security-headers.ts` sets `hsts: false` even though production runs HTTPS behind nginx.

### App Store Blockers (must fix before submission)

1. **No `ios.bundleIdentifier`** in `app.json` — EAS Build cannot proceed without it.
2. **No privacy usage descriptions** — camera, microphone, photo library used but `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, `NSPhotoLibraryUsageDescription` missing from `infoPlist`.
3. **No account deletion** — Apple requires since 2022. No `DELETE /api/account` endpoint. No UI for account deletion.
4. **BillingScreen shows pricing without IAP** — Apple Guideline 3.1.1 rejection. Must either hide pricing on iOS or implement StoreKit.
5. **No `eas.json`** — EAS Build not configured at all.
6. **No Privacy Manifest** — `ios.privacyManifests` missing from `app.json`.
7. **No privacy policy URL** — required for finance apps.
8. **No splash screen image** — only `backgroundColor` set.

### Tech Debt (audit findings)

1. **Zero static analysis** — no ESLint config exists. 100 `as any` casts across 36 server files.
2. **5 files exceed 500 LOC** — `admin-metrics.service.ts` (772), `auth-telegram.routes.ts` (601), `admin-users.service.ts` (570), `transactions.routes.ts` (552), `trend-calculator.service.ts` (551).
3. **Excessive debug logging** — `admin-users.service.ts:220-357` logs 12+ messages per `getUserDetails()` call.
4. **Password recovery dead-end** — email sending not implemented (TODO on line 200). Users without Telegram cannot recover passwords.
5. **Silent null fallbacks** — services return `null` instead of throwing, hiding errors.

---

## Architecture Decisions

### Two Workstreams with Hard Dependency

```
Workstream 1: Code Audit (foundation)
  Phase 1: Security fixes — auth, JWT, CORS, rate limiting, secrets
  Phase 2: Critical bugs — password recovery, null returns, error handling
  Phase 3: Code quality — file splits, debug logs, dead code, ESLint

                ↓ audit baseline established ↓

Workstream 2: App Store Preparation
  Phase 4: iOS config — app.json, eas.json, account deletion, privacy
  Phase 5: Build & Test — EAS build, TestFlight, device testing
  Phase 6: Release — screenshots, metadata, App Store submission
```

### Audit Sequence (within workstream 1)

Foundation → Security → Application Logic → Code Quality. Reason: broken types in auth middleware invalidate everything downstream.

### EAS Build Pipeline

```
Configure (app.json + eas.json) → Credentials (Apple Developer) →
Build (eas build --platform ios) → TestFlight → App Store Review
```

---

## Tooling Decisions

| Tool | Purpose | Install |
|------|---------|---------|
| ESLint 9 (flat config) + @typescript-eslint | Static analysis, catch `any` abuse | `npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser` |
| eslint-plugin-security | Node.js security anti-patterns | `npm install -D eslint-plugin-security` |
| knip | Dead code + unused dependencies | `npm install -D knip` |
| npm audit | Known CVE scanning | Built-in, wire into CI |
| eas-cli | EAS Build + Submit | `npm install -g eas-cli` |
| expo-doctor | Pre-flight config validation | `npx expo-doctor` (no install) |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| App Store rejection for missing IAP | HIGH | Blocks release | Hide BillingScreen on iOS before first build |
| App Store rejection for missing account deletion | HIGH | Blocks release | Implement DELETE /api/account + mobile UI |
| Security incident via log-leaked recovery codes | MEDIUM | Account takeover | Remove `code` from logInfo call |
| EAS Build fails due to missing config | HIGH | Delays release | Complete app.json and eas.json before first build |
| Apple review takes >1 week | LOW | Delays launch | Submit early; expect 1-3 day review for first submission |

---

## Recommended Phase Structure

| Phase | Focus | Key Deliverables |
|-------|-------|-----------------|
| 1 | Security Audit & Fixes | JWT secret separation, HSTS, rate limiter Redis, recovery code log removal, CORS cleanup |
| 2 | Bug Fixes & Stability | Password recovery fix, null fallback elimination, error handling consistency |
| 3 | Code Quality | Split oversized files, ESLint setup, debug log cleanup, dead code removal |
| 4 | App Store Preparation | app.json completion, eas.json, account deletion, privacy policy, BillingScreen guard |
| 5 | Build & TestFlight | EAS build, device testing, UI polish for iOS HIG |
| 6 | App Store Release | Screenshots, metadata, submission, review response |

---

## Open Questions Requiring User Decision

1. **Bundle identifier** — what domain/company name to use? (e.g., `com.budgetbot.app`)
2. **BillingScreen strategy** — hide pricing on iOS (simple) or implement StoreKit IAP (complex)?
3. **Privacy policy** — who writes the legal text? Where to host it?
4. **Apple Developer account** — is $99/year enrollment done?
5. **Password recovery** — implement email sending or remove email recovery option from UI?

---

*Synthesis of 4 research documents. Total: 1405 lines of research across STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*

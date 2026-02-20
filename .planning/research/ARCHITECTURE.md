# Architecture Research

**Domain:** Node.js/Express + React + Expo monolith — code audit + App Store release
**Researched:** 2026-02-19
**Confidence:** HIGH (based on direct codebase analysis of `.planning/codebase/` and project source)

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  budgetbot.online│  │m.budgetbot.online│  │  Telegram Bot   │ │
│  │  React/Vite SPA  │  │  Expo Web Build  │  │  Inline Client  │ │
│  │  (Express static)│  │  (nginx static)  │  │  (polling/hook) │ │
│  └────────┬─────────┘  └────────┬────────┘  └────────┬────────┘ │
└───────────┼─────────────────────┼────────────────────┼──────────┘
            │ HTTPS               │ HTTPS + proxy       │ HTTPS
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express API  (:5000)                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│  │ Middleware │  │  Routes   │  │ Services  │  │   Repos   │   │
│  │ cors/auth/ │→ │ 42 route  │→ │ 59 service│→ │ 24 repos  │   │
│  │ helmet/    │  │ handlers  │  │ files     │  │ (Drizzle) │   │
│  │ rate-limit │  │           │  │           │  │           │   │
│  └───────────┘  └───────────┘  └───────────┘  └─────┬─────┘   │
│                                                        │         │
│  ┌─────────────────────────────────────────────────┐  │         │
│  │              Socket.IO (real-time notifications) │  │         │
│  └─────────────────────────────────────────────────┘  │         │
└────────────────────────────────────────────────────────┼─────────┘
                                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                 │
│  ┌─────────────────────┐   ┌──────────────┐  ┌──────────────┐  │
│  │   PostgreSQL 16      │   │  Redis       │  │  Filesystem  │  │
│  │   (primary DB,       │   │  (optional   │  │  (logs,      │  │
│  │    session store)    │   │   cache)     │  │   uploads)   │  │
│  └─────────────────────┘   └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Mobile app (Expo) dual-deployment reality:**

```
Development / TestFlight / App Store (native iOS binary):
  mobile/ → EAS Build (cloud) → .ipa → TestFlight → App Store

Current production (web only, no App Store):
  mobile/ → expo export --platform web → nginx static → m.budgetbot.online
```

These are two distinct deployment targets from the same `mobile/` codebase.

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| `client/` (React/Vite) | Web SPA at budgetbot.online | Express API via React Query + Socket.IO |
| `mobile/` (Expo RN) | Native iOS/Android app + Expo Web | Express API via api-client.ts + Socket.IO |
| `server/index.ts` | Entry point, middleware chain, server bootstrap | All server modules |
| `server/middleware/` | Auth, CORS, rate limiting, security headers | Routes (applied globally) |
| `server/routes/` | HTTP handlers, input validation | Services |
| `server/services/` | Business logic, external API calls | Repositories, external APIs |
| `server/repositories/` | All DB queries via Drizzle ORM | PostgreSQL |
| `server/telegram/` | Telegram bot handlers, menus | Telegram Bot API, Services |
| `server/cron/` | Scheduled jobs (notifications, cleanup) | Services |
| `shared/schema.ts` | Drizzle table defs + Zod schemas + TS types | Server (queries) + Client (type safety) |
| `nginx/` | Reverse proxy for m.budgetbot.online | Express port 5000 |

---

## Audit Structure: What to Check in Which Order

A monolith audit has clear dependency ordering: infrastructure and security problems can invalidate everything else. Start at the foundation and work outward.

### Audit Sequence

```
Phase A: Foundation (no external dependencies)
    A1. Environment & configuration
    A2. TypeScript type safety
    A3. Schema and data model integrity

Phase B: Security (depends on A)
    B1. Authentication layer (Passport + JWT + sessions)
    B2. Authorization (per-route auth checks)
    B3. Input validation (Zod schemas on all routes)
    B4. CORS, security headers, rate limiting

Phase C: Application Logic (depends on B)
    C1. Service layer — correct behavior, null returns
    C2. Repository layer — N+1 queries, missing indexes
    C3. Error handling consistency
    C4. TODOs and stub implementations

Phase D: Code Quality (depends on C)
    D1. File size violations (>150 LOC rule)
    D2. Debug logging cleanup
    D3. Console.log in client code
    D4. Unused imports and dead code

Phase E: Mobile App Store Readiness (parallel to A-D)
    E1. app.json completeness (bundleIdentifier, version, icons)
    E2. Privacy policy and App Store metadata
    E3. Permission declarations (camera, microphone, photo library)
    E4. Native build configuration (EAS setup)
    E5. UI/UX audit for iOS Human Interface Guidelines
```

### Why This Order

1. **Environment first** — broken env validation means runtime crashes; nothing else matters until config is clean.
2. **Types before logic** — `any` casts in auth middleware (`mobile-auth.ts`, `auth-utils.ts`) mean type errors in security-critical code can silently pass.
3. **Security before features** — auditing business logic on top of broken auth means auditing the wrong paths.
4. **Logic before cleanup** — removing debug logs and TODOs before fixing bugs risks masking symptoms.
5. **Mobile readiness can be parallel** — app.json, EAS config, and App Store metadata are independent of server code quality, but App Store submission gates on everything being stable.

### Specific Audit Checklist per Area

**A1: Environment & Configuration**
- `server/lib/env.ts` — are all required vars validated? are optional vars safe to miss?
- `.env.example` completeness vs actual `.env` usage
- Secret rotation: SESSION_SECRET, ENCRYPTION_KEY, bot tokens

**A2: TypeScript Type Safety**
- `server/middleware/auth-utils.ts` lines 7-11, 43, 55 — replace `any` with typed generics
- `server/middleware/mobile-auth.ts` lines 25-29, 43, 51, 55, 58, 60, 67 — same
- Run `npm run check` and ensure zero type errors

**A3: Schema and Data Model**
- `shared/schema.ts` — hybrid `category`/`categoryId` migration completeness
- Check constraint on `users` table (must have email+password OR telegramId)
- Missing FK indexes for performance

**B1: Authentication Layer**
- JWT expiry: mobile tokens set to 30 days in `mobile-auth.ts:17` — should be 7 days max
- Session store fallback: PostgreSQL → memory (silent fallback on DB failure)
- Passport local strategy in `server/auth.ts`
- 2FA flow: TOTP secret encryption at rest (otplib + `server/lib/encryption.ts`)

**B2: Authorization**
- Every route in `server/routes/` — does it have `withAuth()` or equivalent check?
- Admin routes (`admin-bridge.routes.ts`) — does `adminAuthMiddleware` cover all endpoints?
- Telegram mini-app auth (`auth-miniapp.routes.ts`) — HMAC verification completeness

**B3: Input Validation**
- `server/routes/transactions.routes.ts` (552 lines) — Zod validation on every mutation
- File upload endpoints — MIME type validation, size limits enforced
- Numeric overflow: `decimal(10,2)` in schema vs actual input ranges

**B4: CORS and Headers**
- `server/middleware/cors.ts` — `localhost:5000` in ALLOWED_ORIGINS is wrong (server as CORS origin)
- `server/lib/websocket.ts` — Socket.IO CORS must match `cors.ts` ALLOWED_ORIGINS
- Helmet CSP — check `script-src`, `img-src` for inline scripts in React builds

**C1: Service Layer**
- Functions returning `null` instead of throwing: `transaction.service.ts`, `api-key-manager.ts`, `admin-users.service.ts`
- Password recovery dead-end: `password-recovery.service.ts:200` — TODO email sending blocks recovery for non-Telegram users
- AI chat handler: `ai-chat-handler.ts:269` — TODO filter by role='user' for session correctness

**C2: Repository Layer**
- N+1 in admin: `admin-users.service.ts:224-284` — 7 separate queries per user; needs aggregation or CTE
- Admin metrics cache: `admin-metrics.service.ts:24-50` — unbounded Map; needs eviction policy
- Missing indexes: check `userId` + date columns on transactions, notifications tables

**C3: Error Handling**
- Pattern: throw in services, catch in routes — verify no route returns 500 silently
- Telegram bot message fail: `password-recovery.service.ts:103` — silent false return
- Credits calculation fail: `admin-users.service.ts:287-319` — swallowed exception with silent zero fallback

**C4: TODOs**
- `price-search.service.ts:47` — stub AI price search (non-blocking for release)
- `password-recovery.service.ts:200` — email sending (BLOCKING for release: recovery fails)
- `admin-system-health.service.ts:336,354` — CPU/request count stubs (non-blocking)
- `telegram/menu/keyboards.ts:136` — emoji-based callbacks (i18n risk)

**D1-D4: Code Quality**
- Files >500 LOC: `admin-metrics.service.ts` (772), `admin-users.service.ts` (570), `trend-calculator.service.ts` (551), `auth-telegram.routes.ts` (601), `transactions.routes.ts` (552)
- Debug logs in `admin-users.service.ts:220-357` — 12+ console messages per `getUserDetails()` call
- `ai.routes.ts.backup` in `server/routes/` — dead backup file, should be deleted

---

## EAS Build Pipeline: local → EAS → TestFlight → App Store

### What EAS Is

EAS (Expo Application Services) is Expo's managed cloud build infrastructure. Instead of requiring Xcode locally to produce `.ipa` files, EAS builds native iOS binaries on Expo's Mac infrastructure using your source code and credentials.

**Three EAS services relevant to this project:**

| Service | Purpose | When used |
|---------|---------|-----------|
| `eas build` | Compiles Expo RN → native `.ipa` (iOS) or `.apk`/`.aab` (Android) | Every release build |
| `eas submit` | Uploads `.ipa` to App Store Connect / TestFlight | After build passes |
| `eas update` | OTA JS bundle updates (skip App Store review for JS-only changes) | Post-launch hotfixes |

### Prerequisites (before first build)

1. **Apple Developer account** — $99/year, must enroll at developer.apple.com
2. **App Store Connect app record** — create app with Bundle ID matching `app.json`
3. **Expo account** — free, at expo.dev
4. **EAS CLI installed** — `npm install -g eas-cli` (separate from Expo SDK)

### Current app.json gaps (must fix before build)

The current `mobile/app.json` is minimal. It is missing required fields for a production iOS build:

```json
{
  "expo": {
    "name": "BudgetBot",
    "slug": "budgetbot",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.budgetbot",
      "buildNumber": "1"
    }
  }
}
```

Additionally needed:
- `icon`: currently `./assets/icon.png` — must be 1024x1024px PNG, no transparency
- `splash`: `backgroundColor` exists but no `image` — add splash image
- Permission usage descriptions: `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, `NSPhotoLibraryUsageDescription` (required by Apple for camera, voice, receipt scan features)

### eas.json configuration (new file to create at mobile/eas.json)

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m1-medium"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "YOUR_APPLE_TEAM_ID"
      }
    }
  }
}
```

### Full Pipeline: Step by Step

```
Step 1: Configure (Phase 4 of milestone)
  mobile/app.json          → add bundleIdentifier, buildNumber
  mobile/eas.json          → create with build profiles
  Apple Developer Portal   → create App ID matching bundleIdentifier
  App Store Connect        → create app record

Step 2: Credentials Setup (one-time, Phase 4)
  eas credentials          → EAS manages provisioning profiles + certificates
                             OR supply your own (from Keychain/Xcode)

Step 3: Build (cloud, Phase 5)
  eas build --platform ios --profile production
  → EAS clones repo, installs deps, compiles native code on Mac
  → 10-20 min build time
  → Returns download link for .ipa artifact

Step 4: TestFlight (Phase 5)
  eas submit --platform ios --profile production
  → Uploads .ipa to App Store Connect
  → App Store Connect processes (15-30 min)
  → Share TestFlight link with testers
  → Test on physical device before App Review submission

Step 5: App Store Review (Phase 6)
  App Store Connect UI     → add screenshots, description, privacy policy URL
  → Submit for Review
  → Apple review: 24-48 hours (first submission often longer)
  → Approval → Release
```

### EAS vs Expo Web: Two Separate Outputs

The `mobile/` directory currently serves two distinct deployment targets:

```
Target A: m.budgetbot.online (running today)
  Command: EXPO_PUBLIC_API_URL=https://m.budgetbot.online npx expo export --platform web
  Output: static HTML/JS bundle → nginx at /var/www/m.budgetbot.online
  Auth: JWT Bearer token stored in AsyncStorage
  Platform: Any browser (including mobile browser)

Target B: App Store (new target)
  Command: eas build --platform ios --profile production
  Output: .ipa binary → TestFlight → App Store
  Auth: JWT Bearer token stored in SecureStore (iOS Keychain-backed)
  Platform: iOS device only
  EXPO_PUBLIC_API_URL: hardcoded at build time in app.json or eas.json env
```

Both targets use the same React Native codebase. The `newArchEnabled: true` in app.json is the New Architecture (Fabric/JSI) — supported in Expo SDK 54 and React Native 0.81. This is the correct default for new App Store submissions.

---

## Data Flow

### API Request Flow (all three clients)

```
[Client action]
    ↓
[HTTP/HTTPS request to /api/]
    ↓
[Express middleware chain]
  securityHeaders → corsMiddleware → requestId → compression
  → express.json() → apiLimiter → requestLogger
    ↓
[Route handler]
  withAuth() check → Zod validation → service call
    ↓
[Service layer]
  business logic → repository call → external API call (if needed)
    ↓
[Repository layer]
  Drizzle ORM query → PostgreSQL
    ↓
[Response]
  JSON ← transform ← query result
```

### Mobile Auth Token Flow

```
[Mobile app startup]
    ↓ check SecureStore (iOS Keychain)
[JWT token present?]
    YES → api-client.ts attaches Bearer token to every request
    NO  → redirect to AuthScreen (login/register)
    ↓
[Every API request]
  Authorization: Bearer <jwt>
    ↓
[server/middleware/mobile-auth.ts]
  verify JWT signature → check expiry (currently 30 days) → attach req.user
    ↓
[Route handler sees authenticated req.user]
```

### Expo Web vs Native — Data Flow Difference

```
Expo Web (m.budgetbot.online):
  Browser → nginx static serves JS bundle
  JS bundle makes API calls to /api/ (relative)
  nginx proxies /api/ → localhost:5000

Native iOS (App Store):
  iOS app makes API calls to EXPO_PUBLIC_API_URL (absolute)
  EXPO_PUBLIC_API_URL set at EAS build time
  Must point to production: https://budgetbot.online OR https://m.budgetbot.online
  CRITICAL: no runtime override — wrong URL at build = broken app
```

### WebSocket Real-time Flow

```
[Client connects to /socket.io/]
    ↓
[server/lib/websocket.ts authenticates socket]
  adds socket to user room: `user:${userId}`
    ↓
[Budget/notification event fires]
  notification.service.ts → realtime-notifications.service.ts
    ↓
  io.to(`user:${userId}`).emit('notification', data)
    ↓
[Client React/RN updates notification badge]
```

---

## Audit → Build Order Implications

The milestone has two workstreams with a clear dependency at the boundary:

```
Workstream 1: Audit (must complete before App Store)
    Phase 1: Security audit        B1-B4 — auth, CORS, JWT, validation
    Phase 2: Critical bug fixes    C1-C4 — password recovery, null returns, silent failures
    Phase 3: Code quality cleanup  D1-D4 — large files, debug logs, dead code

                ↓ audit baseline established ↓

Workstream 2: App Store
    Phase 4: Native build config   E1-E4 — app.json, eas.json, Apple Developer setup
    Phase 5: TestFlight            EAS build → TestFlight → physical device testing
    Phase 6: App Store submission  screenshots, description, review submission
```

**Hard dependencies that block phases:**

| Fix | Blocks |
|-----|--------|
| `app.json` must have `bundleIdentifier` | Phase 5 (eas build will fail without it) |
| `eas.json` must exist | Phase 5 (EAS requires it) |
| JWT expiry reduced from 30d to 7d | Phase 5 (TestFlight testers get long-lived tokens) |
| CORS localhost fix | Phase 4 (correct config before build) |
| Password recovery email stub | Phase 6 (Apple testers test account recovery) |
| Privacy policy URL live | Phase 6 (required field in App Store Connect) |

**Recommended phase order for roadmap:**

| Phase | Name | Content |
|-------|------|---------|
| 1 | Security Audit | Auth/JWT/CORS/validation — fix blocking security issues |
| 2 | Critical Fixes | Password recovery, silent nulls, error handling |
| 3 | Code Quality | LOC violations, debug logs, TODOs, dead files |
| 4 | App Store Prep | app.json, EAS config, Apple Developer account, assets |
| 5 | TestFlight | First EAS build, internal testing, device testing |
| 6 | Release | App Store Connect metadata, screenshots, submit for review |

---

## Integration Points

### External Services

| Service | Integration Pattern | Audit Notes |
|---------|---------------------|-------------|
| Anthropic Claude | SDK via `api-key-manager.ts`; system key or BYOK | Verify key never logged |
| OpenAI GPT-4o / Whisper | Same BYOK pattern; OCR + voice fallback | Optional key; wrapped in try/catch |
| DeepSeek | Axios HTTP in `deepseek.service.ts` | Audit raw HTTP error handling |
| Telegram Bot API | Polling (dev) or Webhook (prod) | Token must not appear in logs |
| Sentry | Node + React SDKs; captures 5xx errors | Audit PII not in extras/tags |
| EAS (new) | `eas build` + `eas submit` CLI | Credentials managed by EAS or local Keychain |
| Apple App Store Connect | Via EAS submit | Requires Apple Developer account + App record |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Routes ↔ Services | Direct function calls | Routes must NOT call repositories directly |
| Services ↔ Repositories | Direct function calls | Repositories must NOT have business logic |
| Server ↔ Web Client | REST + Socket.IO | Session cookie auth |
| Server ↔ Mobile | REST + Socket.IO | JWT Bearer auth |
| shared/schema.ts | TypeScript imports from both | Single source of truth for types |
| nginx ↔ Express | HTTP proxy `/api/` + `/socket.io/` | Config tracked in `nginx/` directory |

---

## Sources

- Direct analysis of `mobile/app.json`, `mobile/package.json` (Expo SDK 54, React Native 0.81.5)
- Direct analysis of `server/index.ts`, `server/middleware/`, `server/routes/`, `server/services/`
- `.planning/codebase/ARCHITECTURE.md` — existing codebase architectural analysis (2026-02-19)
- `.planning/codebase/CONCERNS.md` — existing tech debt and security concerns (2026-02-19)
- `.planning/codebase/STACK.md` — existing technology stack analysis (2026-02-19)
- `.planning/codebase/INTEGRATIONS.md` — external service integration details (2026-02-19)
- `CLAUDE.md` — project onboarding guide with deployment notes
- EAS Build pipeline: HIGH confidence from training data on Expo SDK 50+ / EAS stable API (eas-cli v12+, stable since 2022 GA)

---

*Architecture research for: BudgetBot — Node.js/Express + React + Expo monolith, code audit + App Store release*
*Researched: 2026-02-19*


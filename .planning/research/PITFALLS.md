# Pitfalls Research

**Domain:** Node.js/TypeScript finance app (security audit) + Expo/React Native (iOS App Store submission)
**Researched:** 2026-02-19
**Confidence:** HIGH (based on direct codebase inspection) / MEDIUM (App Store submission rules based on known Apple guidelines)

---

## Critical Pitfalls

### Pitfall 1: Recovery Code Logged in Plain Text

**What goes wrong:**
`server/services/password-recovery.service.ts` line 81 logs the 6-digit recovery code in plain text via `logInfo`:

```typescript
logInfo(`Recovery code generated for user ${userId}`, {
  code,                          // <-- plaintext 6-digit code in logs
  expiresAt: expiresAt.toISOString(),
});
```

Any log aggregator (Sentry, production file logs, VPS `/var/log`) will contain live recovery credentials. An attacker who reads logs can take over any account that triggered a password reset.

**Why it happens:**
Debug-quality logging kept in production code. A commonly overlooked vector during rapid development.

**How to avoid:**
Remove the `code` field from the log call entirely. Log only `userId` and `expiresAt`. The existence of a code generation event is sufficient for debugging.

**Warning signs:**
- Log entries containing 6-digit numeric strings alongside `userId`
- `grep -r "code," server/services/password-recovery.service.ts` returns the log call

**Phase to address:** Security Audit phase — fix before any production user base grows.

---

### Pitfall 2: JWT Secret Reused as HMAC Key for Password Reset Tokens

**What goes wrong:**
`server/middleware/mobile-auth.ts` uses `SESSION_SECRET` as the JWT signing key, and `server/services/password-recovery.service.ts` uses the same `SESSION_SECRET` as the HMAC key for reset tokens:

```typescript
const secret = process.env.SESSION_SECRET || 'default-secret-change-in-production';
```

If `SESSION_SECRET` is rotated to invalidate all sessions, it simultaneously invalidates all pending reset tokens (and vice versa). More critically: `|| 'default-secret-change-in-production'` means a missing env var silently produces a predictable secret, not a crash.

**Why it happens:**
Re-using a single secret is simpler during development. The fallback string exists to prevent startup crashes.

**How to avoid:**
- Use a dedicated `PASSWORD_RESET_SECRET` env variable separate from `SESSION_SECRET`
- Remove the `||` fallback — let the application crash at startup if the secret is missing (the `env.ts` Zod schema already enforces `SESSION_SECRET`; add `PASSWORD_RESET_SECRET` to it)

**Warning signs:**
- Only one `*_SECRET` variable in `.env` or `env.ts`
- Grep `|| 'default-secret` returns any hits in production-path code

**Phase to address:** Security Audit phase.

---

### Pitfall 3: Rate Limiters Use In-Memory Store — Not Scale-Safe and Bypassable

**What goes wrong:**
All rate limiters in `server/middleware/rate-limit.ts` and `server/middleware/rate-limiter.ts` use the default in-memory store from `express-rate-limit`. This means:

1. After a pm2 restart or server reboot, all rate limit counters reset — a brute-force window opens
2. With multiple pm2 instances or any horizontal scaling, each process has its own counter (attacker can multiply their effective limit by the number of processes)
3. Auth brute-force protection is meaningless across restarts

**Why it happens:**
In-memory is the default and is sufficient for local development. Redis is already configured as an optional dependency but not wired to the rate limiters.

**How to avoid:**
Wire the existing Redis client to `express-rate-limit`'s store using `rate-limit-redis` package. Redis is already in the project (`server/lib/redis.ts`). Fall back gracefully if Redis is unavailable.

**Warning signs:**
- `store:` option missing from `rateLimit({})` calls
- Redis is configured (`REDIS_URL` set) but rate limiters still use memory store

**Phase to address:** Security Audit phase.

---

### Pitfall 4: App Store Rejection — No IAP for Paid Features in iOS App

**What goes wrong:**
The `BillingScreen` lets users buy "credits" via a direct external payment flow (API calls to the backend). Apple requires that any digital goods or services sold within an iOS app must go through Apple's In-App Purchase (StoreKit) system. The current billing system (credits purchased via backend API) will cause an App Store rejection under App Store Review Guideline 3.1.1.

**Why it happens:**
Web-first billing architecture: works fine for browsers and Android, but Apple mandates StoreKit for iOS.

**How to avoid:**
For the iOS App Store submission, one of these approaches is required:
- Implement `expo-iap` or `react-native-iap` for iOS credit purchases with Apple as the payment processor
- Remove the purchase flow entirely from the iOS binary (show a "purchase on web" message instead, linking to the web app — this is allowed under Apple's reader app rules if you do NOT include a direct link that lets users bypass the App Store)
- Gate the billing screen behind a platform check: `if (Platform.OS !== 'ios') { /* show purchase UI */ }`

The "reader app" exemption (Guideline 3.1.3a) allows apps to access previously purchased content without going through IAP, but selling new credits in-app still requires StoreKit.

**Warning signs:**
- `BillingScreen.tsx` renders payment UI without `Platform.OS === 'ios'` check
- No `expo-iap`, `react-native-iap`, or `expo-store-review` in `mobile/package.json`
- Credits are purchased by calling `/api/credits` directly

**Phase to address:** App Store Preparation phase (before first TestFlight build).

---

### Pitfall 5: Missing iOS Privacy Usage Descriptions in app.json

**What goes wrong:**
The app uses camera (`expo-image-picker`), microphone (`expo-av` for voice input), and photo library access. Apple requires `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, and `NSMicrophoneUsageDescription` keys in `Info.plist`, or the app is rejected during automated binary analysis — no human review involved.

Current `app.json` has no `infoPlist` section at all:

```json
{
  "expo": {
    "ios": {
      "supportsTablet": true
    }
  }
}
```

**Why it happens:**
Expo Web builds do not require these descriptions. They are only needed when building a native iOS binary. First-time App Store submissions often miss this because the app "works" in Expo Go without them.

**How to avoid:**
Add to `mobile/app.json`:

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.yourcompany.budgetbot",
  "infoPlist": {
    "NSCameraUsageDescription": "BudgetBot uses the camera to scan receipts.",
    "NSPhotoLibraryUsageDescription": "BudgetBot accesses your photos to scan receipts.",
    "NSMicrophoneUsageDescription": "BudgetBot uses the microphone to record voice transactions."
  }
}
```

Descriptions must be specific and accurate — generic strings like "for app features" cause rejection.

**Warning signs:**
- `app.json` has no `infoPlist` key
- `expo-image-picker`, `expo-av` are in `package.json` but no permissions are declared
- `npx expo-doctor` or EAS build log warns about missing usage descriptions

**Phase to address:** App Store Preparation phase — must be done before EAS Build is run.

---

### Pitfall 6: No `bundleIdentifier` in app.json

**What goes wrong:**
`mobile/app.json` has no `ios.bundleIdentifier` field. EAS Build will prompt for it interactively or use a default that may not match the App Store Connect record. A mismatch between the bundle ID registered in App Store Connect and the one in the binary will prevent the build from being submitted.

**Why it happens:**
Expo Go development does not need a bundle identifier. It becomes mandatory only for native builds.

**How to avoid:**
Register a bundle identifier in App Store Connect first (e.g., `com.yourname.budgetbot`), then add it to `app.json` before running `eas build --platform ios`.

**Warning signs:**
- `mobile/app.json` `ios` object contains only `supportsTablet: true`
- No `eas.json` file exists in the `mobile/` directory

**Phase to address:** App Store Preparation phase — before creating the first EAS Build.

---

### Pitfall 7: HSTS Disabled in Production Security Headers

**What goes wrong:**
`server/middleware/security-headers.ts` explicitly sets `hsts: false`. The comment says "Disabled for HTTP-only deployments to prevent browser lockout." However, the production deployment is behind nginx with HTTPS (`budgetbot.online`, `m.budgetbot.online`). With HSTS disabled, browsers will not enforce HTTPS-only connections to the API server, leaving the session cookie vulnerable to downgrade attacks.

**Why it happens:**
HSTS was disabled to handle mixed HTTP/HTTPS environments during development. The setting was never re-enabled for production.

**How to avoid:**
Enable HSTS conditionally based on `NODE_ENV`:

```typescript
hsts: env.NODE_ENV === 'production'
  ? { maxAge: 31536000, includeSubDomains: false }
  : false,
```

**Warning signs:**
- `hsts: false` in `security-headers.ts` while `NODE_ENV=production`
- `curl -I https://budgetbot.online` does not return `Strict-Transport-Security` header

**Phase to address:** Security Audit phase.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `(req as any).user = user` in `mobile-auth.ts` and `auth-utils.ts` | Avoids TypeScript generic complexity | TypeScript offers zero protection on `req.user` access; runtime `undefined` errors possible | Never in auth-critical paths — fix with proper Express namespace augmentation |
| Duplicate default category arrays in `auth.ts` and `mobile-auth.routes.ts` | Quick copy-paste | Category list drift — web and mobile register users with different defaults | Acceptable now but extract to a single shared constant before adding more categories |
| Memory-based rate limiters | Zero configuration | Brute-force protection resets on restart | Never for auth endpoints in production |
| In-memory session fallback (`MemoryStore`) | App starts even when DB is down | Sessions disappear on restart; users get logged out silently | Acceptable during initial DB outage, but log it as a P1 alert |
| TODO stubs in services (email, AI price search, CPU metrics) | Avoids blocking on incomplete features | App Store reviewers test all visible UI; dead-end screens cause rejection | Acceptable if the UI path that reaches the stub is hidden or shows a clear "coming soon" message |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Anthropic / OpenAI API keys | `getSystemKey()` called unconditionally — throws if env var not set, crashes request silently | Always wrap in try/catch per CLAUDE.md rule #1; this is documented but only partially followed (e.g., `receipts.routes.ts` does it correctly, but other routes may not) |
| Expo image picker on iOS | Using `expo-image-picker` without `NSPhotoLibraryUsageDescription` in `infoPlist` | Add all required usage descriptions before native build |
| Expo Audio on iOS | `allowsRecordingIOS: true` requires `NSMicrophoneUsageDescription` | Already used in `useInlineVoice.ts` and `useVoiceInputScreen.ts`; must be declared in `app.json` |
| Apple IAP for billing | Backend credit purchase bypasses App Store payment rules | Use StoreKit on iOS or hide purchase UI on iOS platform |
| Session cookie `domain: '.budgetbot.online'` | Works for `budgetbot.online` web client but breaks if API is called from a different subdomain not under `.budgetbot.online` | Verify the domain matches all production origins; note that mobile clients use JWT Bearer tokens (not cookies) so this is low-risk for the mobile path |
| Expo Web build caching (Metro) | Build succeeds but users see stale assets | Always use `--clear` flag; bump service worker cache version in `client/public/sw.js` when deploying breaking changes |
| Telegram bot recovery | `requestPasswordRecovery` returns `success: false` with `method: 'email'` when user has an email but no Telegram linked — the error message tells the user "please use Telegram" even though they don't have it | Fix the error message to say "email recovery not yet implemented" so users know what to do |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N+1 queries in category/wallet loaders | Response time increases linearly with number of user records | Use Drizzle `.inArray()` or joins — the project already addressed this (N1_OPTIMIZATION_SUMMARY.md) but new routes can re-introduce it | At 50+ categories or wallets per user |
| `getUserById` on every authenticated request (mobile JWT path) | Each API call hits the DB to resolve the user from the JWT payload | Cache user record in Redis with short TTL (1–2 min) using existing `CacheService` | At ~500 concurrent mobile users |
| `isRedisAvailable()` called on every cache read/write | Redis ping on every cache operation adds ~1ms overhead when Redis is healthy | Call once at connection and maintain a boolean flag, only re-ping on errors | Already present in code — medium risk |
| Large base64 images in request body | Receipt scan endpoint accepts `images[]` of base64 strings — each image can be 1–3 MB | Validate image size server-side before sending to Anthropic; the current code has no size check | Any user uploading uncompressed JPEGs |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Recovery code logged in plain text (see Critical Pitfall 1) | Account takeover via log access | Remove `code` from `logInfo` call immediately |
| `SESSION_SECRET` reused as password reset HMAC key (see Critical Pitfall 2) | Predictable reset tokens if env var is missing; cross-contamination on rotation | Separate secret per use case, no fallback defaults |
| HSTS disabled in production (see Critical Pitfall 7) | Session cookie hijack via HTTP downgrade | Enable HSTS when `NODE_ENV === 'production'` |
| CSP allows `'unsafe-inline'` and `'unsafe-eval'` for scripts | XSS attacks can execute arbitrary scripts | Acceptable tradeoff for a SPA with Vite; monitor if Telegram widget injection is a concern |
| Rate limiters use in-memory store (see Critical Pitfall 3) | Auth brute-force protection resets on restart | Wire to Redis using `rate-limit-redis` |
| `(req as any).user` assignments bypass TypeScript type system | Incorrect user objects passed to handlers without compile-time detection | Use Express namespace augmentation: `declare global { namespace Express { interface User { ... } } }` |
| User's BYOK API keys stored encrypted with `ENCRYPTION_KEY` — if key is lost, all user data is unrecoverable | Permanent data loss for users who provided API keys | Ensure `ENCRYPTION_KEY` is backed up per the existing DEPLOYMENT_CHECKLIST.md; document in runbook |
| Admin session (`req.session.adminId`) and user session share the same session store | Admin session fixation or user-session poisoning possible if session IDs are predictable | The current implementation is low risk since admin routes are separate, but a dedicated admin session namespace adds defense in depth |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Password recovery returns `method: 'email'` with error when email recovery is not implemented | User is told they can recover via email, then gets an error — confusing and may cause support requests or App Store reviews mentioning "broken password recovery" | Show "Email recovery coming soon" OR hide email recovery option until implemented |
| Billing screen visible on iOS without IAP implementation | User taps "buy credits" → nothing happens → negative review | Add `Platform.OS === 'ios'` guard; show "Manage subscription on budgetbot.online" instead |
| `navigation.goBack()` after multi-step flows (documented in CLAUDE.md) | User ends up on receipt scanner step instead of dashboard after adding a transaction | Use `navigate("Main")` to skip back to root; already documented but easy to regress |
| TODO stubs in product catalog and AI price search are visible screens | Apple reviewer may test these screens and reject for "placeholder content" | Either implement the feature minimally or remove the nav entry from the iOS build |
| Service worker stale cache (web) | After a backend-breaking deploy, mobile web users see the old UI calling the new API | Bump service worker version on every breaking deploy; document this in the deploy checklist |

---

## "Looks Done But Isn't" Checklist

- [ ] **Password recovery:** Only works if user has Telegram linked. Email path exists in the UI but returns an error. Verify the user-facing error message is honest about email being unimplemented.
- [ ] **iOS privacy descriptions:** App uses camera, microphone, and photo library — all require `infoPlist` usage descriptions. The current `app.json` has none. Verify before any native build.
- [ ] **Bundle identifier:** No `ios.bundleIdentifier` in `app.json`. Verify it is set and matches App Store Connect before running `eas build`.
- [ ] **IAP for iOS billing:** Credits purchase UI exists in `BillingScreen.tsx`. Verify there is either a `Platform.OS === 'ios'` guard or a StoreKit integration before submitting.
- [ ] **Rate limiter Redis wiring:** Redis is configured and available in production, but rate limiters still use in-memory stores. Verify `store:` option on all `rateLimit()` calls.
- [ ] **HSTS in production:** `hsts: false` in security headers. Verify HSTS is enabled when `NODE_ENV === 'production'`.
- [ ] **Recovery code in logs:** `logInfo` call includes the plaintext code. Verify it is removed from production code.
- [ ] **`eas.json`:** No `eas.json` exists in `mobile/`. Verify EAS Build is configured before first TestFlight submission.
- [ ] **App Store Connect record:** App name, category, age rating, screenshots, and privacy policy URL must be filled before Apple review. A missing privacy policy URL is an automatic rejection for apps that handle financial data.
- [ ] **Privacy policy URL:** Required for any app that handles personal financial data. Apple rejects apps without one. Verify the URL is live and accessible before submission.
- [ ] **Unused permissions:** If `expo-av` is installed but voice input is removed for a future release, the microphone usage description must be removed too, or Apple flags unused permissions.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Recovery code in logs | LOW | Remove `code` from log call; rotate any exposed codes (they expire in 15 min already); consider log rotation/purge if logs are aggregated externally |
| JWT/HMAC secret reuse | MEDIUM | Add `PASSWORD_RESET_SECRET` to env schema; deploy; existing reset tokens (valid 1hr) will be invalidated on secret change — acceptable |
| App Store rejection — IAP | HIGH | Implement `expo-iap` for StoreKit OR add `Platform.OS` guard + "purchase on web" message; re-submit (review takes 1–3 days per round) |
| App Store rejection — missing privacy descriptions | LOW | Add `infoPlist` to `app.json`; rebuild with EAS; re-submit |
| App Store rejection — missing bundle identifier | LOW | Register bundle ID in App Store Connect; add to `app.json`; rebuild |
| HSTS off in production | LOW | One-line change in `security-headers.ts`; deploy |
| Rate limiters reset on restart | MEDIUM | Install `rate-limit-redis`; wire to existing Redis client; deploy; no data migration needed |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Recovery code logged in plain text | Security Audit | Grep for `logInfo` / `logError` calls containing `code` variables in password recovery paths |
| JWT/HMAC secret reuse + fallback default | Security Audit | Review `env.ts` Zod schema; confirm `PASSWORD_RESET_SECRET` added and no `||` fallbacks in token generation paths |
| In-memory rate limiters | Security Audit | Verify `store:` option present in all `rateLimit()` calls; Redis integration test |
| HSTS disabled in production | Security Audit | `curl -I https://budgetbot.online` must return `Strict-Transport-Security` |
| `any` types in auth middleware | Security Audit / TypeScript hardening | `tsc --strict` must pass with no suppressions in `server/middleware/` |
| Missing iOS privacy descriptions | App Store Preparation | `npx expo-doctor` passes; EAS Build succeeds without privacy warnings |
| Missing `bundleIdentifier` | App Store Preparation | `mobile/app.json` contains `ios.bundleIdentifier`; matches App Store Connect |
| No IAP for iOS billing | App Store Preparation | `BillingScreen.tsx` has `Platform.OS` guard; OR `expo-iap` integrated for iOS |
| Missing privacy policy URL | App Store Preparation | URL is live; added to App Store Connect metadata before submission |
| Placeholder / stub screens visible to Apple reviewer | App Store Preparation | All screens reachable from navigation are either functional or hidden behind feature flags |
| Expo Web build caching | Deployment | Service worker version bumped; verified in browser DevTools > Application > Cache |
| Password recovery email path lies to users | Bug fix (pre-App Store) | Error message correctly states email recovery is not yet available |

---

## Sources

- Direct codebase inspection: `/Users/aleksandrmishin/BudgetBot-261125/server/services/password-recovery.service.ts` lines 81–84 (plaintext code logging)
- Direct codebase inspection: `/Users/aleksandrmishin/BudgetBot-261125/server/middleware/mobile-auth.ts` (JWT secret sourcing)
- Direct codebase inspection: `/Users/aleksandrmishin/BudgetBot-261125/server/middleware/rate-limit.ts` (in-memory store, no `store:` option)
- Direct codebase inspection: `/Users/aleksandrmishin/BudgetBot-261125/server/middleware/security-headers.ts` (`hsts: false`)
- Direct codebase inspection: `/Users/aleksandrmishin/BudgetBot-261125/mobile/app.json` (no `bundleIdentifier`, no `infoPlist`)
- Direct codebase inspection: `/Users/aleksandrmishin/BudgetBot-261125/mobile/screens/BillingScreen.tsx` (no `Platform.OS` guard)
- Direct codebase inspection: `/Users/aleksandrmishin/BudgetBot-261125/mobile/hooks/useInlineVoice.ts`, `useVoiceInputScreen.ts` (microphone usage without declared permission)
- Project documentation: `/Users/aleksandrmishin/BudgetBot-261125/CLAUDE.md` (known pitfalls, architecture rules)
- Apple App Store Review Guidelines 3.1.1 (IAP requirement for digital goods) — MEDIUM confidence (guidelines as of training cutoff; verify current version at developer.apple.com)
- Apple App Store Review Guidelines Guideline 5.1.1 (privacy policy requirement for apps handling personal data) — MEDIUM confidence
- Expo documentation pattern for `infoPlist` privacy descriptions — HIGH confidence (standard Expo SDK practice)

---
*Pitfalls research for: BudgetBot — Node.js finance app security audit + Expo iOS App Store submission*
*Researched: 2026-02-19*


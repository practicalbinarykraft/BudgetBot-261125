# Feature Research

**Domain:** Personal finance app — code audit + iOS App Store release preparation
**Researched:** 2026-02-19
**Confidence:** HIGH (Apple App Store Guidelines fetched from official source; codebase fully inspected)

---

## Context: This Is a Subsequent Milestone

BudgetBot already ships. The mobile app (Expo SDK 54, React Native 0.81, New Architecture enabled) is feature-complete. The current goal is:

1. Pass a thorough code audit — security, performance, stability
2. Submit to the iOS App Store

This FEATURES.md maps **what must be checked / built / fixed** across both goals, not what new product features to add.

---

## Feature Landscape

### Table Stakes — Code Audit (Finance App)

Things an auditor will look for first. Missing or broken = critical finding.

| Check Area | Why It Matters | Complexity | Current State (from codebase inspection) |
|------------|---------------|------------|-----------------------------------------|
| **Authentication boundary enforcement** | Every API endpoint must verify `req.user` belongs to the resource being accessed — no IDOR (Insecure Direct Object Reference) | MEDIUM | `withAuth` / `withMobileAuth` guard all routes; userId taken from `req.user.id` (good). Spot-check all routes for consistent pattern. |
| **Input validation on all mutating endpoints** | Zod schemas prevent malformed data from reaching DB or AI calls | MEDIUM | Zod used in transactions, shared schema. Must verify 100% of POST/PUT/PATCH routes use schema validation, not just some. |
| **SQL injection protection** | Financial data is highest-value DB target | LOW | Drizzle ORM used throughout — parameterized queries by default. No raw `db.execute()` strings found. Maintain this pattern. |
| **Secrets not committed to git** | API keys, SESSION_SECRET, ENCRYPTION_KEY must never be in repo | LOW | `.env` used; `env.ts` validates at startup. Check git history for accidental commits. |
| **API keys encrypted at rest** | If DB is compromised, user BYOK keys must not be readable in plain text | MEDIUM | AES-256-GCM encryption implemented (`encryption.ts`). Legacy columns still exist — migration completeness must be verified. |
| **Password hashing** | Passwords must be bcrypt/argon2, never plain or MD5 | LOW | `bcrypt` and `bcryptjs` in dependencies. Verify rounds >= 10. |
| **JWT secret strength and expiry** | Weak or non-expiring tokens allow persistent compromise | LOW | 30-day expiry in `mobile-auth.ts`. SESSION_SECRET validated >= 32 chars. No refresh token rotation — acceptable for personal app. |
| **Rate limiting on auth and AI endpoints** | Brute-force protection and cost control | LOW | `authLimiter` (5/min), `aiLimiter` (10/min), `apiLimiter` (100/min) implemented. Verify all auth routes use `authLimiter`, not just general limiter. |
| **CORS locked to known origins** | Prevents cross-origin attacks | LOW | `corsMiddleware` with explicit `ALLOWED_ORIGINS` list. Good. Verify no wildcard fallback exists. |
| **CSP configured correctly** | Prevents XSS in web clients | MEDIUM | Helmet CSP configured but uses `'unsafe-inline'` and `'unsafe-eval'` — acceptable for SPA but worth noting as a finding. `hsts: false` because prod is HTTP-terminated at nginx — need to verify nginx adds HSTS header. |
| **Sensitive data not leaked in API responses** | Financial data endpoints must not return more than the user needs | MEDIUM | No global serialization layer found. Manual review needed: do user endpoints return other users' data? Do admin endpoints expose user PII unnecessarily? |
| **Error messages don't leak internals** | Stack traces and DB errors must not reach API consumers | LOW | `AppError` hierarchy wraps errors. `toAppError()` sanitizes unknown errors to generic 500. Production `NODE_ENV` check needed to confirm. |
| **Logging: no financial data in logs** | Logs are often less protected than DB | MEDIUM | Winston logger used. `logInfo`, `logError` pattern. Verify transaction amounts, API keys, tokens are never logged. Current `console.log` count in server: 33 — all in `env.ts` startup (intentional). |
| **Files above 500 LOC** | Single-responsibility violated; harder to audit | MEDIUM | `admin-metrics.service.ts` (772 LOC), `admin-users.service.ts` (570), `trend-calculator.service.ts` (551), `auth-telegram.routes.ts` (601), `transactions.routes.ts` (552). These need splitting per project rules (<150 LOC per file). |
| **`any` types in auth middleware** | Type safety gaps create hidden security holes | LOW | `withAuth` and `withMobileAuth` use `any` for generic params (structural, not problematic) but `(req as any).user = user` casts exist. This is a known tradeoff; document it. |
| **N+1 query protection** | Financial dashboards often trigger per-row DB calls | MEDIUM | `N1_OPTIMIZATION_SUMMARY.md` exists — optimizations done. Verify with query logging in tests. |
| **Silent null fallbacks** | `TODO: null fallback` patterns hide business logic bugs | MEDIUM | CONCERNS.md mentions this. Audit all fallback patterns in AI/OCR flow especially. |
| **Dependency audit** | Known CVEs in npm packages | LOW | Run `npm audit` — no evidence it was run recently. Finance app = higher standard. |

### Table Stakes — App Store Submission (Apple Requirements)

Requirements from Apple App Store Review Guidelines (fetched 2026-02-19 from developer.apple.com). Missing any of these = **rejection**.

| Requirement | Apple Guideline | Complexity | Current State |
|-------------|----------------|------------|---------------|
| **Bundle identifier** | Required field in app.json `ios.bundleIdentifier` | LOW | MISSING — `app.json` has no `bundleIdentifier`. Rejection guaranteed without it. Example: `com.budgetbot.app` |
| **Build number** | `ios.buildNumber` (CFBundleVersion), must be integer string | LOW | MISSING — `app.json` has no `ios.buildNumber`. Start at `"1"`. |
| **App version** | `version` in app.json (CFBundleShortVersionString), format `X.Y.Z` | LOW | Set to `"1.0.0"` — correct format. |
| **App icon 1024x1024 PNG** | Required, no alpha channel, no rounded corners (Apple applies mask) | LOW | `icon.png` exists in `assets/` but dimensions unverified. Must be exactly 1024x1024, RGB (no alpha). |
| **Splash screen image** | `splash.image` in app.json (currently missing — only `backgroundColor` set) | LOW | Only `backgroundColor: "#1a1a2e"` — no splash image. App will show blank dark screen on launch. Must add a splash image. |
| **Privacy Policy URL** | Required in App Store Connect metadata AND accessible in-app (Guideline 5.1.1(i)) | MEDIUM | No privacy policy page exists in mobile app. Must add link to hosted privacy policy. |
| **In-app account deletion** | Required since 2022 (Guideline 5.1.1(v)) | MEDIUM | MISSING — no account deletion flow found anywhere in mobile app or backend (`/api/account` DELETE endpoint absent). This will cause rejection. |
| **Privacy Manifest (`PrivacyInfo.xcprivacy`)** | Required since May 2024 for all apps. Declare data types collected and API categories used. | MEDIUM | MISSING — `app.json` has no `ios.privacyManifests` block. App uses `expo-secure-store`, `expo-image-picker`, `expo-av` — all require manifest entries. |
| **Camera permission string (NSCameraUsageDescription)** | Must be specific about why camera is used | LOW | MISSING — not in `app.json` `ios.infoPlist`. Receipt scanner uses `expo-image-picker` which opens camera. |
| **Photo library permission string (NSPhotoLibraryUsageDescription)** | Must explain why photos are accessed | LOW | MISSING — receipt scanner picks from library. |
| **Microphone permission string (NSMicrophoneUsageDescription)** | Must explain microphone use | LOW | MISSING — voice input uses `expo-av` which records audio. |
| **App Tracking Transparency (ATT)** | Any tracking requires explicit permission (Guideline 5.1.2) | LOW | Not applicable — no tracking SDKs found. Declare `NSPrivacyTracking: false` in manifest. |
| **EAS Build configuration** | `eas.json` required for EAS Build, which produces the `.ipa` for App Store | MEDIUM | MISSING — no `eas.json` found in project. Cannot submit without a production build. |
| **Apple Developer Program membership** | Required to submit. Costs $99/year. | LOW | External requirement — not in codebase. |
| **App Store Connect app record** | Must create app record before submitting binary | LOW | External — done in App Store Connect. |
| **Screenshots for all required device sizes** | iPhone 6.7" (required), iPhone 6.5" (required), iPad 12.9" (if supportsTablet: true) | MEDIUM | No screenshots exist. `supportsTablet: true` in app.json means iPad screenshots also required. |
| **App description and metadata** | Title (30 chars max), subtitle (30 chars max), description (4000 chars max), keywords | LOW | Not prepared. |
| **Minimum iOS version** | Set `ios.deploymentTarget` — recommend 16.0+ | LOW | Not set in app.json — defaults to Expo SDK 54 minimum (iOS 16.0). Explicit declaration recommended. |
| **New Architecture compatibility** | `newArchEnabled: true` is set — must verify all libraries support it | MEDIUM | Set in app.json. `react-native-reanimated ~4.1.1`, `react-native-gesture-handler ~2.28.0` — both support New Arch. No known blockers but EAS build will surface incompatibilities. |
| **No web-wrapper rejection risk** | App must have native value beyond website (Guideline 4.2) | LOW | App uses expo-secure-store, expo-av, expo-image-picker — genuine native functionality. Not a web wrapper. Low risk. |

### Differentiators (Nice-to-Have for Approval and User Experience)

These don't cause rejection but improve approval chances, user retention, and App Store ranking.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Biometric authentication (Face ID / Touch ID)** | Finance app users expect biometric lock. Signals security maturity to reviewer. | MEDIUM | `expo-local-authentication` not in dependencies. Would need to add. |
| **Offline-first core screens** | Dashboard and transaction list show cached data when offline. Apple reviewers test on devices. | HIGH | No offline handling found. React Query provides stale-while-revalidate, but no explicit offline state UI. |
| **App Store rating prompt** | Increases App Store rating over time | LOW | `expo-store-review` can trigger native review prompt at right moment. |
| **Deep links / Universal Links** | Telegram bot can open specific screens in the app | MEDIUM | Not configured. Requires `ios.associatedDomains` in app.json and server `.well-known/apple-app-site-association`. |
| **Accessibility (VoiceOver)** | Apple checks accessibility compliance | MEDIUM | No `accessibilityLabel` props found in spot check of screens. Should add labels to icon-only buttons. |
| **Sentry / Crash reporting in mobile** | Catch crashes before users report them | LOW | `@sentry/react-native` not in mobile dependencies (only `@sentry/node` and `@sentry/react` in server). Add `@sentry/react-native`. |
| **HSTS header on production** | Nginx redirects HTTP→HTTPS but HSTS header not confirmed | LOW | Add `add_header Strict-Transport-Security "max-age=31536000"` to nginx HTTPS server block. |
| **Push notifications** | Re-engagement for budget alerts | HIGH | Socket.IO websocket used for web; mobile would need `expo-notifications` + APNs setup. Out of scope for initial release per PROJECT.md. |
| **App preview video** | Improves conversion on App Store listing | HIGH | Optional but helps finance apps stand out. Out of scope for initial release. |

### Anti-Features (Things to Avoid — Will Cause Rejection)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Showing pricing tiers in the app without IAP** | Guideline 3.1.1: if the app offers paid tiers, iOS App Store requires in-app purchase. The BillingScreen shows `$X/month` pricing and tiers. If users can purchase via website and the iOS app shows those tiers, Apple may demand IAP integration. | Either (a) hide pricing and purchase UI entirely from iOS build (use a "Manage on web" message), or (b) implement StoreKit2 IAP. Option (a) is far simpler for initial release. |
| **BYOK allowing users to enter external API keys** | Apple Guideline 3.1.1 and broader policy: Apple scrutinizes apps that help users access paid third-party services without going through App Store IAP. The BYOK flow (user enters own Anthropic/OpenAI key) is likely fine because there's no monetary transaction — the user already has the key. However, the reviewer needs to understand the flow clearly. | Keep BYOK but ensure the description in App Store metadata and the in-app UI makes it crystal clear this is not a purchase. |
| **Downloading and executing remote JavaScript** | Guideline 2.5.2 prohibits loading and executing JS that changes app behavior. Expo OTA updates (expo-updates) ARE allowed for bug fixes but not for major feature additions. | Do not use `expo-updates` for adding new features post-review. Keep EAS Update scope limited to bug fixes. |
| **Excessive permission requests** | Requesting permissions not used in core flow triggers manual scrutiny | Only request camera/microphone/photos at the point of use (receipt scanner, voice input). Do not request on app launch. |
| **Login required for all content before showing any value** | Guideline 5.1.1(v): apps should not require login before showing any functionality | The current auth flow goes straight to login screen. Consider showing a brief onboarding/demo or at least value proposition screen before forcing login. This is a soft guideline but reviewers notice it. |
| **Hardcoded production credentials in code** | Security finding that triggers rejection | Already mitigated via `env.ts` and `.env` pattern. Verify git history is clean. |
| **Screenshots that show placeholder UI or loading states** | Metadata integrity check (Guideline 2.3) | Screenshots must show actual app with real or realistic data. |

---

## Feature Dependencies

```
[Bundle Identifier] ──required──> [EAS Build] ──required──> [App Store Connect Upload]
                                                                  └──requires──> [Screenshots]
                                                                  └──requires──> [Privacy Policy URL]
                                                                  └──requires──> [App Metadata]

[Privacy Manifest] ──required──> [EAS Build passes]

[Permission Strings (Camera/Mic/Photos)] ──required──> [Receipt Scanner works on device]
                                                         └──also required──> [Voice Input works on device]

[Account Deletion Endpoint] ──required──> [Account Deletion UI in mobile]
                              └──required for──> [App Store approval since 2022]

[BillingScreen IAP decision] ──blocks or gates──> [App Store submission]
    (must either hide pricing UI on iOS OR implement StoreKit2 before submitting)

[Legacy unencrypted API keys in DB] ──blocks──> [Security audit pass]
    (migration to encrypted columns must be 100% complete, legacy columns dropped)

[File size violations (>500 LOC)] ──blocks──> [Clean code audit]
    (auth-telegram.routes.ts, transactions.routes.ts, admin-metrics.service.ts etc.)

[EAS Build] ──requires──> [Apple Developer Program membership ($99/yr)]
             ──requires──> [Distribution certificate + provisioning profile]
```

### Dependency Notes

- **BillingScreen must be resolved before EAS Build**: If App Store review sees a pricing/upgrade screen that doesn't use IAP, rejection is near-certain. Decision needed upfront.
- **Privacy Manifest before EAS Build**: Apple's Transporter will reject the binary upload if `PrivacyInfo.xcprivacy` is missing or incomplete. Can be configured entirely in `app.json` under `expo.ios.privacyManifests`.
- **Account deletion before submission**: Apple's review team will attempt to delete an account as part of review. If no mechanism exists, rejection is immediate.
- **Security audit (legacy columns, oversized files) is independent of App Store prep**: Both tracks can run in parallel.

---

## MVP Definition

### Launch With (v1 — minimum viable for App Store approval)

- [ ] `ios.bundleIdentifier` added to `app.json` — required for any build
- [ ] `ios.buildNumber` added to `app.json` — required for App Store upload
- [ ] App icon verified: 1024x1024 PNG, no alpha, correct color profile
- [ ] Splash screen image added to `app.json`
- [ ] Privacy Policy written and hosted at a public URL
- [ ] Privacy Policy link accessible inside the app (ProfileScreen settings section)
- [ ] Account deletion: `DELETE /api/account` backend endpoint + "Delete Account" button in ProfileScreen
- [ ] Privacy Manifest (`ios.privacyManifests`) added to `app.json` with correct data types
- [ ] `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSMicrophoneUsageDescription` added to `app.json` `ios.infoPlist`
- [ ] `eas.json` created with `production` build profile
- [ ] BillingScreen resolved: either hide pricing UI on iOS (`Platform.OS === 'ios'` guard) or implement IAP
- [ ] App Store Connect app record created (external step)
- [ ] Screenshots for iPhone 6.7", 6.5", and iPad 12.9" prepared
- [ ] App metadata (title, description, keywords, age rating 4+) written

### Add After Validation (v1.x)

- [ ] Biometric authentication — trigger: user feedback requesting it
- [ ] `expo-store-review` rating prompt — trigger: user has logged 10+ transactions
- [ ] `@sentry/react-native` crash reporting — trigger: first crash report from production
- [ ] HSTS header in nginx — trigger: before v1.x public promotion

### Future Consideration (v2+)

- [ ] Offline-first mode — trigger: user complaint about poor connectivity experience
- [ ] StoreKit2 IAP — trigger: decision to sell subscriptions through iOS instead of web
- [ ] Deep links from Telegram bot to mobile screens — trigger: user request
- [ ] Push notifications — trigger: out of scope per PROJECT.md, revisit after iOS launch

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Bundle identifier + build number | LOW (technical) | LOW | P1 — blocks everything |
| Privacy Manifest | LOW (legal) | LOW | P1 — blocks EAS Build |
| Permission strings (Camera/Mic/Photo) | LOW (legal) | LOW | P1 — blocks device features |
| Account deletion (backend + UI) | MEDIUM | MEDIUM | P1 — Apple rejection if missing |
| Privacy Policy page + link | LOW (legal) | LOW | P1 — Apple rejection if missing |
| App icon 1024x1024 verified | LOW (visual) | LOW | P1 — blocks submission |
| Splash screen image | MEDIUM (UX) | LOW | P1 — blank screen on launch |
| BillingScreen IAP decision | HIGH (business) | LOW (hide) / HIGH (IAP) | P1 — blocks submission |
| EAS Build (`eas.json`) | LOW (tooling) | LOW | P1 — blocks submission |
| Screenshots + metadata | LOW (marketing) | MEDIUM | P1 — blocks submission |
| Security audit: legacy columns dropped | HIGH (security) | LOW | P1 — code audit pass |
| Security audit: oversized files split | MEDIUM (maintainability) | MEDIUM | P1 — code audit pass |
| Security audit: dependency CVE scan | HIGH (security) | LOW | P1 — code audit pass |
| Security audit: endpoint auth coverage | HIGH (security) | MEDIUM | P1 — code audit pass |
| Biometric auth | HIGH (UX) | MEDIUM | P2 — post-launch |
| Sentry React Native | MEDIUM (ops) | LOW | P2 — post-launch |
| HSTS header in nginx | MEDIUM (security) | LOW | P2 — minor hardening |
| Offline-first core screens | HIGH (UX) | HIGH | P3 — significant effort |

---

## Competitor Feature Analysis

| Feature | Mint (defunct) / YNAB | Monarch Money | BudgetBot Approach |
|---------|----------------------|---------------|-------------------|
| Privacy Policy | Yes, hosted + in-app | Yes | Must add |
| Account deletion | In-app button | In-app button | Must add (Apple requirement) |
| Biometric lock | Face ID/Touch ID | Face ID/Touch ID | Nice-to-have, not required for v1 |
| Offline access | Cached data | Cached data | Not implemented; defer to v2 |
| AI-powered OCR | No (Mint), No (YNAB) | No | Differentiator — already built |
| IAP for premium | StoreKit2 | StoreKit2 | Decision needed: hide or implement |

---

## Sources

- Apple App Store Review Guidelines — fetched 2026-02-19 from `developer.apple.com/app-store/review/guidelines/` — **HIGH confidence**
- Apple Privacy Manifest documentation — referenced in `@expo/config-types` type definitions (confirmed field `ios.privacyManifests` exists and is typed) — **HIGH confidence**
- BudgetBot codebase — fully inspected (`server/`, `mobile/`, `app.json`, `package.json`) — **HIGH confidence**
- Expo SDK 54 config type definitions (`@expo/config-types/build/ExpoConfig.d.ts`) — inspected in `mobile/node_modules/` — **HIGH confidence**
- Apple guideline on account deletion (5.1.1(v)) — mandatory since June 2022, confirmed in guidelines — **HIGH confidence**
- Apple guideline on financial apps (5.1.1(ix)) re: legal entity requirement — confirmed in guidelines — **HIGH confidence**

---

## Key Gaps / Open Questions

1. **Legal entity question**: Apple Guideline 5.1.1(ix) states apps providing financial services must be submitted by a legal entity, not an individual. BudgetBot is a personal finance *tracker* (not a bank, broker, or money transmitter) — this is likely fine for an individual developer account. Verify with Apple's definition: personal finance trackers are generally category 4+ personal apps, not "financial services" under 5.1.1(ix). Needs confirmation before investing in company registration.

2. **BillingScreen business decision**: Must decide before building: hide iOS pricing/upgrade UI (`Platform.OS === 'ios'` guard + "Manage subscription at budgetbot.online") vs. implement StoreKit2 IAP. Hiding is low-cost for v1. IAP is 2-4 weeks of additional work and requires sandbox testing.

3. **Privacy Policy content**: Must be written before submission. Needs to cover: data collected (email, transactions, AI-processed receipts), third parties (Anthropic API, OpenAI API for fallback, Sentry for errors), data retention, user rights, contact information.

4. **Legacy encrypted API key columns**: `ENCRYPTION_SETUP.md` mentions legacy columns (`anthropic_api_key`, `openai_api_key`) should be dropped "after verification." Current state unknown — needs DB schema check to confirm if migration is complete.

---

*Feature research for: BudgetBot — code audit + iOS App Store release*
*Researched: 2026-02-19*


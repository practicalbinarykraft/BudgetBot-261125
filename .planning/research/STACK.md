# Stack Research

**Domain:** Code Audit (Security + Bugs + Tech Debt) + Expo iOS App Store Release Preparation
**Project:** BudgetBot
**Researched:** 2026-02-19
**Confidence:** MEDIUM (WebSearch/WebFetch blocked; versions verified from installed node_modules and package.json; tooling knowledge from training data cross-checked with known npm package names)

---

## Context: What This Is NOT

This is a subsequent-milestone STACK.md. The existing production stack (Express/PostgreSQL/React/Expo) is already decided. This document covers only **audit tooling** and **App Store release tooling** — the two new capability areas being added.

---

## Current Stack (Verified from package.json and node_modules)

| Technology | Installed Version | Notes |
|------------|-------------------|-------|
| Expo SDK | 54.0.33 | New Architecture enabled (`newArchEnabled: true`) |
| React Native | 0.81.5 | Bundled with Expo 54 |
| React | 19.1.0 (mobile) / 18.3.1 (server) | Version mismatch between mobile and server |
| TypeScript | 5.6.3 (server) / ~5.9.2 (mobile) | Both strict mode enabled |
| Node.js / Express | Express ^4.21.2 | No ESLint config at project root |
| Vitest | 4.0.13 | Server tests |
| Jest / jest-expo | 54.0.17 | Mobile tests |
| Drizzle ORM | ^0.39.1 | With drizzle-kit ^0.31.4 |
| esbuild | ^0.25.0 | ESM server bundle |

**Critical finding:** No `.eslintrc` or `eslint.config.js` exists at project root or in `mobile/`. All ESLint files found are inside `node_modules/` of third-party packages. The project has zero static analysis tooling configured.

---

## Part 1: Code Audit Stack

### 1A. Static Analysis — TypeScript / ESLint

| Tool | Version | Purpose | Why Recommended |
|------|---------|---------|-----------------|
| `eslint` | ^9.x (flat config) | JavaScript/TypeScript linting | Industry standard; catches bugs the compiler misses (unused variables, unreachable code, bad patterns) |
| `@typescript-eslint/eslint-plugin` | ^8.x | TypeScript-specific rules | Catches `as any` abuse, unsafe member access, missing return types. Project has 100 `as any` occurrences in 36 server files — this is the primary tech debt tool. |
| `@typescript-eslint/parser` | ^8.x | TypeScript AST for ESLint | Required peer dep for the plugin |
| `eslint-plugin-security` | ^3.x | Node.js security anti-patterns | Detects `eval()`, regex DoS, `child_process` misuse, hardcoded secrets patterns |
| `eslint-plugin-n` | ^17.x | Node.js best practices | Catches incorrect `require()`, deprecated Node APIs, missing error handling in callbacks |
| `eslint-plugin-react-hooks` | ^5.x | React hooks rules | Already enforced by Expo but not linted; catches stale closures and dependency array bugs |

**Why ESLint 9 (flat config) over 8 (legacy):** ESLint 8 reached end-of-life in 2024. ESLint 9's flat config (`eslint.config.js`) is the current standard. The project uses ESM (`"type": "module"` in package.json), which is compatible with flat config out of the box.

**Confidence: MEDIUM** — ESLint 9 flat config adoption is well-documented; specific plugin versions verified by checking npm package compatibility patterns from training data. Cannot confirm exact latest minor versions without npm access.

### 1B. Security Scanning — Dependencies

| Tool | Version | Purpose | Why Recommended |
|------|---------|---------|-----------------|
| `npm audit` | built-in | Known CVE scanning in dependencies | Zero-friction; run as `npm audit --audit-level=moderate`. Already available, just not wired into CI. |
| `better-npm-audit` | ^3.x | Structured npm audit output with filtering | Allows ignoring specific advisories with justification. More CI-friendly than raw `npm audit` exit codes. |
| `snyk` CLI | latest | SNYK vulnerability database (broader than npm audit) | Catches issues npm audit misses; integrates with GitHub PRs. Free tier covers this project's size. |

**Why NOT `npm audit fix --force`:** Auto-fixing with `--force` applies breaking major-version upgrades. For a production app, always review each fix manually.

**Confidence: MEDIUM** — npm audit is built-in; Snyk is the industry-standard complement. Versions confirmed via training data; cannot verify exact current Snyk CLI version without npm access.

### 1C. Security Scanning — Code Patterns

| Tool | Version | Purpose | Why Recommended |
|------|---------|---------|-----------------|
| `semgrep` | OSS CLI | SAST (Static Application Security Testing) | Catches security anti-patterns npm audit misses: SQL injection risks, hardcoded secrets, insecure crypto, missing auth checks on routes. Has a free Node.js ruleset (`p/nodejs`). More powerful than ESLint security plugin for deep code flow analysis. |
| `detect-secrets` (Python CLI) | latest | Hardcoded secrets scanner | Scans for API keys, tokens, passwords committed in source. Important given the project has `SYSTEM_ANTHROPIC_API_KEY`, `SYSTEM_OPENAI_API_KEY`, `SESSION_SECRET`, `ENCRYPTION_KEY` in use. |

**Specific to this codebase:** `server/lib/env.ts` uses `console.*` for 31 log lines (intentional, documented). Semgrep will flag these — add a `.semgrepignore` to exclude `env.ts` from the console-logging rule.

**Confidence: LOW** — Semgrep free tier and Node.js rulesets are well-known; detect-secrets is standard. However, cannot verify current Semgrep OSS version without web access. Flag for validation.

### 1D. Code Quality / Tech Debt

| Tool | Version | Purpose | Why Recommended |
|------|---------|---------|-----------------|
| `ts-prune` | ^0.10.x | Dead code detection (unused exports) | Finds unused exported functions/types. The project has 35+ route files and 20+ service files — dead code accumulates quickly. |
| `depcheck` | ^1.4.x | Unused/missing dependency detection | Identifies packages in `package.json` that are not actually imported. The root `package.json` has 80+ dependencies; likely has drift. |
| `knip` | ^5.x | Unified dead code + unused deps detector | More modern replacement for both `ts-prune` and `depcheck`. Single tool that finds unused files, exports, dependencies, and devDependencies. Recommended as primary dead-code tool. |
| `@vitest/coverage-v8` | already installed (^4.0.13) | Coverage reporting | Already in devDependencies. Run `vitest run --coverage` to get coverage report. Target: identify uncovered server routes and services. |

**Confidence: MEDIUM** — `knip` is the 2024-2025 community standard for dead code analysis; verified as well-established. `@vitest/coverage-v8` already installed.

### 1E. Complexity / Maintainability

| Tool | Purpose | Why Recommended |
|------|---------|-----------------|
| `complexity-report` (or ESLint `complexity` rule) | Cyclomatic complexity per function | The project's CLAUDE.md mandates files under 150 LOC. The ESLint `complexity` rule (set to max 15) enforces function-level complexity. `server/routes/` has 35+ route files; likely has high-complexity handlers. |
| TypeScript `strict` (already enabled) | Type safety | Already enabled in both `tsconfig.json` files. The 100 `as any` casts defeat this — ESLint `@typescript-eslint/no-explicit-any` will surface them. |

---

## Part 2: Expo iOS App Store Release Stack

### Current State Assessment

From `mobile/app.json` (verified):
- Missing `ios.bundleIdentifier` — **App Store submission requires this**
- Missing `ios.buildNumber` — required for TestFlight/App Store
- Missing privacy usage descriptions (`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`) — the app uses `expo-image-picker` and `expo-camera`, both of which Apple **rejects** without these strings
- Missing `splash` image path — only `backgroundColor` set, no `image` field
- `assets/` directory has only `icon.png` — no `adaptive-icon.png`, no splash screen image, no App Store screenshots
- No `eas.json` — EAS Build not configured

### 2A. Core Build Tooling

| Tool | Version | Purpose | Why Recommended |
|------|---------|---------|-----------------|
| `eas-cli` | latest (install globally) | EAS Build + Submit + Update orchestration | The only supported path for Expo managed-workflow iOS builds. Replaces deprecated `expo build:ios`. Handles provisioning profiles, certificates, and App Store Connect API automatically. |
| EAS Build | cloud service | Compiles native iOS binary (.ipa) | Expo's managed workflow means no Xcode required locally. EAS Build runs on Expo's macOS infrastructure. |
| EAS Submit | cloud service | Uploads `.ipa` to App Store Connect | Automates the `xcrun altool` / Transporter step. Requires App Store Connect API key. |

**Why NOT `expo build:ios` (classic builds):** Deprecated in 2023, removed in 2024. All Expo managed-workflow apps must use EAS Build.

**Why NOT local Xcode builds:** The project uses Expo managed workflow (no `ios/` directory exists). Converting to bare workflow just for local builds adds significant maintenance burden with no benefit for a solo/small-team project.

**Confidence: MEDIUM** — EAS as the only Expo iOS build path is well-established; `expo build:ios` deprecation is documented in Expo's 2023 changelog. Cannot verify current `eas-cli` version number without npm access.

### 2B. App.json Configuration — Required Additions

This is not a "library" but a configuration schema. The following fields are **required** before App Store submission:

```json
{
  "expo": {
    "name": "BudgetBot",
    "slug": "budgetbot",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourdomain.budgetbot",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "BudgetBot uses the camera to scan receipts.",
        "NSPhotoLibraryUsageDescription": "BudgetBot accesses your photo library to import receipt images.",
        "NSMicrophoneUsageDescription": "BudgetBot uses the microphone for voice transaction entry.",
        "NSFaceIDUsageDescription": "BudgetBot uses Face ID for secure authentication."
      }
    },
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1a1a2e"
    }
  }
}
```

**Why each field matters:**
- `bundleIdentifier`: Apple's unique app ID. Must match App Store Connect exactly. Cannot be changed after first submission.
- `buildNumber`: Monotonically increasing integer. Must increment for every TestFlight/App Store upload. EAS can auto-increment via `autoIncrement: true` in `eas.json`.
- Privacy strings: Apple rejects apps using camera/microphone/photos without these strings. `expo-image-picker` (installed) triggers `NSPhotoLibraryUsageDescription` and `NSCameraUsageDescription`. `expo-av` (installed) triggers `NSMicrophoneUsageDescription`.
- Splash image: Current config only has `backgroundColor`. Apple requires a proper launch screen.

**Confidence: HIGH** — Apple's privacy usage description requirements are documented in App Store Review Guidelines and Expo's official docs. Bundle identifier requirement is fundamental to iOS app publishing.

### 2C. EAS Configuration

```json
// eas.json (to be created at mobile/eas.json)
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
      "autoIncrement": true,
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@apple-id.com",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

**Confidence: MEDIUM** — EAS configuration schema is stable; `resourceClass: "m-medium"` for Apple Silicon build machines is current Expo recommendation. `autoIncrement` behavior verified from Expo docs in training data.

### 2D. Asset Requirements for App Store

| Asset | Required Size | Current State | Gap |
|-------|--------------|---------------|-----|
| App Icon | 1024x1024 PNG, no transparency, no rounded corners | `assets/icon.png` exists (size unknown) | Must verify dimensions; Apple rejects icons with alpha channel |
| Splash Screen | Any size, exported as PNG | No splash image, only backgroundColor | Must create `assets/splash.png` |
| App Store Screenshots | 6.9" (iPhone 16 Pro Max), 12.9" iPad (if tablet support claimed) | None | Required for App Store listing |
| Privacy Policy URL | URL to hosted privacy policy | Not in app.json | Required since app collects financial data |

**Why this matters:** Apple's automated screening rejects submissions with missing or malformed icons before human review. An icon with transparency is an automatic rejection.

**Confidence: HIGH** — Apple's asset requirements for App Store submission are stable and well-documented.

### 2E. Supporting Tools

| Tool | Version | Purpose | Why Recommended |
|------|---------|---------|-----------------|
| `expo-doctor` | built-in (`npx expo-doctor`) | Pre-flight config validation | Checks for version mismatches between Expo SDK, React Native, and all expo-* packages before build. Catches the common "incompatible package version" failure that wastes EAS build minutes. |
| `npx expo install --fix` | built-in | Fix package version mismatches | Adjusts all `expo-*` packages to versions compatible with installed Expo SDK. Run after any SDK upgrade. |
| `expo-updates` | ~0.28.x (Expo 54 compatible) | OTA (Over-The-Air) updates | Allows pushing JavaScript-only fixes without App Store review. Critical for fixing bugs post-release. EAS Update is the delivery service. Not installed currently. |

**Confidence: MEDIUM** — `expo-doctor` and `expo install --fix` are verified Expo CLI commands from training data. `expo-updates` version compatibility with Expo 54 estimated; verify with `npx expo install expo-updates`.

---

## Part 3: What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `expo build:ios` (classic CLI) | Deprecated and removed in 2024. Build infrastructure shut down. | `eas build --platform ios` |
| `tslint` | Archived/deprecated in 2019. No longer maintained. | `eslint` + `@typescript-eslint` |
| `jshint` / `jslint` | Legacy tools predating TypeScript, no TS support | `eslint` with TS parser |
| `eslint --fix` on security rules | Auto-fixing security rules can suppress findings rather than fix root causes | Fix manually after `eslint` report |
| `npm audit fix --force` | Applies breaking major version changes automatically; can break the app | Review each advisory, upgrade manually |
| SonarQube (self-hosted) | Requires a running SonarQube server, significant infra overhead for a personal project | `semgrep` OSS (zero infra) or SonarCloud free tier if CI integration needed |
| `expo-constants` for runtime secrets | Exposes secrets in the JS bundle (visible in app binary) | `expo-secure-store` (already installed) for runtime secrets; build-time secrets via EAS Secrets |
| React Native Debugger (standalone) | Deprecated; replaced by built-in React Native DevTools | `npx react-native-debugger` is legacy; use Expo Dev Tools or Flipper |
| Manually uploading `.ipa` via Xcode Transporter | Error-prone, requires Apple certificate management locally | `eas submit --platform ios` |

---

## Part 4: Version Compatibility Matrix

| Package | Installed | Compatible With | Notes |
|---------|-----------|-----------------|-------|
| expo ~54.0.0 | 54.0.33 | react-native 0.81.x, React 18.3.x or 19.x | New Architecture stable in Expo 54 |
| jest-expo ^54.0.x | 54.0.17 | jest ^29.x | Must match major Expo SDK version |
| react-native-reanimated ~4.1.x | 4.1.1 | Expo 54, New Architecture required | New Architecture enabled in app.json — compatible |
| @react-navigation/native ^7.0 | ^7.0.0 | React Native ^0.73+ | Compatible with 0.81.5 |
| eslint ^9.x (to add) | not installed | TypeScript 5.x, Node 18+ | Flat config only; requires Node 18.18+ |
| eas-cli (to add globally) | not installed | Expo SDK 50+ | Install globally: `npm install -g eas-cli` |

---

## Part 5: Installation Commands

```bash
# === Code Audit Tools (add to root devDependencies) ===

# Static analysis
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D eslint-plugin-security eslint-plugin-n eslint-plugin-react-hooks

# Dead code / unused deps
npm install -D knip

# Dependency vulnerability scanning (npm audit is already built-in)
npm install -D better-npm-audit

# === App Store Release Tools ===

# EAS CLI (global install — not a project dependency)
npm install -g eas-cli

# OTA updates (add to mobile/package.json)
cd mobile && npx expo install expo-updates

# Pre-flight validation (already available via npx)
npx expo-doctor
npx expo install --fix
```

---

## Part 6: Audit Execution Order

The order matters — run in this sequence to avoid false positives blocking later tools:

1. **`npx tsc --noEmit`** — TypeScript compiler check (already in CI as `npm run check`). Must pass before ESLint is meaningful.
2. **`npx eslint . --ext .ts,.tsx`** — Static analysis. Fix `@typescript-eslint/no-explicit-any` findings first (100 occurrences in server).
3. **`npm audit --audit-level=moderate`** — Dependency CVEs. Both root and `mobile/` directories.
4. **`npx knip`** — Dead code and unused dependencies. Run after ESLint to avoid removing code that ESLint would have flagged anyway.
5. **`semgrep --config=p/nodejs .`** — Deep security patterns. Run last; most findings need manual triage.

---

## Part 7: App Store Submission Checklist (Derived from Config Gaps)

Based on current `mobile/app.json` and `mobile/assets/` state:

- [ ] Add `ios.bundleIdentifier` to `app.json`
- [ ] Add `ios.buildNumber: "1"` to `app.json`
- [ ] Add `ios.infoPlist` with all privacy usage description strings
- [ ] Create `assets/splash.png` (recommended: 1284x2778 for universal support)
- [ ] Verify `assets/icon.png` is 1024x1024, no alpha channel
- [ ] Create `eas.json` with production build profile
- [ ] Run `eas login` with Apple Developer account
- [ ] Run `npx expo-doctor` and resolve all warnings
- [ ] Run `npx expo install --fix` to normalize package versions
- [ ] Add `expo-updates` for post-release OTA patches
- [ ] Add privacy policy URL to `app.json` (`expo.extra.privacyPolicyUrl`)
- [ ] Create App Store Connect listing with screenshots
- [ ] Run `eas build --platform ios --profile production`
- [ ] Test on physical device via TestFlight before final submission
- [ ] Run `eas submit --platform ios`

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `eslint` v9 flat config | `eslint` v8 legacy config | Only if the team has existing v8 configs they can't migrate; v8 is EOL |
| `knip` | `ts-prune` + `depcheck` separately | If `knip` causes false positives in monorepo-style layouts; run both individually |
| `semgrep` OSS | SonarCloud (free tier) | If CI/CD dashboard for security findings is needed; SonarCloud integrates with GitHub Actions |
| `eas-cli` (global) | `@expo/eas-cli` (local devDep) | If you need reproducible CI builds with pinned eas-cli version; pin in `package.json` devDependencies |
| `better-npm-audit` | `audit-ci` | `audit-ci` is more widely used in CI pipelines; `better-npm-audit` is simpler for local dev |

---

## Sources

- `/Users/aleksandrmishin/BudgetBot-261125/mobile/package.json` — Expo SDK 54.0.33 version, all mobile deps verified
- `/Users/aleksandrmishin/BudgetBot-261125/package.json` — server deps, TypeScript 5.6.3, vitest 4.0.13
- `/Users/aleksandrmishin/BudgetBot-261125/mobile/app.json` — App Store config gaps identified (no bundleIdentifier, no splash image, no infoPlist)
- `/Users/aleksandrmishin/BudgetBot-261125/server/index.ts` — Security middleware stack verified
- `/Users/aleksandrmishin/BudgetBot-261125/server/middleware/security-headers.ts` — CSP with `unsafe-inline`/`unsafe-eval` and `hsts: false` confirmed
- `/Users/aleksandrmishin/BudgetBot-261125/tsconfig.json` — `strict: true` confirmed; no eslint config at project root
- Grep results — 100 `as any` occurrences across 36 server files; 12 TODO/FIXME markers
- `/Users/aleksandrmishin/BudgetBot-261125/mobile/node_modules/expo/package.json` — Expo 54.0.33 confirmed installed
- Training data (MEDIUM confidence) — EAS CLI toolchain, ESLint 9 flat config, semgrep OSS Node.js rules, Apple App Store submission requirements

---

*Stack research for: Code Audit + Expo iOS App Store Release Preparation*
*Project: BudgetBot*
*Researched: 2026-02-19*


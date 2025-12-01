# 🧪 Client Environment Validation Testing Guide

## Overview

This guide helps you test the client-side environment variable validation to ensure type-safe configuration and early error detection.

---

## 🎯 What We're Testing

### Client Env Validation Features
- ✅ Validates Vite environment variables on startup
- ✅ Type-safe access to env vars throughout the app
- ✅ Clear error messages for invalid/missing variables
- ✅ Development vs production mode detection
- ✅ Optional variables with defaults
- ✅ Feature flags based on env vars

---

## 📋 Prerequisites

1. **Development environment:**
   ```bash
   cd /Users/aleksandrmishin/Downloads/BudgetBot-Improved
   npm run dev
   ```

2. **Client env module:**
   - `client/src/lib/env.ts` exists
   - Imported in `client/src/main.tsx`

---

## 🧪 Test Scenarios

### Test 1: Valid Environment (Default)

**What it tests:** All env vars are valid or optional

**Steps:**
1. Start development server:
   ```bash
   npm run dev
   ```

2. Open browser console (F12)

**Expected Result:**
```
✅ Client environment variables validated
📋 Client config: {
  MODE: 'development',
  API_URL: '(same origin)',
  SENTRY: 'disabled',
  ANALYTICS: 'disabled'
}
```

**Verify:**
- ✅ Green checkmark in console
- ✅ No errors
- ✅ Config object logged
- ✅ App starts normally

---

### Test 2: With API URL

**What it tests:** VITE_API_URL validation

**Steps:**
1. Create `.env.local`:
   ```bash
   VITE_API_URL=https://api.example.com
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

3. Check browser console

**Expected Result:**
```
✅ Client environment variables validated
📋 Client config: {
  MODE: 'development',
  API_URL: 'https://api.example.com',
  SENTRY: 'disabled',
  ANALYTICS: 'disabled'
}
```

**Verify:**
- ✅ API_URL shown correctly
- ✅ No validation errors

---

### Test 3: Invalid API URL

**What it tests:** URL validation catches invalid URLs

**Steps:**
1. Edit `.env.local`:
   ```bash
   VITE_API_URL=not-a-valid-url
   ```

2. Restart dev server

3. Check browser console

**Expected Result:**
```
❌ Client environment validation failed:
  VITE_API_URL: Invalid url
```

**Verify:**
- ✅ Red error in console
- ✅ Clear error message
- ✅ App shows error (in development)

---

### Test 4: With Sentry DSN

**What it tests:** Sentry DSN validation and feature flag

**Steps:**
1. Edit `.env.local`:
   ```bash
   VITE_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/1234567
   ```

2. Restart dev server

3. Check console

**Expected Result:**
```
✅ Client environment variables validated
📋 Client config: {
  MODE: 'development',
  API_URL: '(same origin)',
  SENTRY: 'enabled',
  ANALYTICS: 'disabled'
}
```

**Verify:**
- ✅ SENTRY shows 'enabled'
- ✅ `features.sentry` is true

**Test in code:**
```tsx
import { features } from './lib/env';

if (features.sentry) {
  // Initialize Sentry
  console.log('Sentry enabled!');
}
```

---

### Test 5: With Analytics

**What it tests:** Boolean transformation of string env var

**Steps:**
1. Edit `.env.local`:
   ```bash
   VITE_ENABLE_ANALYTICS=true
   ```

2. Restart dev server

3. Check console

**Expected Result:**
```
✅ Client environment variables validated
📋 Client config: {
  MODE: 'development',
  API_URL: '(same origin)',
  SENTRY: 'disabled',
  ANALYTICS: 'enabled'
}
```

**Verify:**
- ✅ ANALYTICS shows 'enabled'
- ✅ `features.analytics` is true

---

### Test 6: Production Build

**What it tests:** Validation works in production build

**Steps:**
1. Create `.env.production`:
   ```bash
   VITE_API_URL=https://api.budgetbot.com
   VITE_SENTRY_DSN=https://abc@sentry.io/123
   ```

2. Build for production:
   ```bash
   npm run build
   ```

3. Preview production build:
   ```bash
   npm run preview
   ```

4. Check browser console

**Expected Result:**
- ✅ No validation errors
- ✅ No console logs (production mode)
- ✅ App works normally

**Verify:**
- ✅ Build succeeds
- ✅ Preview starts
- ✅ No errors in console
- ✅ API calls use correct URL

---

### Test 7: Type Safety

**What it tests:** TypeScript type checking

**Steps:**
1. Create test file:
   ```tsx
   // client/src/test-env.ts
   import { env, features } from './lib/env';

   // ✅ Valid - should compile
   console.log(env.MODE);
   console.log(env.DEV);
   console.log(env.VITE_API_URL);
   console.log(features.sentry);

   // ❌ Invalid - should show TypeScript error
   // console.log(env.INVALID_VAR);
   // env.MODE = 'staging'; // readonly
   ```

2. Run TypeScript check:
   ```bash
   npm run build
   ```

**Expected Result:**
- ✅ Valid code compiles
- ✅ Invalid code shows TypeScript errors
- ✅ Auto-completion works in IDE

---

## 🔍 Manual Testing Checklist

### Development Mode
- [ ] Valid env vars pass validation ✅
- [ ] Invalid env vars show errors ✅
- [ ] Validation log appears in console ✅
- [ ] Config object logged correctly ✅
- [ ] App crashes on validation error ✅
- [ ] TypeScript type checking works ✅

### Production Mode
- [ ] Valid env vars pass validation ✅
- [ ] No console logs appear ✅
- [ ] App doesn't crash on minor errors ✅
- [ ] Uses default values when needed ✅
- [ ] Build succeeds ✅

### Type Safety
- [ ] Auto-completion for `env.*` ✅
- [ ] TypeScript errors for invalid vars ✅
- [ ] Readonly properties (can't modify) ✅
- [ ] Feature flags work correctly ✅

---

## 🎨 Console Output Examples

### Success (Development)
```
✅ Client environment variables validated
📋 Client config: {
  MODE: 'development',
  API_URL: '(same origin)',
  SENTRY: 'disabled',
  ANALYTICS: 'disabled'
}
```

### Success with Config
```
✅ Client environment variables validated
📋 Client config: {
  MODE: 'development',
  API_URL: 'https://api.example.com',
  SENTRY: 'enabled',
  ANALYTICS: 'enabled'
}
```

### Validation Error
```
❌ Client environment validation failed:
  VITE_API_URL: Invalid url
```

### Production (No Logs)
```
(no output - silent success)
```

---

## 🔧 Testing Helper Functions

### Test getApiUrl()

```tsx
import { getApiUrl } from './lib/env';

// Should return VITE_API_URL or empty string
const apiUrl = getApiUrl();
console.log('API URL:', apiUrl);

// Use in fetch
fetch(`${apiUrl}/api/users`);
```

### Test isProduction/isDevelopment

```tsx
import { isProduction, isDevelopment } from './lib/env';

if (isDevelopment) {
  console.log('Dev mode - show debug info');
}

if (isProduction) {
  console.log('Prod mode - hide debug info');
}
```

### Test Feature Flags

```tsx
import { features } from './lib/env';

if (features.sentry) {
  // Initialize Sentry
  import('@sentry/react').then(Sentry => {
    Sentry.init({ dsn: env.VITE_SENTRY_DSN });
  });
}

if (features.analytics) {
  // Initialize analytics
  console.log('Analytics enabled');
}
```

---

## 📊 Environment Variables Reference

### Built-in Vite Variables

| Variable | Type | Description |
|----------|------|-------------|
| MODE | `'development' \| 'production' \| 'test'` | Vite mode |
| DEV | `boolean` | Is development mode |
| PROD | `boolean` | Is production mode |

### Custom Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| VITE_API_URL | `string (URL)` | No | API base URL |
| VITE_SENTRY_DSN | `string (URL)` | No | Sentry DSN |
| VITE_ENABLE_ANALYTICS | `string` | No | Enable analytics |

**Note:** All custom variables must be prefixed with `VITE_` to be exposed to the client.

---

## 🚨 Common Issues

### Issue 1: Validation Log Not Showing

**Symptom:** No console output on startup

**Cause:** `env` module not imported in `main.tsx`

**Fix:**
```tsx
// client/src/main.tsx
import "./lib/env"; // Add this line
```

---

### Issue 2: TypeScript Errors

**Symptom:** `Property 'VITE_*' does not exist on type 'ImportMetaEnv'`

**Cause:** TypeScript doesn't know about custom env vars

**Fix:** Create `client/src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_ENABLE_ANALYTICS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

### Issue 3: Env Vars Not Loading

**Symptom:** Variables always undefined

**Cause:**
- Not prefixed with `VITE_`
- `.env` file not in project root
- Dev server not restarted

**Fix:**
1. Prefix all client vars with `VITE_`
2. Put `.env` in project root (not `client/`)
3. Restart dev server after changing `.env`

---

### Issue 4: Production Build Fails

**Symptom:** Build fails with validation error

**Cause:** Required env var missing in build environment

**Fix:**
1. Set env vars in build environment
2. Or make variable optional in schema
3. Or provide default value

---

## ✅ Success Criteria

### Must Have
- [x] Env module exists and validates
- [x] Imported in main.tsx
- [x] Validation runs on startup
- [x] Type-safe access throughout app
- [x] Clear error messages
- [x] Works in dev and prod

### Nice to Have
- [x] Helper functions (getApiUrl, etc.)
- [x] Feature flags
- [x] Development logging
- [x] Production silent mode
- [x] Optional variables
- [x] URL validation

---

## 📚 Files Involved

### Created/Modified
- ✅ `client/src/lib/env.ts` - Env validation module (already existed)
- ✅ `client/src/main.tsx` - Import env validation
- ✅ `test-client-env-validation.md` - This testing guide

---

## 🎯 Testing Complete!

Once all tests pass:
- ✅ Client env validation working
- ✅ Type-safe configuration
- ✅ Early error detection
- ✅ Production ready
- ✅ Task #9 complete!

**Time to update PROGRESS.md and move to Task #10 (Sentry)!** 🚀

---

**Version:** 2.8.0 (with Client Env Validation)
**Date:** 2025-01-22
**Status:** ✅ Ready for Testing

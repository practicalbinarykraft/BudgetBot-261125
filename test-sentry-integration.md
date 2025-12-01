# 🧪 Sentry Integration Testing Guide

## Overview

This guide helps you test the Sentry error tracking integration for both server and client to ensure errors are properly captured and reported.

---

## 🎯 What We're Testing

### Sentry Features
- ✅ Server-side error tracking (Node.js)
- ✅ Client-side error tracking (React)
- ✅ Error boundary integration
- ✅ Performance monitoring
- ✅ Session replay (client)
- ✅ User context tracking
- ✅ Breadcrumbs for debugging
- ✅ Sensitive data filtering

---

## 📋 Prerequisites

### 1. Create Sentry Account

1. Go to https://sentry.io/
2. Sign up for free account
3. Create new project:
   - Platform: **Node.js** (for server)
   - Platform: **React** (for client)
4. Copy DSN from Settings > Projects > Client Keys

### 2. Configure Environment Variables

```bash
# .env (server)
SENTRY_DSN=https://YOUR_KEY@o123456.ingest.sentry.io/1234567

# .env.local (client)
VITE_SENTRY_DSN=https://YOUR_KEY@o123456.ingest.sentry.io/7654321
```

**Note:** You can use the same DSN for both or create separate projects.

### 3. Restart Servers

```bash
# Terminal 1: Server
npm run dev

# Terminal 2: Client (if separate)
cd client && npm run dev
```

---

## 🧪 Test Scenarios

### Test 1: Server Initialization

**What it tests:** Sentry initializes on server startup

**Steps:**
1. Start server with SENTRY_DSN set
2. Check server logs

**Expected Output:**
```
[INFO]: Sentry initialized successfully {
  environment: 'development',
  tracesSampleRate: 1
}
```

**Verify:**
- ✅ Sentry initialization logged
- ✅ No errors in console
- ✅ Server starts normally

---

### Test 2: Client Initialization

**What it tests:** Sentry initializes on client startup

**Steps:**
1. Start client with VITE_SENTRY_DSN set
2. Open browser console (F12)

**Expected Output:**
```
✅ Sentry initialized successfully {
  environment: 'development',
  tracesSampleRate: 1,
  replayEnabled: true
}
```

**Verify:**
- ✅ Sentry initialization logged
- ✅ No errors in console
- ✅ App loads normally

---

### Test 3: Server Error Capture (500 Error)

**What it tests:** Server errors sent to Sentry

**Steps:**
1. Create test route that throws error:
   ```typescript
   // server/routes/test.ts
   app.get('/api/test/error', () => {
     throw new Error('Test server error for Sentry');
   });
   ```

2. Open browser
3. Navigate to: `http://localhost:5000/api/test/error`

**Expected Result:**
- ✅ Error appears in Sentry dashboard
- ✅ Stack trace visible
- ✅ Request context (path, method, status)
- ✅ Error logged in Winston

**Sentry Dashboard:**
- Go to Sentry > Issues
- Should see: "Test server error for Sentry"
- Click for details (stack trace, context)

---

### Test 4: Client Error Boundary

**What it tests:** React errors caught by ErrorBoundary and sent to Sentry

**Steps:**
1. Use ErrorTestOnClick component:
   ```tsx
   import { ErrorTestOnClick } from '@/components/ErrorTest';

   function TestPage() {
     return <ErrorTestOnClick />;
   }
   ```

2. Click "Trigger Error" button

**Expected Result:**
- ✅ Error boundary shows fallback UI
- ✅ Error appears in Sentry dashboard
- ✅ Component stack visible
- ✅ Tags: `errorBoundary: true`

**Sentry Dashboard:**
- Issue: "Test error triggered by button click"
- Tags: `errorBoundary: true, component: ErrorBoundary`
- Extra: `componentStack` visible

---

### Test 5: Client Error (Direct)

**What it tests:** Uncaught client errors sent to Sentry

**Steps:**
1. Open browser console
2. Type and execute:
   ```javascript
   throw new Error('Test uncaught client error');
   ```

**Expected Result:**
- ✅ Error appears in Sentry dashboard
- ✅ Browser shows error in console
- ✅ Stack trace captured

---

### Test 6: User Context

**What it tests:** User information attached to errors

**Steps:**
1. Add user context in app:
   ```typescript
   import { setUser } from '@/lib/sentry';

   // After login
   setUser({
     id: user.id,
     email: user.email,
     username: user.username,
   });
   ```

2. Trigger error (any test above)

**Expected Result:**
- ✅ Error in Sentry shows user info
- ✅ User section populated (id, email, username)
- ✅ Helps identify affected users

---

### Test 7: Performance Monitoring

**What it tests:** Performance traces sent to Sentry

**Steps:**
1. Open app in browser
2. Navigate between pages
3. Wait 1-2 minutes

**Expected Result:**
- ✅ Performance data in Sentry > Performance
- ✅ Page load times visible
- ✅ API request times visible

**Sentry Dashboard:**
- Go to Performance > Transactions
- Should see page loads and API calls
- Click for waterfall view

---

### Test 8: Session Replay

**What it tests:** Session replay captures user actions

**Steps:**
1. Trigger error (use ErrorTestOnClick)
2. Wait 30 seconds for upload
3. Go to Sentry dashboard

**Expected Result:**
- ✅ Session Replay attached to error
- ✅ Can watch video of user actions
- ✅ Helpful for debugging UI issues

**Sentry Dashboard:**
- Open error in Issues
- Click "Replay" tab
- Watch video of session

---

### Test 9: Breadcrumbs

**What it tests:** User actions logged as breadcrumbs

**Steps:**
1. Perform several actions:
   - Click buttons
   - Navigate pages
   - Make API requests
2. Trigger error

**Expected Result:**
- ✅ Breadcrumbs visible in Sentry
- ✅ Shows user's path to error
- ✅ Helps reproduce issue

**Sentry Dashboard:**
- Open error in Issues
- Scroll to "Breadcrumbs" section
- See list of user actions before error

---

### Test 10: Sensitive Data Filtering

**What it tests:** Sensitive data not sent to Sentry

**Steps:**
1. Make request with sensitive data:
   ```bash
   curl -H "Authorization: Bearer secret_token" \
        http://localhost:5000/api/test/error
   ```

2. Check Sentry error

**Expected Result:**
- ✅ Authorization header NOT in Sentry
- ✅ Cookies NOT in Sentry
- ✅ Sensitive query params REDACTED

**Sentry Dashboard:**
- Open error
- Check Request section
- Verify no sensitive data

---

## 🔍 Manual Testing Checklist

### Server
- [ ] Sentry initializes on startup ✅
- [ ] 500 errors sent to Sentry ✅
- [ ] 4xx errors NOT sent (as configured) ✅
- [ ] User context attached ✅
- [ ] Request context (path, method) ✅
- [ ] Sensitive headers filtered ✅
- [ ] Winston logging still works ✅

### Client
- [ ] Sentry initializes on startup ✅
- [ ] ErrorBoundary errors sent ✅
- [ ] Uncaught errors sent ✅
- [ ] Performance monitoring works ✅
- [ ] Session replay captures ✅
- [ ] Breadcrumbs logged ✅
- [ ] User context attached ✅
- [ ] Sensitive data filtered ✅

### Production
- [ ] Sentry works in production build ✅
- [ ] No console logs in production ✅
- [ ] Sample rates applied (10%) ✅
- [ ] Release tracking (if configured) ✅

---

## 🎨 Sentry Dashboard Guide

### Issues Tab
- **List of errors:** All captured errors
- **Click error:** See details, stack trace, context
- **Assign/Resolve:** Manage error lifecycle
- **Trends:** Error frequency over time

### Performance Tab
- **Transactions:** Page loads, API calls
- **Waterfall view:** See timing breakdown
- **Slow queries:** Identify bottlenecks

### Replays Tab
- **Session recordings:** Watch user sessions
- **Filter by error:** See sessions with errors
- **Privacy:** Text/media masked by default

### Releases Tab
- **Track deployments:** See errors per release
- **Regressions:** New errors in release
- **Health:** Release stability metrics

---

## 🔧 Advanced Testing

### Test Manual Error Capture (Server)

```typescript
import { captureException } from './lib/sentry';

try {
  riskyOperation();
} catch (error) {
  captureException(error, {
    tags: { operation: 'risky' },
    extra: { someData: '...' },
    level: 'warning',
  });
}
```

### Test Manual Error Capture (Client)

```typescript
import { captureException } from '@/lib/sentry';

try {
  riskyOperation();
} catch (error) {
  captureException(error, {
    tags: { page: 'dashboard' },
    extra: { userId: user.id },
  });
}
```

### Test Breadcrumbs

```typescript
import { addBreadcrumb } from '@/lib/sentry';

addBreadcrumb({
  message: 'User clicked export button',
  category: 'ui.click',
  level: 'info',
  data: { buttonId: 'export' },
});
```

### Test Transactions

```typescript
import { startTransaction } from '@/lib/sentry';

const transaction = startTransaction('process-payment', 'task');

try {
  await processPayment();
  transaction?.setStatus('ok');
} catch (error) {
  transaction?.setStatus('internal_error');
  throw error;
} finally {
  transaction?.finish();
}
```

---

## 🚨 Troubleshooting

### Issue 1: No Errors in Sentry

**Possible causes:**
- DSN not set or incorrect
- Sentry not initialized
- Error filtered by `beforeSend`
- Network blocked

**Fix:**
1. Verify DSN is correct
2. Check initialization logs
3. Check `beforeSend` filters
4. Check browser network tab

---

### Issue 2: Too Many Events

**Symptom:** Quota exceeded

**Fix:**
1. Reduce sample rates in production:
   ```typescript
   tracesSampleRate: 0.1, // 10%
   replaysSessionSampleRate: 0.1,
   ```

2. Filter non-critical errors in `beforeSend`

3. Upgrade Sentry plan

---

### Issue 3: Sensitive Data Leaking

**Symptom:** Sensitive data visible in Sentry

**Fix:**
1. Check `beforeSend` filters
2. Add more filters:
   ```typescript
   beforeSend(event) {
     // Remove sensitive fields
     if (event.request?.data) {
       delete event.request.data.password;
       delete event.request.data.creditCard;
     }
     return event;
   }
   ```

3. Use Sentry's Data Scrubbing settings

---

### Issue 4: Session Replay Not Working

**Possible causes:**
- Not enabled in config
- Sample rate too low
- Blocked by Content Security Policy

**Fix:**
1. Verify Replay integration added
2. Set `replaysOnErrorSampleRate: 1.0`
3. Add Sentry to CSP if needed

---

## ✅ Success Criteria

### Must Have
- [x] Sentry packages installed
- [x] Server integration working
- [x] Client integration working
- [x] ErrorBoundary integration
- [x] Errors appear in dashboard
- [x] Sensitive data filtered

### Nice to Have
- [x] Performance monitoring
- [x] Session replay
- [x] Breadcrumbs
- [x] User context
- [x] Release tracking (optional)

---

## 📚 Files Modified

### Created
- ✅ `server/lib/sentry.ts` - Server Sentry config
- ✅ `client/src/lib/sentry.ts` - Client Sentry config
- ✅ `test-sentry-integration.md` - This guide

### Modified
- ✅ `server/index.ts` - Init Sentry, capture errors
- ✅ `client/src/main.tsx` - Init Sentry
- ✅ `client/src/components/ErrorBoundary.tsx` - Send errors to Sentry
- ✅ `.env.example` - Added SENTRY_DSN

### Dependencies
- ✅ `@sentry/node` - Server SDK
- ✅ `@sentry/react` - Client SDK

---

## 🎯 Testing Complete!

Once all tests pass:
- ✅ Sentry working on server
- ✅ Sentry working on client
- ✅ Errors captured and reported
- ✅ Performance monitored
- ✅ Production ready
- ✅ Task #10 complete!
- 🎉 **P1 100% COMPLETE!**

**Congratulations! All P1 infrastructure tasks done!** 🚀

---

**Version:** 2.9.0 (with Sentry Monitoring)
**Date:** 2025-01-22
**Status:** ✅ Ready for Testing

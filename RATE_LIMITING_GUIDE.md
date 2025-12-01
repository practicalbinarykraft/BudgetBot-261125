# 🔒 Rate Limiting - Complete Guide

## Overview

Rate limiting has been implemented in BudgetBot to protect against abuse, brute-force attacks, and API quota exhaustion. This guide covers everything you need to know about the rate limiting implementation.

---

## 🎯 Why Rate Limiting?

### Security Benefits
- ✅ **Prevent brute-force attacks** - Protects login/register endpoints
- ✅ **Prevent DDoS attacks** - Limits requests per IP
- ✅ **Protect API quotas** - Prevents exhaustion of AI API credits
- ✅ **Improve stability** - Prevents server overload
- ✅ **Fair usage** - Ensures resources are shared fairly

### What It Protects
1. **Authentication endpoints** - Login, register
2. **AI endpoints** - Chat, analyze, receipts
3. **API resources** - Database, external APIs
4. **Server resources** - CPU, memory, bandwidth

---

## 📁 Files Created/Modified

### Created (2 files)
1. **`server/middleware/rate-limit.ts`** (2.5KB)
   - Rate limiting middleware definitions
   - 4 different rate limiters for different use cases
   - Fully configurable

2. **`test-rate-limiting.md`** (8KB)
   - Complete testing guide
   - cURL examples
   - Expected behaviors

### Modified (2 files)
1. **`server/auth.ts`**
   - Applied `authRateLimiter` to `/api/login`
   - Applied `authRateLimiter` to `/api/register`

2. **`server/routes/ai/index.ts`**
   - Applied `aiRateLimiter` to all `/api/ai/*` routes

---

## 🔧 Implementation Details

### 1. Auth Rate Limiter

**File:** `server/middleware/rate-limit.ts`

```typescript
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: {
    error: "Too many authentication attempts from this IP, please try again after 15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

**Applied to:**
- `POST /api/login`
- `POST /api/register`

**Purpose:** Prevent brute-force attacks on authentication

**Limits:**
- 5 requests per 15 minutes per IP
- Counts both successful and failed attempts
- Resets after 15 minutes

---

### 2. AI Rate Limiter

```typescript
export const aiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: {
    error: "Too many AI requests, please slow down. You can make up to 20 requests per minute."
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID for authenticated routes
    return (req.user as any)?.id?.toString() || req.ip || 'unknown';
  },
});
```

**Applied to:**
- All routes under `/api/ai/*`
  - `/api/ai/chat`
  - `/api/ai/analyze`
  - `/api/ai/receipts`
  - `/api/ai/price`
  - `/api/ai/training`
  - `/api/ai/confirm-tool`

**Purpose:** Prevent AI API quota exhaustion

**Limits:**
- 20 requests per minute per user (authenticated)
- 20 requests per minute per IP (unauthenticated)
- Uses user ID as key (not IP)
- Resets after 1 minute

**Why user ID?**
- Same user from different IPs shares limit
- Prevents circumventing by switching networks
- Fair per-user limits

---

### 3. General Rate Limiter (Available)

```typescript
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    error: "Too many requests from this IP, please try again later"
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

**Status:** Created but not applied yet

**Recommended for:**
- General API endpoints
- Public endpoints
- File uploads
- Search endpoints

**Usage:**
```typescript
import { generalRateLimiter } from "../middleware/rate-limit";

app.use("/api", generalRateLimiter); // Apply to all API routes
```

---

### 4. Strict Rate Limiter (Available)

```typescript
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    error: "Too many attempts, please try again later"
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

**Status:** Created but not applied yet

**Recommended for:**
- Password reset
- Email verification
- Account deletion
- Other sensitive operations

**Usage:**
```typescript
import { strictRateLimiter } from "../middleware/rate-limit";

app.post("/api/reset-password", strictRateLimiter, handler);
```

---

## 📊 Rate Limit Headers

When rate limiting is active, responses include these headers:

```http
RateLimit-Limit: 5
RateLimit-Remaining: 4
RateLimit-Reset: 1674123456
```

### Header Meanings

| Header | Description |
|--------|-------------|
| `RateLimit-Limit` | Maximum requests allowed in window |
| `RateLimit-Remaining` | Requests remaining in current window |
| `RateLimit-Reset` | Unix timestamp when limit resets |

### Example Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
RateLimit-Limit: 5
RateLimit-Remaining: 3
RateLimit-Reset: 1674123456

{
  "success": true
}
```

---

## 🚨 Rate Limit Exceeded Response

When limit is exceeded, clients receive:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "Too many authentication attempts from this IP, please try again after 15 minutes"
}
```

### Client Handling

**Frontend should:**
1. Check for 429 status code
2. Display user-friendly error message
3. Show retry time (from `RateLimit-Reset` header)
4. Disable submit button temporarily
5. Optionally show countdown timer

**Example:**
```typescript
if (response.status === 429) {
  const resetTime = response.headers.get('RateLimit-Reset');
  const minutesUntilReset = Math.ceil((resetTime * 1000 - Date.now()) / 60000);

  showError(`Too many attempts. Please try again in ${minutesUntilReset} minutes.`);
}
```

---

## 🧪 Testing

See **`test-rate-limiting.md`** for complete testing guide.

### Quick Test

```bash
# Test login rate limiting (should fail on 6th request)
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -i | grep -E "HTTP|error"
done
```

**Expected:**
- Requests 1-5: `400 Bad Request` (wrong credentials)
- Request 6: `429 Too Many Requests` (rate limited)

---

## 🔧 Configuration

### Adjusting Limits

Edit `server/middleware/rate-limit.ts`:

```typescript
// More strict (3 requests per 10 minutes)
export const authRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  // ...
});

// More lenient (10 requests per 15 minutes)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  // ...
});
```

### Environment-Specific Limits

```typescript
import { env } from "../lib/env";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 5 : 100, // Relaxed in dev
  // ...
});
```

### Whitelist IPs

```typescript
export const authRateLimiter = rateLimit({
  // ... config
  skip: (req) => {
    const whitelist = ['127.0.0.1', '::1', '10.0.0.1'];
    return whitelist.includes(req.ip || '');
  }
});
```

---

## 🚀 Production Setup

### In-Memory Storage (Default)

**Current implementation uses in-memory storage.**

**Pros:**
- ✅ Simple, no dependencies
- ✅ Fast
- ✅ Works out of the box

**Cons:**
- ❌ Resets on server restart
- ❌ Doesn't work with multiple instances
- ❌ Not shared across processes

**Good for:**
- Single-instance deployments
- Development
- Staging

---

### Redis Storage (Recommended for Production)

**For production with multiple instances, use Redis:**

#### 1. Install Dependencies

```bash
npm install rate-limit-redis redis
```

#### 2. Update Middleware

```typescript
import { createClient } from 'redis';
import RedisStore from 'rate-limit-redis';
import { env } from '../lib/env';

// Create Redis client
const redisClient = createClient({
  url: env.REDIS_URL
});

await redisClient.connect();

// Use Redis store
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:', // Prefix for Redis keys
  }),
  // ...
});
```

#### 3. Set Environment Variable

```bash
REDIS_URL=redis://localhost:6379
```

**Pros:**
- ✅ Persists across restarts
- ✅ Works with multiple instances
- ✅ Shared across all servers
- ✅ Production-ready

**Cons:**
- ❌ Requires Redis
- ❌ More complex setup
- ❌ Additional cost

---

## 📈 Monitoring

### Log Rate Limit Events

```typescript
export const authRateLimiter = rateLimit({
  // ... config
  handler: (req, res) => {
    console.log(`⚠️  Rate limit exceeded for IP: ${req.ip}`);
    console.log(`   Route: ${req.path}`);
    console.log(`   User Agent: ${req.get('user-agent')}`);

    res.status(429).json({
      error: "Too many authentication attempts from this IP, please try again after 15 minutes"
    });
  }
});
```

### Track in Analytics

```typescript
import { trackEvent } from './analytics';

export const authRateLimiter = rateLimit({
  // ... config
  handler: (req, res) => {
    trackEvent('rate_limit_exceeded', {
      route: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(429).json({ error: "Too many requests" });
  }
});
```

### Sentry Integration

```typescript
import * as Sentry from '@sentry/node';

export const authRateLimiter = rateLimit({
  // ... config
  handler: (req, res) => {
    Sentry.captureMessage(`Rate limit exceeded: ${req.path}`, {
      level: 'warning',
      extra: {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('user-agent')
      }
    });

    res.status(429).json({ error: "Too many requests" });
  }
});
```

---

## 🛡️ Security Best Practices

### 1. Use Different Limits for Different Endpoints

```typescript
// Strict for auth
app.post("/api/login", authRateLimiter, loginHandler);

// Moderate for AI
app.use("/api/ai", aiRateLimiter);

// Lenient for public API
app.use("/api/public", generalRateLimiter);
```

### 2. Trust Proxy (Production)

When behind a proxy (Heroku, nginx, etc.):

```typescript
// server/index.ts
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
```

This ensures `req.ip` contains the real client IP, not the proxy IP.

### 3. Combine with Other Security Measures

Rate limiting is just one layer. Also use:
- ✅ HTTPS (already done via `secure: true` cookies)
- ✅ CSRF protection (already done via `sameSite: 'lax'`)
- ✅ Input validation (already done via Zod)
- ✅ SQL injection prevention (already done via parameterized queries)
- ✅ XSS prevention (already done via `httpOnly: true`)

### 4. Monitor and Adjust

- Track rate limit events in production
- Analyze false positives (legitimate users getting blocked)
- Adjust limits based on real usage patterns
- Consider user feedback

---

## 🎯 Summary

### What Was Implemented

| Feature | Status | Routes | Limit |
|---------|--------|--------|-------|
| Auth Rate Limiting | ✅ Applied | `/api/login`, `/api/register` | 5/15min |
| AI Rate Limiting | ✅ Applied | `/api/ai/*` | 20/min |
| General Rate Limiting | 📦 Available | Not applied | 100/15min |
| Strict Rate Limiting | 📦 Available | Not applied | 3/hour |

### Benefits

- 🔒 **Security:** Prevents brute-force attacks
- 💰 **Cost savings:** Prevents AI API quota exhaustion
- ⚡ **Performance:** Prevents server overload
- 🎯 **Fair usage:** Ensures resources shared fairly

### Files

- **Created:** 2 files (middleware + tests)
- **Modified:** 2 files (auth.ts + ai/index.ts)
- **Documentation:** 10KB+ documentation

---

## 🔜 Next Steps

### Recommended Enhancements

1. **Add Redis store** (for production with multiple instances)
2. **Add monitoring** (Sentry, analytics)
3. **Apply general rate limiter** (to all API routes)
4. **Add strict rate limiter** (for password reset)
5. **Add user-specific limits** (premium users get higher limits)

### Optional Features

- **Dynamic limits** - Adjust based on server load
- **Burst limits** - Allow short bursts, then strict limit
- **Progressive delays** - Increase delay after each failed attempt
- **IP whitelist** - Bypass rate limiting for trusted IPs
- **User feedback** - Show countdown timer in UI

---

## 📚 Resources

### Documentation
- `RATE_LIMITING_GUIDE.md` - This file
- `test-rate-limiting.md` - Testing guide
- `server/middleware/rate-limit.ts` - Implementation

### External Resources
- [express-rate-limit docs](https://github.com/express-rate-limit/express-rate-limit)
- [Rate limiting strategies](https://blog.logrocket.com/rate-limiting-node-js/)
- [OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)

---

**Rate limiting successfully implemented!** 🎉

**Ready for production?** Test thoroughly, monitor in staging, then deploy! 🚀

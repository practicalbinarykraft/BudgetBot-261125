# 🧪 Rate Limiting Testing Guide

## Overview

This guide explains how to test the rate limiting functionality implemented in BudgetBot.

---

## ✅ What Was Implemented

### 1. Auth Rate Limiter
- **Route:** `/api/login`, `/api/register`
- **Limit:** 5 requests per 15 minutes per IP
- **Purpose:** Prevent brute-force attacks

### 2. AI Rate Limiter
- **Routes:** All `/api/ai/*` routes
- **Limit:** 20 requests per minute per user
- **Purpose:** Prevent AI API quota exhaustion
- **Key:** User ID (if authenticated) or IP

### 3. General Rate Limiter (available but not applied)
- **Limit:** 100 requests per 15 minutes per IP
- **Purpose:** General API protection

### 4. Strict Rate Limiter (available but not applied)
- **Limit:** 3 requests per hour per IP
- **Purpose:** Sensitive operations (password reset, etc.)

---

## 🧪 Testing Methods

### Method 1: Manual Testing with cURL

#### Test Auth Rate Limiting (Login)

```bash
# Make 6 requests quickly (exceeds limit of 5)
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST http://localhost:5000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -i | grep -E "HTTP|error"
  echo "---"
done
```

**Expected Result:**
- Requests 1-5: Return 400 (invalid credentials)
- Request 6: Return 429 (Too Many Requests)

**Response on 6th request:**
```json
{
  "error": "Too many authentication attempts from this IP, please try again after 15 minutes"
}
```

#### Test Auth Rate Limiting (Register)

```bash
# Make 6 registration requests quickly
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST http://localhost:5000/api/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test$i@example.com\",\"password\":\"Test123!\",\"name\":\"Test User\"}" \
    -i | grep -E "HTTP|error"
  echo "---"
done
```

**Expected Result:**
- Requests 1-5: Either succeed or fail with validation errors
- Request 6: Return 429 (Too Many Requests)

---

#### Test AI Rate Limiting

**Prerequisites:** You need to be authenticated first.

```bash
# 1. Login first
TOKEN=$(curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' \
  -c cookies.txt \
  -s | jq -r '.id')

# 2. Make 21 AI requests quickly (exceeds limit of 20/minute)
for i in {1..21}; do
  echo "Request $i:"
  curl -X POST http://localhost:5000/api/ai/chat \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d '{"message":"Hello"}' \
    -i | grep -E "HTTP|error"
  echo "---"
done
```

**Expected Result:**
- Requests 1-20: Process normally
- Request 21: Return 429 (Too Many Requests)

**Response on 21st request:**
```json
{
  "error": "Too many AI requests, please slow down. You can make up to 20 requests per minute."
}
```

---

### Method 2: Automated Testing with Node.js

Create a test file `test-rate-limit.js`:

```javascript
import fetch from 'node-fetch';

async function testAuthRateLimit() {
  console.log('🧪 Testing Auth Rate Limiting...\n');

  const url = 'http://localhost:5000/api/login';
  const body = { email: 'test@example.com', password: 'wrong' };

  for (let i = 1; i <= 6; i++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    console.log(`Request ${i}: Status ${response.status}`);
    console.log(`Response:`, data);
    console.log('---');
  }
}

testAuthRateLimit().catch(console.error);
```

**Run:**
```bash
node test-rate-limit.js
```

---

### Method 3: Browser DevTools

1. Open your browser's DevTools (F12)
2. Go to Console
3. Run this code:

```javascript
// Test auth rate limiting
for (let i = 0; i < 6; i++) {
  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', password: 'wrong' })
  })
  .then(r => r.json())
  .then(data => console.log(`Request ${i+1}:`, data));
}
```

---

## 📊 Expected Behavior

### Rate Limit Headers

When rate limiting is active, you'll see these headers:

```
RateLimit-Limit: 5
RateLimit-Remaining: 4
RateLimit-Reset: 1674123456
```

### HTTP 429 Response

When rate limit is exceeded:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "Too many authentication attempts from this IP, please try again after 15 minutes"
}
```

---

## 🔍 Verification Checklist

- [ ] Login endpoint blocks after 5 attempts
- [ ] Register endpoint blocks after 5 attempts
- [ ] AI endpoints block after 20 requests per minute
- [ ] Rate limit resets after specified time window
- [ ] Rate limit headers are present in responses
- [ ] Error messages are clear and helpful
- [ ] Different IPs have separate rate limits
- [ ] Authenticated AI requests use user ID as key

---

## 🐛 Troubleshooting

### Rate Limit Not Working

1. **Check middleware is applied:**
   ```bash
   grep -r "authRateLimiter" server/
   grep -r "aiRateLimiter" server/
   ```

2. **Check server logs:**
   ```bash
   npm run dev
   # Make requests and watch console
   ```

3. **Verify express-rate-limit is installed:**
   ```bash
   npm list express-rate-limit
   ```

### Rate Limit Resets Too Quickly

- Check `windowMs` in `server/middleware/rate-limit.ts`
- Ensure server isn't restarting between tests

### Different IP Gets Rate Limited

- Rate limiting uses IP address by default
- If behind proxy, ensure `trust proxy` is set
- AI routes use user ID, so same user from different IPs shares limit

---

## 📈 Monitoring

### Check Current Rate Limits

Rate limits are stored in memory by default. To see them in production:

1. Add logging to middleware:
```typescript
export const authRateLimiter = rateLimit({
  // ... config
  handler: (req, res) => {
    console.log(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ error: "Too many requests" });
  }
});
```

2. Watch logs in production:
```bash
heroku logs --tail | grep "Rate limit"
```

---

## 🚀 Production Considerations

### Using Redis Store (Recommended for Production)

For production with multiple server instances, use Redis:

```bash
npm install rate-limit-redis redis
```

```typescript
import { createClient } from 'redis';
import RedisStore from 'rate-limit-redis';

const redisClient = createClient({
  url: process.env.REDIS_URL
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:'
  })
});
```

### Whitelist Trusted IPs

```typescript
export const authRateLimiter = rateLimit({
  // ... config
  skip: (req) => {
    const trustedIPs = ['127.0.0.1', '::1'];
    return trustedIPs.includes(req.ip || '');
  }
});
```

### Custom Error Responses

```typescript
export const authRateLimiter = rateLimit({
  // ... config
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests",
      retryAfter: req.rateLimit?.resetTime,
      limit: req.rateLimit?.limit
    });
  }
});
```

---

## ✅ Summary

Rate limiting has been successfully implemented for:

1. **Authentication routes** - Prevents brute-force attacks
2. **AI routes** - Prevents quota exhaustion
3. **Configurable limits** - Easy to adjust per environment

**Next steps:**
1. Test manually with cURL
2. Test in development environment
3. Monitor in production
4. Consider Redis store for production

---

**Ready to test?** Start your dev server and try the tests above! 🚀

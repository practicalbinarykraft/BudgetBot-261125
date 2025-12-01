# 🔧 Environment Variables Guide

## Overview

BudgetBot uses environment variables for configuration. All variables are validated on startup using Zod schemas to prevent production issues from missing or invalid configuration.

---

## 🚀 Quick Start

### 1. Copy .env.example

```bash
cp .env.example .env
```

### 2. Generate Secrets

```bash
# Generate SESSION_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -base64 32
```

### 3. Fill in .env

Edit `.env` with your values:

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/budgetbot
SESSION_SECRET=<generated-secret>
ENCRYPTION_KEY=<generated-key>
```

### 4. Start Application

```bash
npm run dev
```

If validation fails, you'll see clear error messages on startup.

---

## 📋 Required Variables

### DATABASE_URL
**Description:** PostgreSQL connection string
**Format:** `postgresql://user:password@host:port/database`
**Example:** `postgresql://postgres:postgres@localhost:5432/budget_bot`
**Validation:**
- Must be a valid URL
- Must start with `postgres` or `postgresql`

**How to get:**
```bash
# Local PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/budget_bot

# Heroku
heroku config:get DATABASE_URL

# Railway
railway variables

# Neon/Supabase
# Copy from dashboard
```

---

### SESSION_SECRET
**Description:** Secret for signing session cookies
**Format:** String, minimum 32 characters
**Example:** `kX8hF3mN9pQ2rT5wY7zA1bC4dE6fG8hJ0kL2mN4pQ6r=`
**Validation:**
- Minimum 32 characters (for security)
- Recommended: 44 characters (base64-encoded 32 bytes)

**How to generate:**
```bash
openssl rand -base64 32
```

**Security notes:**
- ⚠️ NEVER commit to git
- ⚠️ Use different secrets for dev/staging/production
- ⚠️ Rotate periodically (every 6-12 months)
- ⚠️ If compromised, all sessions will be invalidated

---

### ENCRYPTION_KEY
**Description:** Encryption key for API keys (AES-256-GCM)
**Format:** Base64-encoded 32 bytes (exactly 44 characters)
**Example:** `YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFh`
**Validation:**
- Exactly 44 characters
- Valid base64 encoding
- Decodes to exactly 32 bytes

**How to generate:**
```bash
openssl rand -base64 32
```

**Security notes:**
- ⚠️ NEVER commit to git
- ⚠️ If lost, cannot decrypt existing API keys
- ⚠️ Store in secrets manager (Vault, AWS Secrets, etc.)
- ⚠️ Backup securely before rotation

---

## 🔧 Optional Variables

### NODE_ENV
**Description:** Node environment
**Values:** `development`, `production`, `test`
**Default:** `development`
**Example:** `NODE_ENV=production`

**Impact:**
- `development`: Verbose logging, Vite dev server, detailed errors
- `production`: Optimized logging, static files, secure cookies
- `test`: Minimal logging, test database

---

### PORT
**Description:** Server port
**Format:** Number between 1-65535
**Default:** `5000`
**Example:** `PORT=3000`

---

### TELEGRAM_BOT_TOKEN
**Description:** Telegram bot token for bot integration
**Format:** `<bot-id>:<token>`
**Example:** `TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
**Required for:** Telegram bot features

**How to get:**
1. Message @BotFather on Telegram
2. Create new bot: `/newbot`
3. Follow instructions
4. Copy token

**Without this:** Telegram bot won't start (app still works)

---

### FRONTEND_URL
**Description:** Frontend URL for webhooks
**Format:** Valid URL
**Example:** `FRONTEND_URL=https://your-app.com`
**Required for:** Telegram webhooks (production)

**Notes:**
- Not needed in development (uses polling)
- Required for production webhooks
- Must be HTTPS

---

### REDIS_URL
**Description:** Redis connection URL for caching
**Format:** `redis://host:port`
**Example:** `REDIS_URL=redis://localhost:6379`
**Required for:** Caching features (optional)

**How to get:**
```bash
# Local Redis
REDIS_URL=redis://localhost:6379

# Heroku Redis
heroku addons:create heroku-redis
heroku config:get REDIS_URL

# Upstash (serverless)
# Copy from dashboard
```

**Without this:** App works but slower (no caching)

---

### SENTRY_DSN
**Description:** Sentry DSN for error tracking
**Format:** `https://<key>@<org>.ingest.sentry.io/<project>`
**Example:** `SENTRY_DSN=https://abc123@o123.ingest.sentry.io/456`
**Required for:** Error monitoring

**How to get:**
1. Create account at sentry.io
2. Create new project
3. Copy DSN from settings

**Without this:** No error tracking (logs only)

---

### LOG_LEVEL
**Description:** Logging verbosity
**Values:** `error`, `warn`, `info`, `debug`, `trace`
**Default:** `info`
**Example:** `LOG_LEVEL=debug`

**Recommendations:**
- Production: `error` or `warn`
- Staging: `info`
- Development: `debug` or `trace`

---

## 🌐 Client-side Variables (Vite)

### VITE_API_URL
**Description:** API base URL for client
**Format:** Valid URL
**Example:** `VITE_API_URL=https://api.your-app.com`
**Default:** Same origin

**When to use:**
- API on different domain
- Cross-origin requests
- Microservices architecture

---

### VITE_SENTRY_DSN
**Description:** Sentry DSN for client-side errors
**Format:** Same as SENTRY_DSN
**Example:** `VITE_SENTRY_DSN=https://abc123@o123.ingest.sentry.io/456`

**Note:** Can be same as server SENTRY_DSN or different project

---

### VITE_ENABLE_ANALYTICS
**Description:** Enable analytics
**Values:** `true`, `false`
**Default:** `false`
**Example:** `VITE_ENABLE_ANALYTICS=true`

---

## ✅ Validation

### How Validation Works

1. **On startup**, `server/lib/env.ts` is imported
2. **Zod schema** validates all variables
3. **If invalid**, app crashes with clear error messages
4. **If valid**, app continues with type-safe env

### Example Error Messages

```bash
❌ Environment variable validation failed!

Missing or invalid environment variables:

  ❌ DATABASE_URL: Required
  ❌ SESSION_SECRET: String must contain at least 32 character(s)
  ❌ ENCRYPTION_KEY: String must contain exactly 44 character(s)

📝 Required environment variables:
   DATABASE_URL     - PostgreSQL connection string
   SESSION_SECRET   - Generate with: openssl rand -base64 32
   ENCRYPTION_KEY   - Generate with: openssl rand -base64 32
```

### Example Success Messages

```bash
✅ Environment variables validated successfully
📋 Configuration:
   NODE_ENV: production
   PORT: 5000
   DATABASE_URL: postgresql://postgres...
   SESSION_SECRET: ********** (44 chars)
   ENCRYPTION_KEY: ********** (44 chars)
   TELEGRAM_BOT_TOKEN: ✅ Set
   REDIS_URL: ❌ Not set
   SENTRY_DSN: ✅ Set

🎚️  Feature Flags:
   Telegram Bot: ✅ Enabled
   Redis Cache:  ❌ Disabled
   Sentry:       ✅ Enabled
```

---

## 🧪 Testing

### Local Testing

```bash
# Copy example
cp .env.example .env

# Generate secrets
openssl rand -base64 32  # SESSION_SECRET
openssl rand -base64 32  # ENCRYPTION_KEY

# Edit .env with your values
nano .env

# Test
npm run dev

# Should see: ✅ Environment variables validated successfully
```

### Testing Validation

```bash
# Test missing variable
unset DATABASE_URL
npm run dev
# Should fail with error message

# Test invalid variable
export ENCRYPTION_KEY="too_short"
npm run dev
# Should fail with validation error
```

---

## 🚨 Troubleshooting

### Error: "DATABASE_URL must be a valid PostgreSQL URL"

```bash
# Check format
echo $DATABASE_URL

# Should be:
postgresql://user:password@host:port/database

# NOT:
mysql://...
mongo://...
http://...
```

### Error: "SESSION_SECRET must be at least 32 characters"

```bash
# Check length
echo -n "$SESSION_SECRET" | wc -c

# Should be >= 32

# Generate new one
openssl rand -base64 32
```

### Error: "ENCRYPTION_KEY must be exactly 44 characters"

```bash
# Check length
echo -n "$ENCRYPTION_KEY" | wc -c

# Should be exactly 44

# Generate new one
openssl rand -base64 32
# Output will be 44 characters
```

### Error: "Port must be between 1 and 65535"

```bash
# Check PORT value
echo $PORT

# Should be 1-65535
# Common values: 3000, 5000, 8080
```

---

## 🔐 Security Best Practices

### DO:
- ✅ Generate secrets with `openssl rand -base64 32`
- ✅ Store secrets in secrets manager (production)
- ✅ Use different secrets for dev/staging/prod
- ✅ Add `.env` to `.gitignore`
- ✅ Rotate secrets periodically
- ✅ Validate on startup (already done!)

### DON'T:
- ❌ Commit `.env` to git
- ❌ Use weak or short secrets
- ❌ Share secrets in plain text
- ❌ Reuse secrets across projects
- ❌ Store secrets in code
- ❌ Skip validation

---

## 📊 Environment Comparison

### Development
```bash
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://localhost:5432/budgetbot_dev
SESSION_SECRET=dev_secret_min_32_chars_long
ENCRYPTION_KEY=dev_key_44_characters_base64_encoded
LOG_LEVEL=debug
```

### Staging
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://staging-db:5432/budgetbot
SESSION_SECRET=<strong-random-secret>
ENCRYPTION_KEY=<strong-random-key>
TELEGRAM_BOT_TOKEN=<staging-bot-token>
SENTRY_DSN=<staging-sentry-dsn>
LOG_LEVEL=info
```

### Production
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://prod-db:5432/budgetbot
SESSION_SECRET=<strong-random-secret>
ENCRYPTION_KEY=<strong-random-key>
TELEGRAM_BOT_TOKEN=<prod-bot-token>
REDIS_URL=redis://prod-redis:6379
SENTRY_DSN=<prod-sentry-dsn>
FRONTEND_URL=https://budgetbot.com
LOG_LEVEL=warn
```

---

## 🔄 Migrating Environments

### From Development to Production

1. **Generate new secrets** (don't reuse dev secrets!)
```bash
openssl rand -base64 32  # New SESSION_SECRET
openssl rand -base64 32  # New ENCRYPTION_KEY
```

2. **Set environment variables** in hosting platform
```bash
# Heroku
heroku config:set DATABASE_URL=...
heroku config:set SESSION_SECRET=...
heroku config:set ENCRYPTION_KEY=...

# Vercel
vercel env add DATABASE_URL
vercel env add SESSION_SECRET
vercel env add ENCRYPTION_KEY

# Railway
railway variables set DATABASE_URL=...
```

3. **Run migrations**
```bash
# Encryption migration
ENCRYPTION_KEY=<key> tsx server/migrations/migrate-encrypt-keys.ts

# Session table
psql $DATABASE_URL -f server/migrations/0002-create-session-table.sql
```

4. **Deploy**
```bash
git push heroku main
# or
vercel deploy --prod
```

---

## 📚 References

### Files
- `server/lib/env.ts` - Server validation
- `client/src/lib/env.ts` - Client validation
- `.env.example` - Template
- `ENV_VARIABLES_GUIDE.md` - This file

### Related Guides
- `ENCRYPTION_SETUP.md` - ENCRYPTION_KEY details
- `SESSION_STORAGE_GUIDE.md` - SESSION_SECRET details
- `DEPLOYMENT_CHECKLIST.md` - Production deployment

---

## ✅ Checklist

Before deploying:

- [ ] All required variables set
- [ ] Secrets generated with openssl
- [ ] Different secrets for each environment
- [ ] `.env` in `.gitignore`
- [ ] Validation passes locally
- [ ] Validation passes in production
- [ ] Secrets backed up securely

---

**Environment validated?** ✅ Ready to run!

**Still having issues?** Check troubleshooting section above.

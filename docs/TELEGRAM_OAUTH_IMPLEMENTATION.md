# 🔐 Telegram OAuth Implementation Guide

## 📋 Table of Contents
- [Overview](#overview)
- [User Scenarios](#user-scenarios)
- [Security Considerations](#security-considerations)
- [Implementation Steps](#implementation-steps)
- [Testing Plan](#testing-plan)
- [Troubleshooting](#troubleshooting)

---

## Overview

This document describes the implementation of Telegram OAuth authentication for the Budget Buddy web app, allowing users to:
- Log in using their Telegram account
- Link Telegram to existing email accounts
- Use either email or Telegram for authentication

### Architecture

```
User → Telegram Login Widget → Telegram Servers → Our Backend
                                                        ↓
                                                  Verify Hash
                                                        ↓
                                                Find or Create User
                                                        ↓
                                                  Create Session
                                                        ↓
                                                Return Token/Cookie
```

---

## User Scenarios

### 1️⃣ New User via Telegram

**Flow:**
1. User clicks "Login with Telegram" on auth page
2. Telegram widget opens, user authorizes
3. Telegram returns: `id`, `first_name`, `username`, `photo_url`, `hash`
4. Backend checks: does `telegram_id` exist in DB?
5. **NO** → Create new user with `email = NULL`, `password = NULL`
6. Create session, redirect to dashboard

**Database State:**
```sql
INSERT INTO users (
  email, password, name,
  telegram_id, telegram_username, telegram_first_name, telegram_photo_url
) VALUES (
  NULL, NULL, 'John Doe',
  '123456789', '@johndoe', 'John', 'https://...'
);
```

### 2️⃣ Existing Telegram Bot User → Web Login

**Flow:**
1. User already has account from Telegram bot (created by bot backend)
2. User clicks "Login with Telegram" on website
3. Backend finds user by `telegram_id`
4. Create session, redirect to dashboard ✅

**Key Point:** Telegram bot and web app **MUST** use the same database!

### 3️⃣ Email User → Link Telegram

**Flow:**
1. User registered via email/password
2. Goes to Settings → "Link Telegram Account"
3. Clicks "Connect Telegram" button
4. Telegram widget opens, user authorizes
5. Backend receives `telegram_id`
6. Checks: is this `telegram_id` already linked to another user?
   - **YES** → Error: "This Telegram is already linked to another account"
   - **NO** → Update user: `telegram_id = 123456789`
7. Success! User can now login with both methods

**Database State:**
```sql
UPDATE users SET
  telegram_id = '123456789',
  telegram_username = '@johndoe',
  telegram_first_name = 'John',
  telegram_photo_url = 'https://...'
WHERE id = [current_user_id];
```

### 4️⃣ Telegram User → Add Email

**Flow:**
1. User registered via Telegram only (`email = NULL`)
2. Goes to Settings → "Add Email & Password"
3. Enters email and password
4. Backend checks: is this email already taken?
   - **YES** → Offer to merge accounts (advanced feature)
   - **NO** → Update user: `email = 'john@example.com'`, `password = hashed`
5. Success! User can now login with both methods

**Database State:**
```sql
UPDATE users SET
  email = 'john@example.com',
  password = '$2a$10$...' -- bcrypt hash
WHERE id = [current_user_id];
```

### 5️⃣ Conflict: Duplicate Accounts ⚠️

**Problem:**
- User creates account via email → `user_id: 100`
- Later, creates account via Telegram bot → `user_id: 200`
- Now tries to login via Telegram on website
- **Result:** Two separate accounts for one person!

**Solutions:**

#### Option A: Prevent at Telegram Login
```
When user logs in via Telegram:
1. Check if telegram_id exists → Login
2. If new telegram_id → Check if username matches existing user
3. If match found → Ask: "Found account with email john@example.com. Merge accounts?"
   - YES → Migrate data from old account to new, delete old
   - NO → Create separate account
```

#### Option B: Manual Merge in Settings
```
Settings → "Merge Accounts"
User provides credentials for other account
Backend validates and merges data
```

**Recommended:** Option A (prevent duplicates at login)

---

## Security Considerations

### 1. Hash Verification (CRITICAL!)

Telegram provides a `hash` field to verify authenticity. **MUST** verify on backend:

```typescript
function verifyTelegramAuth(data: TelegramAuthData, botToken: string): boolean {
  const { hash, ...restData } = data;

  // Create secret from bot token
  const secret = crypto.createHash('sha256')
    .update(botToken)
    .digest();

  // Create data-check-string
  const dataCheckString = Object.keys(restData)
    .sort()
    .map(key => `${key}=${restData[key]}`)
    .join('\n');

  // Compute HMAC-SHA256
  const computedHash = crypto.createHmac('sha256', secret)
    .update(dataCheckString)
    .digest('hex');

  return computedHash === hash;
}
```

**Why this matters:**
- Without verification, anyone can fake Telegram data
- Attacker could send: `{ id: 123456789, hash: "fake" }`
- They would get access to someone else's account!

### 2. Auth Data Freshness

Telegram includes `auth_date` timestamp. Check if not older than 24 hours:

```typescript
function isAuthDataFresh(authDate: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  const maxAge = 86400; // 24 hours
  return (now - authDate) < maxAge;
}
```

### 3. Unique Constraints

```sql
-- telegram_id must be unique (but can be NULL)
CREATE UNIQUE INDEX idx_users_telegram_id
ON users(telegram_id)
WHERE telegram_id IS NOT NULL;

-- email must be unique (but can be NULL)
CREATE UNIQUE INDEX idx_users_email
ON users(email)
WHERE email IS NOT NULL;

-- User must have EITHER email+password OR telegram_id
ALTER TABLE users
ADD CONSTRAINT users_auth_method_check
CHECK (
  (email IS NOT NULL AND password IS NOT NULL) OR
  (telegram_id IS NOT NULL)
);
```

### 4. Session Security

- Use HTTPS in production (`secure: true` for cookies)
- Set `httpOnly: true` to prevent XSS
- Set `sameSite: 'lax'` for CSRF protection
- Session max age: 7 days (configurable)

---

## Implementation Steps

### ✅ Step 1: Database Migration (COMPLETED)

File: `/migrations/0001_make_email_password_nullable.sql`

Changes:
- Make `email` nullable
- Make `password` nullable
- Add `telegram_first_name` column
- Add `telegram_photo_url` column
- Add CHECK constraint
- Create indexes

**Run migration:**
```bash
DATABASE_URL="your_db_url" npx drizzle-kit push
```

### ✅ Step 2: Update TypeScript Schema (COMPLETED)

File: `/shared/schema.ts`

Changes:
- Remove `.notNull()` from email and password
- Add `telegramFirstName` and `telegramPhotoUrl` fields
- Add CHECK constraint definition

### ✅ Step 3: Backend - Telegram OAuth Endpoints (COMPLETED)

File: `/server/routes/auth-telegram.routes.ts`

Endpoints created:
- `POST /api/auth/telegram` - Login via Telegram
- `POST /api/auth/link-telegram` - Link Telegram to existing account
- `POST /api/auth/unlink-telegram` - Unlink Telegram

Features:
- Hash verification
- Auth data freshness check
- Duplicate account detection
- Session creation

### ✅ Step 4: Register Routes (COMPLETED)

File: `/server/auth.ts`

Changes:
- Import `authTelegramRouter`
- Register with `app.use("/api/auth", authTelegramRouter)`
- Update `/api/user` endpoint to include Telegram fields

### 🔄 Step 5: Frontend - Telegram Login Widget

File: `/client/src/pages/auth-page.tsx`

**TODO:** Add Telegram Login Widget

```tsx
import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export function TelegramLoginButton() {
  const [, setLocation] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Define callback for Telegram widget
    (window as any).onTelegramAuth = async (user: TelegramUser) => {
      try {
        const response = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Telegram login successful:', data);
          setLocation('/app/dashboard');
        } else {
          const error = await response.json();
          console.error('Telegram login failed:', error);
          alert('Failed to login via Telegram: ' + error.error);
        }
      } catch (error) {
        console.error('Telegram login error:', error);
        alert('An error occurred during Telegram login');
      }
    };

    // Load Telegram Login Widget script
    if (containerRef.current && !containerRef.current.querySelector('script')) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', 'YOUR_BOT_USERNAME'); // Replace with your bot username!
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '8');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;
      containerRef.current.appendChild(script);
    }
  }, [setLocation]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={containerRef} />
      <p className="text-xs text-muted-foreground">
        Quick login using Telegram
      </p>
    </div>
  );
}
```

**Integration into Auth Page:**
```tsx
<div className="space-y-4">
  {/* Email/Password Form */}
  <EmailLoginForm />

  {/* Divider */}
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <span className="w-full border-t" />
    </div>
    <div className="relative flex justify-center text-xs uppercase">
      <span className="bg-background px-2 text-muted-foreground">
        Or continue with
      </span>
    </div>
  </div>

  {/* Telegram Login */}
  <TelegramLoginButton />
</div>
```

**Important:** Replace `YOUR_BOT_USERNAME` with your actual Telegram bot username (without @)!

### 🔄 Step 6: Frontend - Settings Page (Link/Unlink)

File: `/client/src/pages/settings.tsx`

**TODO:** Add Telegram account linking section

```tsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface User {
  id: number;
  email: string | null;
  name: string;
  telegramId: string | null;
  telegramUsername: string | null;
}

export function TelegramAccountSettings() {
  const { data: user } = useQuery<User>({ queryKey: ['/api/user'] });

  const linkMutation = useMutation({
    mutationFn: async (telegramData: any) => {
      const response = await fetch('/api/auth/link-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramData),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to link Telegram');
      return response.json();
    },
    onSuccess: () => {
      alert('Telegram account linked successfully!');
      window.location.reload();
    },
    onError: (error: any) => {
      alert('Failed to link Telegram: ' + error.message);
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/unlink-telegram', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to unlink Telegram');
      return response.json();
    },
    onSuccess: () => {
      alert('Telegram account unlinked successfully!');
      window.location.reload();
    },
    onError: (error: any) => {
      alert('Failed to unlink Telegram: ' + error.message);
    },
  });

  useEffect(() => {
    (window as any).onTelegramAuth = (data: any) => {
      linkMutation.mutate(data);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telegram Account</CardTitle>
        <CardDescription>
          Link your Telegram account for quick login
        </CardDescription>
      </CardHeader>
      <CardContent>
        {user?.telegramId ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Connected</Badge>
                {user.telegramUsername && (
                  <span className="text-sm">@{user.telegramUsername}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                You can login using Telegram
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => unlinkMutation.mutate()}
              disabled={!user.email} // Can't unlink if no email
            >
              Unlink
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              No Telegram account linked
            </p>
            <div id="telegram-link-container" />
            <script
              async
              src="https://telegram.org/js/telegram-widget.js?22"
              data-telegram-login="YOUR_BOT_USERNAME"
              data-size="medium"
              data-onauth="onTelegramAuth(user)"
              data-request-access="write"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 🔄 Step 7: Update User Repository

File: `/server/repositories/user.repository.ts`

**TODO:** Add method to find user by telegram_id

```typescript
async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
  const [user] = await db.select()
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1);
  return user;
}
```

### 🔄 Step 8: Update Auth Validation

**TODO:** Update login validation to handle NULL email/password

File: `/server/auth.ts` (LocalStrategy)

Current strategy requires email/password. This is OK because LocalStrategy is only for email login. Telegram uses a different endpoint (`/api/auth/telegram`).

No changes needed! ✅

### 🔄 Step 9: Bot Token Configuration

**TODO:** Ensure `TELEGRAM_BOT_TOKEN` is in environment variables

`.env`:
```
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxyz
```

This should already exist from Telegram bot setup.

---

## Testing Plan

### Test Case 1: New Telegram User Registration

**Steps:**
1. Go to login page
2. Click "Login with Telegram"
3. Authorize in Telegram popup
4. Should redirect to dashboard
5. Check database: new user with `email = NULL`

**Expected Result:**
```sql
SELECT * FROM users WHERE telegram_id = '123456789';
-- email: NULL
-- password: NULL
-- telegram_id: '123456789'
-- telegram_username: '@testuser'
-- telegram_first_name: 'Test'
```

### Test Case 2: Existing Telegram Bot User Login

**Setup:**
1. Create user via Telegram bot (sets `telegram_id`)
2. Go to web app login page
3. Click "Login with Telegram"
4. Authorize with SAME Telegram account

**Expected Result:**
- Should login to existing account (not create new one)
- Should redirect to dashboard with existing data

### Test Case 3: Link Telegram to Email Account

**Setup:**
1. Register via email/password
2. Login to web app
3. Go to Settings → Telegram Account
4. Click "Connect Telegram"
5. Authorize in Telegram popup

**Expected Result:**
```sql
UPDATE users SET
  telegram_id = '123456789',
  telegram_username = '@testuser'
WHERE email = 'test@example.com';
```

### Test Case 4: Telegram User Adds Email

**Setup:**
1. Login via Telegram (user has `email = NULL`)
2. Go to Settings → Account
3. Fill "Add Email & Password" form
4. Submit

**Expected Result:**
```sql
UPDATE users SET
  email = 'test@example.com',
  password = '$2a$10$...'
WHERE telegram_id = '123456789';
```

User can now login with both methods.

### Test Case 5: Duplicate Account Detection

**Setup:**
1. Create account via email: `test@example.com`
2. Create account via Telegram bot: `telegram_id: 123`
3. Go to web app, click "Login with Telegram"
4. Authorize with telegram_id 123

**Expected Result:**
- Should detect duplicate
- Show dialog: "Found account with email test@example.com. Merge?"
- If YES → merge data, delete old account
- If NO → use Telegram account

### Test Case 6: Security - Invalid Hash

**Setup:**
1. Intercept Telegram auth response
2. Modify `hash` field to random value
3. Send to `/api/auth/telegram`

**Expected Result:**
- Error 401: "Invalid Telegram authentication data"
- No session created
- No user created/logged in

### Test Case 7: Security - Old Auth Data

**Setup:**
1. Intercept Telegram auth response
2. Set `auth_date` to 48 hours ago
3. Send to `/api/auth/telegram`

**Expected Result:**
- Error 401: "Telegram authentication data is too old"
- No session created

---

## Troubleshooting

### Issue: "Invalid Telegram authentication data"

**Cause:** Hash verification failed

**Solutions:**
1. Check `TELEGRAM_BOT_TOKEN` is correct
2. Ensure you're using bot token (not API hash)
3. Verify bot username in widget matches token
4. Check Telegram widget version is latest

### Issue: Widget not loading

**Cause:** Script blocked or wrong configuration

**Solutions:**
1. Check browser console for errors
2. Ensure bot username is correct (no @)
3. Check Content Security Policy allows Telegram domain
4. Verify internet connection

### Issue: "This Telegram is already linked"

**Cause:** Trying to link telegram_id that's already used

**Solutions:**
1. User should unlink from other account first
2. Or use merge accounts feature
3. Or login with Telegram instead of linking

### Issue: Can't unlink Telegram

**Cause:** User has no email/password

**Solutions:**
1. Add email & password first
2. Then unlink Telegram
3. UI should prevent unlink button if no email

---

## Next Steps

After basic implementation:

### Phase 2: Advanced Features

1. **Account Merging UI**
   - Detect duplicate accounts
   - Show merge dialog
   - Migrate transactions, wallets, etc.

2. **Social Profile**
   - Use Telegram photo as avatar
   - Display Telegram username in profile
   - Sync updates from Telegram

3. **Telegram Notifications**
   - Send web app updates to Telegram
   - Use Telegram bot for notifications

4. **Telegram Mini App Integration**
   - Share auth session between web and mini app
   - Seamless transition

---

## API Reference

### POST /api/auth/telegram

Authenticate user via Telegram Login Widget.

**Request Body:**
```json
{
  "id": 123456789,
  "first_name": "John",
  "username": "johndoe",
  "photo_url": "https://...",
  "auth_date": 1234567890,
  "hash": "abc123..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": null,
    "telegramId": "123456789",
    "telegramUsername": "@johndoe"
  },
  "message": "Logged in successfully via Telegram",
  "isNewUser": false
}
```

**Response (Error):**
```json
{
  "error": "Invalid Telegram authentication data"
}
```

### POST /api/auth/link-telegram

Link Telegram account to current user (requires authentication).

**Request Body:** Same as above

**Response (Success):**
```json
{
  "success": true,
  "message": "Telegram account linked successfully"
}
```

**Response (Conflict):**
```json
{
  "error": "This Telegram account is already linked to another user",
  "conflictUserId": 42
}
```

### POST /api/auth/unlink-telegram

Unlink Telegram from current user (requires authentication).

**Response (Success):**
```json
{
  "success": true,
  "message": "Telegram account unlinked successfully"
}
```

**Response (Error):**
```json
{
  "error": "Cannot unlink Telegram: you must add email and password first"
}
```

---

## Environment Variables

```bash
# Telegram Bot Token (required for auth verification)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxyz

# Session Secret (already configured)
SESSION_SECRET=your_secret_here

# Database URL (already configured)
DATABASE_URL=postgresql://...
```

---

## Summary

**Completed:**
- ✅ Database migration (nullable email/password)
- ✅ TypeScript schema updates
- ✅ Backend OAuth endpoints
- ✅ Hash verification
- ✅ Route registration

**TODO:**
- 🔄 Frontend Telegram Login Widget
- 🔄 Settings page Telegram section
- 🔄 Testing (7 test cases)
- 🔄 Update bot username in widget
- 🔄 Deploy and test in production

**Estimated Time:**
- Frontend implementation: 2-3 hours
- Testing: 1-2 hours
- Bug fixes: 1 hour
- **Total: 4-6 hours**

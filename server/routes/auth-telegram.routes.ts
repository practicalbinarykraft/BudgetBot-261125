/**
 * Telegram OAuth Authentication Routes
 *
 * Handles Telegram Login Widget authentication for web app
 */

import { Router } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import type { Request, Response } from 'express';

const router = Router();

interface TelegramAuthData {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Verify Telegram Login Widget data authenticity
 *
 * FOR JUNIORS: How Telegram OAuth Security Works
 * -----------------------------------------------
 *
 * PROBLEM: How do we know the data really came from Telegram and wasn't faked?
 * SOLUTION: Telegram sends a cryptographic signature (hash) that we verify!
 *
 * HOW IT WORKS (step by step):
 *
 * 1. USER CLICKS LOGIN:
 *    - Telegram Login Widget opens
 *    - User authorizes our app
 *
 * 2. TELEGRAM SERVERS PREPARE DATA:
 *    - Telegram collects: id, first_name, username, photo_url, auth_date
 *    - Telegram creates a "signature" (hash) using THEIR copy of our bot token
 *    - Hash = HMAC-SHA256(data, secret_key_from_bot_token)
 *
 * 3. TELEGRAM SENDS TO US:
 *    { id: 123, first_name: "John", ..., hash: "abc123..." }
 *
 * 4. WE VERIFY THE HASH:
 *    - We compute the SAME hash using OUR copy of bot token
 *    - If hashes match → data is authentic! ✅
 *    - If hashes don't match → data was tampered! ❌
 *
 * WHY THIS IS SECURE:
 * - Only Telegram and we know the bot token
 * - Hash cannot be faked without knowing bot token
 * - Changing ANY data invalidates the hash
 *
 * EXAMPLE ATTACK (prevented by this verification):
 * Bad actor tries: { id: 999999, hash: "fake" }
 * → Our computed hash won't match "fake"
 * → Reject! 🚫
 *
 * @see https://core.telegram.org/widgets/login#checking-authorization
 */
function verifyTelegramAuth(data: TelegramAuthData, botToken: string): boolean {
  // STEP 1: Separate hash from data
  // We need to verify hash, so we extract it and keep the rest
  const { hash, ...restData } = data;

  // STEP 2: Create secret key from bot token
  // Bot token itself is not the secret - we hash it first!
  // SHA256 creates a fixed-length (256-bit) key from any input
  // This is what Telegram does on their side too
  const secret = crypto.createHash('sha256')
    .update(botToken)
    .digest();

  // STEP 3: Create data-check-string
  // Format: "auth_date=1234\nfirst_name=John\nid=123"
  // IMPORTANT: Must be in alphabetical order! (Telegram does this too)
  const dataCheckString = Object.keys(restData)
    .sort() // ← Alphabetical! This must match Telegram's order
    .map(key => `${key}=${restData[key as keyof typeof restData]}`)
    .join('\n'); // ← Newline separator

  // STEP 4: Compute HMAC-SHA256
  // HMAC = Hash-based Message Authentication Code
  // Think of it as a "signature" that proves:
  // - Data came from someone who knows the secret (bot token)
  // - Data hasn't been modified
  //
  // HMAC is better than plain hash because:
  // - Plain hash: hash(data) - anyone can compute
  // - HMAC: hmac(data, secret) - only those with secret can compute
  const computedHash = crypto.createHmac('sha256', secret)
    .update(dataCheckString)
    .digest('hex'); // ← Convert to hex string (64 characters)

  // STEP 5: Compare hashes
  // If they match → data is authentic and unmodified ✅
  // If they don't match → reject! ❌
  //
  // SECURITY NOTE: Use crypto.timingSafeEqual() in production to prevent
  // timing attacks, but simple === is okay for POC
  return computedHash === hash;
}

/**
 * Check if auth data is not too old (24 hours)
 *
 * FOR JUNIORS: Why We Check Auth Data Freshness
 * ----------------------------------------------
 *
 * PROBLEM: What if someone recorded Telegram auth data and replays it later?
 * SOLUTION: Reject authentication data older than 24 hours!
 *
 * HOW IT WORKS:
 * - Telegram includes `auth_date` (Unix timestamp) in the data
 * - We check: is this timestamp recent? (< 24 hours ago)
 * - If too old → reject! Even if hash is valid
 *
 * EXAMPLE ATTACK (prevented by this check):
 * 1. Attacker intercepts valid auth data on Monday
 * 2. Attacker tries to replay it on Friday (4 days later)
 * 3. Hash is still valid! But auth_date is old
 * 4. We reject! ✅
 *
 * UNIX TIMESTAMP:
 * - Seconds since Jan 1, 1970 (not milliseconds!)
 * - Example: 1609459200 = Jan 1, 2021
 * - JavaScript uses milliseconds, so we divide by 1000
 *
 * @param authDate - Unix timestamp (in seconds) from Telegram
 * @returns true if fresh (< 24h old), false if stale
 */
function isAuthDataFresh(authDate: number): boolean {
  // Get current time in seconds (not milliseconds!)
  // Date.now() returns milliseconds, so divide by 1000
  const now = Math.floor(Date.now() / 1000);

  // Maximum age: 24 hours = 86400 seconds
  // 60 sec/min × 60 min/hr × 24 hr = 86400 seconds
  const maxAge = 86400;

  // Check if age is within limit
  // Age = (now - authDate)
  // If age < 24 hours → fresh ✅
  // If age >= 24 hours → stale ❌
  return (now - authDate) < maxAge;
}

/**
 * POST /api/auth/telegram
 *
 * FOR JUNIORS: Telegram OAuth Login/Register Flow
 * ------------------------------------------------
 *
 * WHAT THIS ENDPOINT DOES:
 * This is the main authentication endpoint for Telegram Login Widget.
 * It handles BOTH login (existing users) and registration (new users).
 *
 * THE COMPLETE FLOW:
 *
 * 1. USER CLICKS "Login with Telegram" on frontend
 *    ↓
 * 2. Telegram Login Widget opens
 *    ↓
 * 3. User authorizes our app in Telegram
 *    ↓
 * 4. Telegram sends us: { id, first_name, username, photo_url, auth_date, hash }
 *    ↓
 * 5. THIS ENDPOINT receives that data
 *    ↓
 * 6. SECURITY CHECKS (if any fail → reject! 🚫):
 *    ✓ All required fields present? (id, first_name, hash, auth_date)
 *    ✓ Bot token configured in environment?
 *    ✓ Hash is valid? (verifyTelegramAuth)
 *    ✓ Auth data is fresh? (< 24 hours)
 *    ↓
 * 7. LOOKUP USER by telegram_id in database
 *    ↓
 * 8. IF USER EXISTS:
 *    - Update their Telegram data (username/photo might have changed)
 *    - Create session (req.login)
 *    - Return success with user data
 *    ↓
 *    OR
 *    ↓
 * 9. IF USER IS NEW:
 *    - Create new user with telegram_id (email = NULL, password = NULL)
 *    - Create session
 *    - Return success with isNewUser: true
 *
 * SECURITY LAYERS:
 * - Layer 1: Validate required fields (prevent incomplete data)
 * - Layer 2: Verify hash (prevent fake/tampered data)
 * - Layer 3: Check freshness (prevent replay attacks)
 * - Layer 4: Database constraints (email OR telegram_id required)
 *
 * WHY WE CHECK BOTH HASH AND FRESHNESS:
 * - Hash alone: prevents tampering, but doesn't prevent replay attacks
 * - Freshness alone: prevents replay, but doesn't prevent fake data
 * - Together: complete protection! ✅
 *
 * EXAMPLE SCENARIOS:
 * 1. New user "John" logs in via Telegram for first time
 *    → Creates account with just telegram_id, no email
 * 2. Existing user "Jane" (who used Telegram before) logs in again
 *    → Updates username/photo, creates session
 * 3. Attacker tries to fake Telegram data
 *    → Hash verification fails → reject!
 * 4. Attacker replays old valid data
 *    → Freshness check fails → reject!
 */
router.post('/telegram', async (req: Request, res: Response) => {
  try {
    const authData: TelegramAuthData = req.body;

    // STEP 1: Validate required fields
    // WHY: Prevent processing incomplete data that would fail later
    // Required: id (user's Telegram ID), first_name, hash, auth_date
    // Optional: username, photo_url (not all Telegram users have these)
    if (!authData.id || !authData.first_name || !authData.hash || !authData.auth_date) {
      return res.status(400).json({ error: 'Missing required Telegram auth data' });
    }

    // STEP 2: Get bot token from environment
    // WHY: We need bot token to verify hash (shared secret with Telegram)
    // Security: Never expose bot token in code or to frontend!
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return res.status(500).json({ error: 'Telegram authentication not configured' });
    }

    // STEP 3: Verify auth data authenticity
    // WHY: Ensure data really came from Telegram and wasn't tampered with
    // HOW: Compute hash of data using bot token, compare with provided hash
    // If hashes don't match → data is fake or modified → reject!
    if (!verifyTelegramAuth(authData, botToken)) {
      console.warn('Invalid Telegram auth hash:', authData);
      return res.status(401).json({ error: 'Invalid Telegram authentication data' });
    }

    // STEP 4: Check if auth data is fresh (not older than 24 hours)
    // WHY: Prevent replay attacks (someone using old valid data)
    // Even if hash is valid, if data is too old → reject!
    if (!isAuthDataFresh(authData.auth_date)) {
      return res.status(401).json({ error: 'Telegram authentication data is too old' });
    }

    // STEP 5: Convert Telegram ID to string for database storage
    // Note: Telegram IDs are numbers, but we store as text in database
    const telegramId = authData.id.toString();

    // STEP 6: Lookup user in database by telegram_id
    // WHY: Determine if this is a returning user (login) or new user (register)
    // We search by telegram_id (not email!) because Telegram users may not have email
    let [user] = await db.select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (user) {
      // SCENARIO A: EXISTING USER (Returning Telegram User)
      // ----------------------------------------------------
      // This user has logged in via Telegram before
      // Their telegram_id is already in our database
      // Just log them in and update their latest Telegram data

      console.log(`Telegram login: User ${user.id} (telegram_id: ${telegramId})`);

      // Update Telegram data (username/photo might have changed)
      // WHY: Users can change their Telegram username or profile photo
      // We want to keep our database in sync with latest Telegram data
      // Note: We don't update telegram_id (it's immutable in Telegram)
      await db.update(users)
        .set({
          telegramUsername: authData.username || null,
          telegramFirstName: authData.first_name,
          telegramPhotoUrl: authData.photo_url || null,
        })
        .where(eq(users.id, user.id));

      // Create session using Passport.js
      // req.login() is provided by passport middleware
      // It serializes user into session, creating a cookie
      // After this, user will be authenticated for subsequent requests
      req.login(user, (err) => {
        if (err) {
          console.error('Session creation error:', err);
          return res.status(500).json({ error: 'Failed to create session' });
        }

        return res.json({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email, // May be null if Telegram-only user
            telegramId: user.telegramId,
            telegramUsername: user.telegramUsername,
          },
          message: 'Logged in successfully via Telegram',
        });
      });
    } else {
      // SCENARIO B: NEW USER (First-Time Telegram User)
      // ------------------------------------------------
      // This telegram_id doesn't exist in our database
      // This is a brand new user registering via Telegram
      // Create account with telegram_id, leave email/password as NULL

      console.log(`New Telegram user: telegram_id ${telegramId}, name: ${authData.first_name}`);

      // Generate display name from Telegram data
      // Priority: username > first_name > fallback to "User{id}"
      // Example: "@johndoe" or "John Smith" or "User123456789"
      const name = authData.username || authData.first_name || `User${telegramId}`;

      // Create new user in database
      // IMPORTANT: email and password are NULL (Telegram-only user)
      // Database CHECK constraint allows this: (email + password) OR telegram_id
      // User can add email/password later in settings if they want
      const [newUser] = await db.insert(users).values({
        email: null, // No email for Telegram-only users
        password: null, // No password for Telegram-only users
        name,
        telegramId,
        telegramUsername: authData.username || null,
        telegramFirstName: authData.first_name,
        telegramPhotoUrl: authData.photo_url || null,
      }).returning();

      // Create session for newly registered user
      // Same as above: serialize user into session, create cookie
      req.login(newUser, (err) => {
        if (err) {
          console.error('Session creation error:', err);
          return res.status(500).json({ error: 'Failed to create session' });
        }

        return res.json({
          success: true,
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email, // Will be null for new Telegram user
            telegramId: newUser.telegramId,
            telegramUsername: newUser.telegramUsername,
          },
          message: 'Account created successfully via Telegram',
          isNewUser: true, // Frontend can show "Welcome!" instead of "Welcome back!"
        });
      });
    }
  } catch (error) {
    console.error('Telegram auth error:', error);
    return res.status(500).json({ error: 'Internal server error during Telegram authentication' });
  }
});

/**
 * POST /api/auth/link-telegram
 *
 * FOR JUNIORS: Link Telegram to Existing Email Account
 * -----------------------------------------------------
 *
 * WHAT THIS ENDPOINT DOES:
 * Connects a Telegram account to an existing user who registered with email.
 * After linking, user can login using EITHER email OR Telegram.
 *
 * USE CASE SCENARIO:
 * 1. User "Jane" registered with email: jane@example.com
 * 2. Jane visits Settings page in web app
 * 3. Jane clicks "Link Telegram Account"
 * 4. Telegram Login Widget opens
 * 5. Jane authorizes in Telegram
 * 6. THIS ENDPOINT receives Telegram data
 * 7. We add telegram_id to Jane's existing account
 * 8. Now Jane can login with email OR Telegram (her choice!)
 *
 * WHY USER MUST BE AUTHENTICATED:
 * This is NOT for new user registration - it's for EXISTING users.
 * User must already be logged in (have active session) to link Telegram.
 * Why? Security! We need to know WHICH account to link Telegram to.
 *
 * SECURITY: DUPLICATE TELEGRAM ACCOUNT DETECTION
 * -----------------------------------------------
 * PROBLEM: What if this telegram_id is already linked to another user?
 * Example:
 * - User A (id=1) has telegram_id=123456
 * - User B (id=2, logged in) tries to link telegram_id=123456
 * - Should we allow this? NO! ❌
 *
 * SOLUTION: We check if telegram_id exists in database first
 * If it exists AND belongs to a different user → reject with 409 Conflict
 * If it exists AND belongs to current user → idempotent (already linked, success)
 * If it doesn't exist → link it!
 *
 * DIFFERENCE FROM /api/auth/telegram:
 * - /api/auth/telegram: Login OR register (no auth required)
 * - /api/auth/link-telegram: Add Telegram to existing account (auth REQUIRED)
 */
router.post('/link-telegram', async (req: Request, res: Response) => {
  try {
    // STEP 1: Check if user is authenticated
    // WHY: We need to know WHICH user account to link Telegram to
    // req.user is populated by Passport.js middleware if user has valid session
    // If no session → reject! User must login first
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.user.id;
    const authData: TelegramAuthData = req.body;

    // STEP 2: Validate required fields (same as /api/auth/telegram)
    if (!authData.id || !authData.first_name || !authData.hash || !authData.auth_date) {
      return res.status(400).json({ error: 'Missing required Telegram auth data' });
    }

    // STEP 3: Get bot token from environment (same as /api/auth/telegram)
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: 'Telegram authentication not configured' });
    }

    // STEP 4: Verify auth data authenticity (same as /api/auth/telegram)
    // Ensures data really came from Telegram and wasn't faked
    if (!verifyTelegramAuth(authData, botToken)) {
      return res.status(401).json({ error: 'Invalid Telegram authentication data' });
    }

    // STEP 5: Check auth data freshness (same as /api/auth/telegram)
    // Prevents replay attacks
    if (!isAuthDataFresh(authData.auth_date)) {
      return res.status(401).json({ error: 'Telegram authentication data is too old' });
    }

    const telegramId = authData.id.toString();

    // STEP 6: CRITICAL - Check for duplicate Telegram account
    // WHY: Prevent linking same telegram_id to multiple users
    // This is the KEY difference from /api/auth/telegram endpoint
    //
    // SCENARIO TO PREVENT:
    // - User A created account via Telegram (telegram_id=123)
    // - User B (with email) tries to link telegram_id=123
    // - If we allowed this, User B could take over User A's account!
    // - We reject this with 409 Conflict
    const [existingUser] = await db.select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (existingUser && existingUser.id !== userId) {
      // telegram_id is already linked to a DIFFERENT user
      // This is a conflict! Reject.
      // Status 409 Conflict = "Request conflicts with current server state"
      return res.status(409).json({
        error: 'This Telegram account is already linked to another user',
        conflictUserId: existingUser.id,
      });
    }

    // If existingUser.id === userId → already linked to current user (idempotent)
    // If existingUser is null → telegram_id not linked to anyone (proceed!)

    // STEP 7: Link Telegram to current user
    // Update user's record with telegram_id and Telegram profile data
    // This allows user to login with Telegram in the future
    await db.update(users)
      .set({
        telegramId,
        telegramUsername: authData.username || null,
        telegramFirstName: authData.first_name,
        telegramPhotoUrl: authData.photo_url || null,
      })
      .where(eq(users.id, userId));

    console.log(`Linked Telegram account ${telegramId} to user ${userId}`);

    return res.json({
      success: true,
      message: 'Telegram account linked successfully',
    });
  } catch (error) {
    console.error('Link Telegram error:', error);
    return res.status(500).json({ error: 'Failed to link Telegram account' });
  }
});

/**
 * POST /api/auth/unlink-telegram
 *
 * FOR JUNIORS: Unlink Telegram from Account
 * ------------------------------------------
 *
 * WHAT THIS ENDPOINT DOES:
 * Removes Telegram connection from user's account.
 * User will no longer be able to login via Telegram (only email).
 *
 * USE CASE SCENARIO:
 * 1. User "John" has account with BOTH email and Telegram linked
 * 2. John visits Settings page
 * 3. John clicks "Unlink Telegram Account"
 * 4. THIS ENDPOINT removes telegram_id from John's account
 * 5. Now John can ONLY login with email (Telegram login won't work)
 *
 * CRITICAL SAFETY CHECK: ACCOUNT LOCKOUT PREVENTION
 * --------------------------------------------------
 * PROBLEM: What if user only has Telegram and tries to unlink it?
 * Example:
 * - User created account via Telegram ONLY (no email, no password)
 * - User tries to unlink Telegram
 * - If we allow this → user is LOCKED OUT! No way to login! 🚫
 *
 * SOLUTION: Before unlinking, check if user has email + password
 * - If user has email + password → safe to unlink Telegram ✅
 * - If user ONLY has Telegram → reject with 400 Bad Request ❌
 * - Error message: "You must add email and password first"
 *
 * DATABASE CONSTRAINT PROTECTION:
 * Our database has CHECK constraint: (email + password) OR telegram_id
 * This means user MUST have at least one authentication method.
 * Even if we didn't check manually, database would reject this update.
 * But we check explicitly to give user a friendly error message!
 *
 * WHY USER MIGHT WANT TO UNLINK:
 * - Privacy concerns (don't want Telegram connected)
 * - Changing Telegram accounts
 * - Security (if Telegram account was compromised)
 *
 * EXAMPLE SCENARIOS:
 * 1. User with email + Telegram → unlink → now only email (allowed) ✅
 * 2. User with ONLY Telegram → unlink → REJECTED (would lock user out) ❌
 * 3. User with email (no password) + Telegram → unlink → REJECTED ❌
 */
router.post('/unlink-telegram', async (req: Request, res: Response) => {
  try {
    // STEP 1: Check if user is authenticated
    // WHY: We need to know WHICH user account to unlink Telegram from
    // Same as link endpoint - user must be logged in
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.user.id;

    // STEP 2: CRITICAL SAFETY CHECK - Fetch user to verify they have alternative auth
    // WHY: Prevent account lockout!
    // We need to ensure user has email + password BEFORE removing telegram_id
    // If we unlink Telegram from Telegram-only user → they can't login anymore!
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // STEP 3: Check if user has BOTH email AND password
    // WHY: User needs alternative login method before we remove Telegram
    // Both must exist! Email alone isn't enough (can't login without password)
    // Password alone isn't enough (can't login without email)
    if (!user.email || !user.password) {
      // User doesn't have email/password → Telegram is their ONLY auth method
      // If we unlink → user is locked out permanently!
      // Reject with helpful error message explaining what they need to do
      return res.status(400).json({
        error: 'Cannot unlink Telegram: you must add email and password first',
      });
    }

    // STEP 4: Safe to unlink! User has email + password as backup
    // Set all Telegram-related fields to NULL
    // After this, user can only login with email (Telegram login will fail)
    await db.update(users)
      .set({
        telegramId: null,
        telegramUsername: null,
        telegramFirstName: null,
        telegramPhotoUrl: null,
      })
      .where(eq(users.id, userId));

    console.log(`Unlinked Telegram from user ${userId}`);

    return res.json({
      success: true,
      message: 'Telegram account unlinked successfully',
    });
  } catch (error) {
    console.error('Unlink Telegram error:', error);
    return res.status(500).json({ error: 'Failed to unlink Telegram account' });
  }
});

// Export helper functions for testing
export { verifyTelegramAuth, isAuthDataFresh };
export type { TelegramAuthData };

export default router;

import { Router } from "express";
import { db } from "../db";
import { users, telegramVerificationCodes } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { withAuth } from "../middleware/auth-utils";
import { VERIFICATION_CODE_TTL_MINUTES } from "../telegram/config";
import { TELEGRAM_BOT_TOKEN } from "../telegram/config";
import { validateInitData } from "../services/telegram-validation.service";
import { authRateLimiter } from "../middleware/rate-limit";
import { logError } from '../lib/logger';

const router = Router();

/**
 * Authenticate via Telegram Mini App
 *
 * Validates initData from Telegram WebApp and creates/returns user session
 * Uses shared validation service to prevent code duplication
 */
router.post("/webapp-auth", authRateLimiter, async (req, res) => {
  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ message: "initData is required" });
    }

    // Validate initData signature and freshness (prevents replay attacks)
    const botToken = TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ message: "Telegram bot token not configured" });
    }

    const validationResult = validateInitData(initData, botToken);
    
    if (!validationResult.isValid) {
      return res.status(401).json({ 
        message: validationResult.error || "Invalid initData" 
      });
    }

    const telegramUser = validationResult.user!;
    const telegramId = telegramUser.id.toString();

    // Find user by telegram_id
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (user) {
      // SCENARIO 1: User found with telegram_id
      // Check if user has email and password (required for login)
      if (user.email && user.password) {
        // User has email+password → Auto-login
        req.login(user, (err) => {
          if (err) {
            logError("Error creating session:", err);
            return res.status(500).json({ message: "Failed to create session" });
          }

          return res.json({
            success: true,
            autoLogin: true,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              telegramId: user.telegramId,
              telegramUsername: user.telegramUsername,
            },
          });
        });
      } else {
        // User exists but missing email/password → Requires email
        return res.json({
          success: false,
          requiresEmail: true,
          telegramId, // Return telegramId for the form
          message: 'Please add email and password to your account',
        });
      }
    } else {
      // SCENARIO 2: User not found → Requires registration
      // Don't create user automatically - require email/password registration
      return res.json({
        success: false,
        requiresRegistration: true,
        telegramId,
        telegramData: {
          firstName: telegramUser.first_name || null,
          username: telegramUser.username || null,
          photoUrl: telegramUser.photo_url || null,
        },
      });
    }
  } catch (error) {
    logError("Error in webapp-auth:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
});

router.post("/generate-code", withAuth(async (req, res) => {
  const userId = req.user!.id;

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + VERIFICATION_CODE_TTL_MINUTES);

    await db
      .update(telegramVerificationCodes)
      .set({ isUsed: true })
      .where(
        and(
          eq(telegramVerificationCodes.userId, userId),
          eq(telegramVerificationCodes.isUsed, false)
        )
      );

    const [verificationCode] = await db
      .insert(telegramVerificationCodes)
      .values({
        userId,
        code,
        expiresAt,
        isUsed: false,
      })
      .returning();

    res.json({
      code: verificationCode.code,
      expiresAt: verificationCode.expiresAt,
      ttlMinutes: VERIFICATION_CODE_TTL_MINUTES,
    });
  } catch (error) {
    logError("Error generating verification code:", error);
    res.status(500).json({ message: "Failed to generate verification code" });
  }
}));

router.post("/disconnect", withAuth(async (req, res) => {
  const userId = req.user!.id;

  try {
    await db
      .update(users)
      .set({
        telegramId: null,
        telegramUsername: null,
      })
      .where(eq(users.id, userId));

    await db
      .update(telegramVerificationCodes)
      .set({ isUsed: true })
      .where(eq(telegramVerificationCodes.userId, userId));

    res.json({ message: "Telegram disconnected successfully" });
  } catch (error) {
    logError("Error disconnecting Telegram:", error);
    res.status(500).json({ message: "Failed to disconnect Telegram" });
  }
}));

router.get("/status", withAuth(async (req, res) => {
  const userId = req.user!.id;

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    res.json({
      connected: !!user.telegramId,
      username: user.telegramUsername || null,
    });
  } catch (error) {
    logError("Error fetching Telegram status:", error);
    res.status(500).json({ message: "Failed to fetch Telegram status" });
  }
}));

export default router;

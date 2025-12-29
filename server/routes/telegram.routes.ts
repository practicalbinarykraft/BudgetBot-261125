import { Router } from "express";
import { db } from "../db";
import { users, telegramVerificationCodes } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { withAuth } from "../middleware/auth-utils";
import { VERIFICATION_CODE_TTL_MINUTES } from "../telegram/config";
import crypto from "crypto";
import { TELEGRAM_BOT_TOKEN } from "../telegram/config";

const router = Router();

/**
 * Authenticate via Telegram Mini App
 *
 * Validates initData from Telegram WebApp and creates/returns user session
 */
router.post("/webapp-auth", async (req, res) => {
  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ message: "initData is required" });
    }

    // Validate Telegram initData signature
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    // Sort params alphabetically
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create secret key from bot token
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(TELEGRAM_BOT_TOKEN)
      .digest();

    // Calculate expected hash
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Verify hash
    if (hash !== expectedHash) {
      return res.status(401).json({ message: "Invalid initData signature" });
    }

    // Parse user data
    const userJson = urlParams.get('user');
    if (!userJson) {
      return res.status(400).json({ message: "User data not found in initData" });
    }

    const telegramUser = JSON.parse(userJson);
    const telegramId = telegramUser.id?.toString();

    if (!telegramId) {
      return res.status(400).json({ message: "Telegram user ID not found" });
    }

    // Find or create user
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (!user) {
      // Create new user from Telegram data
      const username = telegramUser.username || `user_${telegramId}`;
      const email = `${telegramId}@telegram.user`; // Temporary email

      [user] = await db
        .insert(users)
        .values({
          email,
          username,
          password: '', // No password for Telegram users
          telegramId,
          telegramUsername: telegramUser.username || null,
          firstName: telegramUser.first_name || null,
          lastName: telegramUser.last_name || null,
          defaultCurrency: 'USD',
          preferredLanguage: telegramUser.language_code || 'en',
        })
        .returning();
    }

    // Create session (using passport.js login)
    req.login(user, (err) => {
      if (err) {
        console.error("Error creating session:", err);
        return res.status(500).json({ message: "Failed to create session" });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          telegramId: user.telegramId,
        },
      });
    });
  } catch (error) {
    console.error("Error in webapp-auth:", error);
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
    console.error("Error generating verification code:", error);
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
    console.error("Error disconnecting Telegram:", error);
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
    console.error("Error fetching Telegram status:", error);
    res.status(500).json({ message: "Failed to fetch Telegram status" });
  }
}));

export default router;

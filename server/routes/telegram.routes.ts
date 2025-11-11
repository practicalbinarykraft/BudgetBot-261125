import { Router } from "express";
import { db } from "../db";
import { users, telegramVerificationCodes } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { withAuth } from "../middleware/auth-utils";
import { VERIFICATION_CODE_TTL_MINUTES } from "../telegram/config";

const router = Router();

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

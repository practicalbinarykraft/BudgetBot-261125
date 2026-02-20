import { Router } from "express";
import { withAuth } from "../middleware/auth-utils";
import { withMobileAuth } from "../middleware/mobile-auth";
import { ensureReferralCode } from "../services/referral.service";
import { getUserByReferralCode, getReferralStats, getInvitedUsers } from "../repositories/referral.repository";
import { logError } from "../lib/logger";

const router = Router();

/**
 * GET /api/referral/my-code
 * Get (or generate) the authenticated user's referral code.
 */
router.get("/my-code", withAuth(async (req, res) => {
  try {
    const userId = req.user!.id;
    const code = await ensureReferralCode(userId);
    res.json({ code, link: `https://budgetbot.online/r/${code}` });
  } catch (error) {
    logError("Error getting referral code", error as Error);
    res.status(500).json({ error: "Failed to get referral code" });
  }
}));

/**
 * GET /api/referral/stats
 * Get referral stats for the authenticated user.
 */
router.get("/stats", withAuth(async (req, res) => {
  try {
    const userId = req.user!.id;
    const stats = await getReferralStats(userId);
    res.json(stats);
  } catch (error) {
    logError("Error getting referral stats", error as Error);
    res.status(500).json({ error: "Failed to get referral stats" });
  }
}));

/**
 * GET /api/referral/invited
 * Get list of invited users for the authenticated user.
 */
router.get("/invited", withAuth(async (req, res) => {
  try {
    const userId = req.user!.id;
    const invited = await getInvitedUsers(userId);
    res.json(invited);
  } catch (error) {
    logError("Error getting invited users", error as Error);
    res.status(500).json({ error: "Failed to get invited users" });
  }
}));

/**
 * GET /api/referral/validate/:code
 * Validate a referral code (public, no auth required).
 */
router.get("/validate/:code", async (req, res) => {
  try {
    const { code } = req.params;
    if (!code || code.length !== 8) {
      return res.status(400).json({ valid: false });
    }

    const user = await getUserByReferralCode(code);
    res.json({ valid: !!user, name: user?.name ?? null });
  } catch (error) {
    logError("Error validating referral code", error as Error);
    res.status(500).json({ valid: false });
  }
});

/**
 * Mobile endpoints (JWT auth)
 */
router.get("/mobile/my-code", withMobileAuth(async (req, res) => {
  try {
    const userId = req.user.id;
    const code = await ensureReferralCode(userId);
    res.json({ code, link: `https://budgetbot.online/r/${code}` });
  } catch (error) {
    logError("Error getting mobile referral code", error as Error);
    res.status(500).json({ error: "Failed to get referral code" });
  }
}));

router.get("/mobile/stats", withMobileAuth(async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await getReferralStats(userId);
    res.json(stats);
  } catch (error) {
    logError("Error getting mobile referral stats", error as Error);
    res.status(500).json({ error: "Failed to get referral stats" });
  }
}));

router.get("/mobile/invited", withMobileAuth(async (req, res) => {
  try {
    const userId = req.user.id;
    const invited = await getInvitedUsers(userId);
    res.json(invited);
  } catch (error) {
    logError("Error getting mobile invited users", error as Error);
    res.status(500).json({ error: "Failed to get invited users" });
  }
}));

export default router;

import { Router } from "express";
import { getUserByReferralCode } from "../repositories/referral.repository";

const router = Router();

/**
 * GET /r/:code
 * Set referral cookie and redirect to login page with ref param.
 */
router.get("/:code", async (req, res) => {
  const { code } = req.params;

  // Validate code format
  if (!code || code.length !== 8) {
    return res.redirect("/login");
  }

  // Validate code exists
  const referrer = await getUserByReferralCode(code);
  if (!referrer) {
    return res.redirect("/login");
  }

  // Set cookie for 30 days (survives if user doesn't register immediately)
  res.cookie("ref", code.toUpperCase(), {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
  });

  return res.redirect(`/login?ref=${code.toUpperCase()}`);
});

export default router;

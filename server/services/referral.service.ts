import { db } from "../db";
import { users, rewardEvents, userCredits, creditTransactions, tutorialSteps } from "@shared/schema";
import { eq, sql, count } from "drizzle-orm";
import { generateReferralCode } from "../lib/referral-code";
import { getRewardValue } from "../repositories/reward-settings.repository";
import { logInfo, logError } from "../lib/logger";

/**
 * Grant signup reward to both referrer and referred user.
 * Idempotent: uses unique constraint on (userId, type, relatedUserId).
 */
export async function grantSignupReward(referrerId: number, referredId: number): Promise<void> {
  const referrerReward = await getRewardValue("referral_signup_referrer");
  const referredReward = await getRewardValue("referral_signup_referred");

  // Grant to referrer
  await grantReward(referrerId, "referral_signup", referrerReward, referredId, "Referral signup bonus");

  // Grant to referred user
  await grantReward(referredId, "referral_signup_bonus", referredReward, referrerId, "Welcome referral bonus");

  logInfo("Referral signup reward granted", { referrerId, referredId, referrerReward, referredReward });
}

/**
 * Grant onboarding reward to referrer when referred user completes all tutorial steps.
 * Called fire-and-forget after tutorial step completion.
 */
export async function grantOnboardingReward(referredUserId: number): Promise<void> {
  // Look up who referred this user
  const [user] = await db
    .select({ referredBy: users.referredBy })
    .from(users)
    .where(eq(users.id, referredUserId))
    .limit(1);

  if (!user?.referredBy) return;

  // Check if user completed all 8 tutorial steps
  const [stepsResult] = await db
    .select({ count: count() })
    .from(tutorialSteps)
    .where(eq(tutorialSteps.userId, referredUserId));

  if ((stepsResult?.count ?? 0) < 8) return;

  const reward = await getRewardValue("referral_onboarding_referrer");
  await grantReward(user.referredBy, "referral_onboarding", reward, referredUserId, "Referral onboarding bonus");

  logInfo("Referral onboarding reward granted", { referrerId: user.referredBy, referredUserId, reward });
}

/**
 * Ensure user has a referral code. Generate one if missing.
 * Retries up to 3 times on unique constraint violation.
 */
export async function ensureReferralCode(userId: number): Promise<string> {
  // Check existing
  const [user] = await db
    .select({ referralCode: users.referralCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.referralCode) return user.referralCode;

  // Generate with retry
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const code = generateReferralCode();
      const [updated] = await db
        .update(users)
        .set({ referralCode: code })
        .where(eq(users.id, userId))
        .returning({ referralCode: users.referralCode });

      if (updated?.referralCode) return updated.referralCode;
    } catch (err: any) {
      if (err.code === "23505" && attempt < 2) continue; // unique violation
      throw err;
    }
  }

  throw new Error("Failed to generate unique referral code after 3 attempts");
}

/**
 * Core reward granting logic (used by both signup and onboarding).
 * Idempotent: ON CONFLICT DO NOTHING on unique constraint.
 */
async function grantReward(
  userId: number,
  type: string,
  credits: number,
  relatedUserId: number,
  description: string
): Promise<boolean> {
  if (credits <= 0) return false;

  return await db.transaction(async (tx) => {
    // Insert reward event — idempotent
    const [inserted] = await tx
      .insert(rewardEvents)
      .values({ userId, type, creditsAwarded: credits, relatedUserId })
      .onConflictDoNothing()
      .returning();

    if (!inserted) return false; // Already granted

    // Grant credits
    const [existing] = await tx
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .for("update")
      .limit(1);

    if (existing) {
      await tx
        .update(userCredits)
        .set({
          messagesRemaining: existing.messagesRemaining + credits,
          totalGranted: existing.totalGranted + credits,
          updatedAt: sql`NOW()`,
        })
        .where(eq(userCredits.userId, userId));

      await tx.insert(creditTransactions).values({
        userId,
        type: "referral_reward",
        messagesChange: credits,
        balanceBefore: existing.messagesRemaining,
        balanceAfter: existing.messagesRemaining + credits,
        description,
        metadata: { source: "referral", rewardType: type, relatedUserId },
      });
    } else {
      const initialCredits = 50;
      await tx.insert(userCredits).values({
        userId,
        messagesRemaining: initialCredits + credits,
        totalGranted: initialCredits + credits,
        totalUsed: 0,
      });

      await tx.insert(creditTransactions).values({
        userId,
        type: "referral_reward",
        messagesChange: credits,
        balanceBefore: initialCredits,
        balanceAfter: initialCredits + credits,
        description,
        metadata: { source: "referral", rewardType: type, relatedUserId },
      });
    }

    return true;
  });
}

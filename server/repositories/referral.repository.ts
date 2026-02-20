import { db } from "../db";
import { users, rewardEvents } from "@shared/schema";
import { eq, and, sql, count, sum } from "drizzle-orm";

/**
 * Look up a user by referral code.
 */
export async function getUserByReferralCode(code: string) {
  const [user] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.referralCode, code.toUpperCase()))
    .limit(1);

  return user ?? null;
}

/**
 * Get referral stats for a user (total invited, total credits earned).
 */
export async function getReferralStats(userId: number) {
  const [invitedResult] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.referredBy, userId));

  const [creditsResult] = await db
    .select({ total: sum(rewardEvents.creditsAwarded) })
    .from(rewardEvents)
    .where(
      and(
        eq(rewardEvents.userId, userId),
        sql`${rewardEvents.type} LIKE 'referral_%'`
      )
    );

  return {
    invitedCount: invitedResult?.count ?? 0,
    creditsEarned: Number(creditsResult?.total ?? 0),
  };
}

/**
 * Get list of users invited by a referrer.
 * Returns name initial + last name initial, date, credits, status.
 */
export async function getInvitedUsers(referrerId: number) {
  const invited = await db
    .select({
      id: users.id,
      name: users.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.referredBy, referrerId))
    .orderBy(sql`${users.createdAt} DESC`);

  // For each invited user, check reward status
  const result = [];
  for (const user of invited) {
    const rewards = await db
      .select({ type: rewardEvents.type, creditsAwarded: rewardEvents.creditsAwarded })
      .from(rewardEvents)
      .where(
        and(
          eq(rewardEvents.userId, referrerId),
          eq(rewardEvents.relatedUserId, user.id)
        )
      );

    const signupReward = rewards.find((r) => r.type === "referral_signup");
    const onboardingReward = rewards.find((r) => r.type === "referral_onboarding");

    result.push({
      id: user.id,
      name: formatNameInitials(user.name),
      createdAt: user.createdAt.toISOString(),
      signupCredits: signupReward?.creditsAwarded ?? 0,
      onboardingCompleted: !!onboardingReward,
      onboardingCredits: onboardingReward?.creditsAwarded ?? 0,
    });
  }

  return result;
}

/**
 * Format name as "Имя Ф." for privacy.
 */
function formatNameInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

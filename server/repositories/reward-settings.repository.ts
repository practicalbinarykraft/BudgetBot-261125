import { db } from "../db";
import { rewardSettings } from "@shared/schema";
import { eq } from "drizzle-orm";

const DEFAULTS: Record<string, number> = {
  referral_signup_referrer: 50,
  referral_signup_referred: 50,
  referral_onboarding_referrer: 50,
};

/**
 * Get a reward setting value by key, with fallback to defaults.
 */
export async function getRewardValue(key: string): Promise<number> {
  const [row] = await db
    .select({ value: rewardSettings.value })
    .from(rewardSettings)
    .where(eq(rewardSettings.key, key))
    .limit(1);

  if (row) return row.value;
  return DEFAULTS[key] ?? 0;
}

/**
 * Get all reward settings.
 */
export async function getAllRewardSettings() {
  return db.select().from(rewardSettings);
}

/**
 * Update a reward setting value by key.
 */
export async function updateRewardSetting(key: string, value: number) {
  const [updated] = await db
    .update(rewardSettings)
    .set({ value, updatedAt: new Date() })
    .where(eq(rewardSettings.key, key))
    .returning();

  return updated ?? null;
}

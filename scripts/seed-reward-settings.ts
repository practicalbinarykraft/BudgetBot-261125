/**
 * Seed reward_settings table with default values.
 *
 * Usage: npx tsx scripts/seed-reward-settings.ts
 */

import { db } from "../server/db";
import { rewardSettings } from "@shared/schema";

const DEFAULTS = [
  { key: "referral_signup_referrer", value: 50, description: "Credits for referrer when friend signs up" },
  { key: "referral_signup_referred", value: 50, description: "Credits for referred user on signup" },
  { key: "referral_onboarding_referrer", value: 50, description: "Credits for referrer when friend completes onboarding" },
];

async function main() {
  for (const row of DEFAULTS) {
    await db
      .insert(rewardSettings)
      .values(row)
      .onConflictDoNothing({ target: rewardSettings.key });
  }
  console.log("Seeded reward_settings:", DEFAULTS.length, "rows");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

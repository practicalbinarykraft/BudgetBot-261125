/**
 * Backfill referral codes for existing users that don't have one.
 *
 * Usage: npx tsx scripts/backfill-referral-codes.ts
 */

import { db } from "../server/db";
import { users } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";
import { generateReferralCode } from "../server/lib/referral-code";

async function main() {
  const usersWithoutCode = await db
    .select({ id: users.id })
    .from(users)
    .where(isNull(users.referralCode));

  console.log(`Found ${usersWithoutCode.length} users without referral code`);

  let updated = 0;
  for (const user of usersWithoutCode) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const code = generateReferralCode();
        await db
          .update(users)
          .set({ referralCode: code })
          .where(and(eq(users.id, user.id), isNull(users.referralCode)));
        updated++;
        break;
      } catch (err: any) {
        if (err.code === "23505" && attempt < 2) continue; // unique violation, retry
        throw err;
      }
    }
  }

  console.log(`Updated ${updated} users with referral codes`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});

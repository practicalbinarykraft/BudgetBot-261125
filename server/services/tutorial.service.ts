import { db } from "../db";
import { tutorialSteps, userCredits, creditTransactions } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { logError } from "../lib/logger";

const STEP_REWARDS: Record<string, number> = {
  create_wallet: 10,
  add_transaction: 5,
  voice_input: 15,
  receipt_scan: 10,
  planned_income: 5,
  planned_expense: 5,
  view_chart: 3,
  view_transactions: 2,
};

const TOTAL_STEPS = Object.keys(STEP_REWARDS).length;

export interface CompleteStepResult {
  alreadyCompleted: boolean;
  creditsAwarded: number;
}

export interface TutorialProgress {
  steps: Array<{ stepId: string; completedAt: string }>;
  totalCreditsEarned: number;
  totalSteps: number;
  completedSteps: number;
}

/**
 * Complete a tutorial step for a user.
 * Idempotent: completing the same step twice returns alreadyCompleted=true.
 * Credits are granted atomically inside a transaction.
 */
export async function completeStep(userId: number, stepId: string): Promise<CompleteStepResult> {
  const reward = STEP_REWARDS[stepId];
  if (reward === undefined) {
    throw new Error(`Invalid tutorial step: ${stepId}`);
  }

  return await db.transaction(async (tx) => {
    // INSERT ... ON CONFLICT DO NOTHING RETURNING *
    const [inserted] = await tx
      .insert(tutorialSteps)
      .values({
        userId,
        stepId,
        creditsAwarded: reward,
      })
      .onConflictDoNothing({ target: [tutorialSteps.userId, tutorialSteps.stepId] })
      .returning();

    if (!inserted) {
      // Already completed — no double-grant
      return { alreadyCompleted: true, creditsAwarded: 0 };
    }

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
          messagesRemaining: existing.messagesRemaining + reward,
          totalGranted: existing.totalGranted + reward,
          updatedAt: sql`NOW()`,
        })
        .where(eq(userCredits.userId, userId));

      await tx.insert(creditTransactions).values({
        userId,
        type: "tutorial_reward",
        messagesChange: reward,
        balanceBefore: existing.messagesRemaining,
        balanceAfter: existing.messagesRemaining + reward,
        description: `Tutorial step: ${stepId}`,
        metadata: { source: "tutorial", stepId },
      });
    } else {
      // No credits record yet — create one with reward on top of welcome bonus
      const initialCredits = 50;
      await tx.insert(userCredits).values({
        userId,
        messagesRemaining: initialCredits + reward,
        totalGranted: initialCredits + reward,
        totalUsed: 0,
      });

      await tx.insert(creditTransactions).values({
        userId,
        type: "tutorial_reward",
        messagesChange: reward,
        balanceBefore: initialCredits,
        balanceAfter: initialCredits + reward,
        description: `Tutorial step: ${stepId}`,
        metadata: { source: "tutorial", stepId },
      });
    }

    // Fire-and-forget: check if referral onboarding reward should be granted
    try {
      const { grantOnboardingReward } = await import("./referral.service");
      grantOnboardingReward(userId).catch((err) =>
        logError("Failed to grant onboarding reward", err as Error, { userId })
      );
    } catch (err) {
      logError("Failed to import referral service", err as Error);
    }

    return { alreadyCompleted: false, creditsAwarded: reward };
  });
}

/**
 * Get tutorial progress for a user.
 */
export async function getProgress(userId: number): Promise<TutorialProgress> {
  const rows = await db
    .select({
      stepId: tutorialSteps.stepId,
      completedAt: tutorialSteps.completedAt,
      creditsAwarded: tutorialSteps.creditsAwarded,
    })
    .from(tutorialSteps)
    .where(eq(tutorialSteps.userId, userId));

  const totalCreditsEarned = rows.reduce((sum, r) => sum + r.creditsAwarded, 0);

  return {
    steps: rows.map((r) => ({
      stepId: r.stepId,
      completedAt: r.completedAt.toISOString(),
    })),
    totalCreditsEarned,
    totalSteps: TOTAL_STEPS,
    completedSteps: rows.length,
  };
}

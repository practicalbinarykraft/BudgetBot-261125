/**
 * Billing Service
 *
 * Handles credit charging, usage tracking, and cost calculation
 */

import { db } from '../db';
import { userCredits, aiUsageLog, creditTransactions } from '@shared/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import {
  AIProvider,
  AIOperation,
  TokenUsage,
  CreditCost,
  AI_PRICING,
  SPECIAL_PRICING,
  OPERATION_CREDIT_COSTS,
  BillingError,
} from '../types/billing';

const MONTHLY_RESET_DAYS = 30;

/**
 * Calculate credit cost for an AI operation
 *
 * @param operation - Type of AI operation
 * @param provider - AI provider used
 * @param tokens - Token usage {input, output}
 * @returns Credit cost (1 credit = ~$0.01)
 */
export function calculateCreditCost(
  operation: AIOperation,
  provider: AIProvider,
  tokens: TokenUsage
): CreditCost {

  // Special case: voice transcription uses per-minute pricing
  if (operation === 'voice_transcription') {
    const durationMinutes = tokens.input / 600; // Approximation
    const costUSD = durationMinutes * SPECIAL_PRICING.voice_transcription_per_minute;
    const credits = Math.ceil(costUSD / 0.01);

    return {
      operation,
      provider,
      tokens,
      credits: Math.max(credits, 1),
      costUSD,
    };
  }

  // Standard token-based pricing
  const pricing = AI_PRICING[provider];

  const costUSD =
    (tokens.input / 1_000_000 * pricing.input) +
    (tokens.output / 1_000_000 * pricing.output);

  // Convert to credits: $0.01 = 1 credit
  // Apply 2x margin for business sustainability
  const credits = Math.ceil((costUSD * 2) / 0.01);

  return {
    operation,
    provider,
    tokens,
    credits: Math.max(credits, 1), // Minimum 1 credit
    costUSD,
  };
}

/**
 * Estimate credit cost for operation (for display purposes)
 * Uses average token counts
 */
export function estimateCreditCost(operation: AIOperation): number {
  return OPERATION_CREDIT_COSTS[operation] || 1;
}

export interface ChargeParams {
  userId: number;
  cost: number;
  operation: string;
  provider: string;
  tokens: { input: number; output: number };
}

export interface ChargeResult {
  success: boolean;
  balanceAfter: number;
  error?: 'INSUFFICIENT_CREDITS';
}

/**
 * Atomic credit deduction with lazy monthly reset.
 *
 * Single transaction:
 * 1. SELECT FOR UPDATE (row lock)
 * 2. Lazy monthly reset (if lastResetAt > 30 days or null)
 * 3. UPDATE ... WHERE messages_remaining >= cost (guard)
 * 4. INSERT credit_transactions + ai_usage_log
 *
 * Returns { success: false, error: 'INSUFFICIENT_CREDITS' } instead of throwing.
 */
export async function chargeCreditsAtomic(params: ChargeParams): Promise<ChargeResult> {
  const { userId, cost, operation, provider, tokens } = params;

  return db.transaction(async (tx) => {
    // 1. Lock the row
    const [row] = await tx
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .for('update')
      .limit(1);

    if (!row) {
      return { success: false, balanceAfter: 0, error: 'INSUFFICIENT_CREDITS' as const };
    }

    // 2. Lazy monthly reset
    let currentBalance = row.messagesRemaining;
    const needsReset = !row.lastResetAt ||
      (Date.now() - new Date(row.lastResetAt).getTime()) >= MONTHLY_RESET_DAYS * 24 * 60 * 60 * 1000;

    if (needsReset) {
      currentBalance = row.monthlyAllowance;
      await tx
        .update(userCredits)
        .set({
          messagesRemaining: currentBalance,
          lastResetAt: sql`NOW()`,
          updatedAt: sql`NOW()`,
        })
        .where(eq(userCredits.userId, userId));
    }

    // 3. Check balance AFTER potential reset
    if (currentBalance < cost) {
      return { success: false, balanceAfter: currentBalance, error: 'INSUFFICIENT_CREDITS' as const };
    }

    // 4. Atomic deduct with WHERE guard
    const [updated] = await tx
      .update(userCredits)
      .set({
        messagesRemaining: sql`messages_remaining - ${cost}`,
        totalUsed: sql`total_used + ${cost}`,
        updatedAt: sql`NOW()`,
      })
      .where(and(
        eq(userCredits.userId, userId),
        gte(userCredits.messagesRemaining, cost),
      ))
      .returning();

    if (!updated) {
      return { success: false, balanceAfter: currentBalance, error: 'INSUFFICIENT_CREDITS' as const };
    }

    const balanceAfter = updated.messagesRemaining;

    // 5. Audit trail
    await tx.insert(creditTransactions).values({
      userId,
      type: 'usage',
      messagesChange: -cost,
      balanceBefore: currentBalance,
      balanceAfter,
      description: `${operation} via ${provider}`,
      metadata: {
        operation,
        provider,
        inputTokens: tokens.input,
        outputTokens: tokens.output,
      },
    });

    await tx.insert(aiUsageLog).values({
      userId,
      model: `${provider}:${operation}`,
      inputTokens: tokens.input,
      outputTokens: tokens.output,
      messageCount: cost,
      wasFree: false,
    });

    return { success: true, balanceAfter };
  });
}

/**
 * Legacy wrapper — calls chargeCreditsAtomic and throws BillingError on failure.
 * Used by existing callers (voice-parse, receipts, analyze, chat).
 */
export async function chargeCredits(
  userId: number,
  operation: AIOperation,
  provider: AIProvider,
  tokens: TokenUsage,
  _wasFree: boolean = false
): Promise<void> {
  const cost = calculateCreditCost(operation, provider, tokens);

  const result = await chargeCreditsAtomic({
    userId,
    cost: cost.credits,
    operation,
    provider,
    tokens,
  });

  if (!result.success) {
    throw new BillingError(
      'Insufficient credits. Your monthly allowance resets every 30 days.',
      'INSUFFICIENT_CREDITS',
      userId,
    );
  }
}

/**
 * Add credits to user (after purchase or grant)
 *
 * @param userId - User ID
 * @param credits - Number of credits to add
 * @param reason - Reason for credit grant
 */
export async function grantCredits(
  userId: number,
  credits: number,
  reason: string = 'purchase'
): Promise<void> {

  // Grant credits (purchase or admin)

  await db
    .update(userCredits)
    .set({
      messagesRemaining: sql`messages_remaining + ${credits}`,
      totalGranted: sql`total_granted + ${credits}`,
    })
    .where(eq(userCredits.userId, userId));
}

/**
 * Get user's credit balance
 */
export async function getCredits(userId: number): Promise<{
  remaining: number;
  granted: number;
  used: number;
}> {
  const result = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .limit(1);

  if (result.length === 0) {
    return { remaining: 0, granted: 0, used: 0 };
  }

  return {
    remaining: result[0].messagesRemaining,
    granted: result[0].totalGranted,
    used: result[0].totalUsed,
  };
}

/**
 * Get user's usage statistics
 */
export async function getUsageStats(userId: number): Promise<{
  totalOperations: number;
  totalCost: number;
  breakdown: Record<string, { count: number; credits: number }>;
}> {
  const logs = await db
    .select()
    .from(aiUsageLog)
    .where(eq(aiUsageLog.userId, userId));

  const breakdown: Record<string, { count: number; credits: number }> = {};
  let totalCredits = 0;

  for (const log of logs) {
    const model = log.model || 'unknown';
    if (!breakdown[model]) {
      breakdown[model] = { count: 0, credits: 0 };
    }
    breakdown[model].count++;
    breakdown[model].credits += log.messageCount;
    totalCredits += log.messageCount;
  }

  return {
    totalOperations: logs.length,
    totalCost: totalCredits * 0.01, // Credits to USD
    breakdown,
  };
}

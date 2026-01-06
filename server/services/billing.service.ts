/**
 * Billing Service
 *
 * Handles credit charging, usage tracking, and cost calculation
 */

import { db } from '../db';
import { userCredits, aiUsageLog } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import {
  AIProvider,
  AIOperation,
  TokenUsage,
  CreditCost,
  AI_PRICING,
  SPECIAL_PRICING,
  OPERATION_CREDIT_COSTS,
} from '../types/billing';

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

/**
 * Charge credits to user after AI operation
 *
 * @param userId - User ID
 * @param operation - Type of operation
 * @param provider - AI provider used
 * @param tokens - Token usage
 * @param wasFree - Whether this was from free tier
 */
export async function chargeCredits(
  userId: number,
  operation: AIOperation,
  provider: AIProvider,
  tokens: TokenUsage,
  wasFree: boolean = false
): Promise<void> {

  const cost = calculateCreditCost(operation, provider, tokens);

  console.log(
    `💳 [User ${userId}] Charging ${cost.credits} credits for ${operation} via ${provider} ` +
    `($${cost.costUSD.toFixed(4)} actual cost, ${tokens.input + tokens.output} tokens)`
  );

  // Deduct credits
  await db
    .update(userCredits)
    .set({
      messagesRemaining: sql`messages_remaining - ${cost.credits}`,
      totalUsed: sql`total_used + ${cost.credits}`,
    })
    .where(eq(userCredits.userId, userId));

  // Log usage for analytics
  await db.insert(aiUsageLog).values({
    userId,
    model: `${provider}:${operation}`,
    inputTokens: tokens.input,
    outputTokens: tokens.output,
    messageCount: cost.credits,
    wasFree,
  });

  // Check if user is running low on credits
  const updatedCredits = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .limit(1);

  if (updatedCredits[0]?.messagesRemaining <= 5 && updatedCredits[0]?.messagesRemaining > 0) {
    console.warn(`⚠️  [User ${userId}] Low credits: ${updatedCredits[0].messagesRemaining} remaining`);
    // TODO: Send notification to user
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

  console.log(`💰 [User ${userId}] Granting ${credits} credits (${reason})`);

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

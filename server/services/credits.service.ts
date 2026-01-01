import { db } from "../db";
import { userCredits, creditTransactions, aiUsageLog } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";

/**
 * AI Credits Service
 * Manages free message quota (50 messages per user)
 */

const FREE_MESSAGES_INITIAL = 50;

export interface CreditBalance {
  messagesRemaining: number;
  totalGranted: number;
  totalUsed: number;
}

export interface UsageLogEntry {
  model: string;
  inputTokens: number;
  outputTokens: number;
  messageCount?: number;
}

/**
 * Grant initial 50 free messages to new user
 * Called during registration
 */
export async function grantWelcomeBonus(userId: number): Promise<void> {
  // Check if user already has credits
  const existing = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    console.log(`User ${userId} already has credits, skipping welcome bonus`);
    return;
  }

  // Create credits record
  await db.insert(userCredits).values({
    userId,
    messagesRemaining: FREE_MESSAGES_INITIAL,
    totalGranted: FREE_MESSAGES_INITIAL,
    totalUsed: 0
  });

  // Log transaction
  await db.insert(creditTransactions).values({
    userId,
    type: "welcome_bonus",
    messagesChange: FREE_MESSAGES_INITIAL,
    balanceBefore: 0,
    balanceAfter: FREE_MESSAGES_INITIAL,
    description: "Welcome bonus - 50 free AI messages",
    metadata: { source: "registration", autoGranted: true }
  });

  console.log(`Granted ${FREE_MESSAGES_INITIAL} welcome messages to user ${userId}`);
}

/**
 * Get user's credit balance
 */
export async function getCreditBalance(userId: number): Promise<CreditBalance> {
  const credits = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .limit(1);

  if (credits.length === 0) {
    // Auto-grant welcome bonus if user doesn't have credits yet
    await grantWelcomeBonus(userId);

    return {
      messagesRemaining: FREE_MESSAGES_INITIAL,
      totalGranted: FREE_MESSAGES_INITIAL,
      totalUsed: 0
    };
  }

  const record = credits[0];
  return {
    messagesRemaining: record.messagesRemaining,
    totalGranted: record.totalGranted,
    totalUsed: record.totalUsed
  };
}

/**
 * Check if user has enough messages remaining
 * Throws error if insufficient credits
 */
export async function checkCreditsAvailable(userId: number): Promise<void> {
  const balance = await getCreditBalance(userId);

  if (balance.messagesRemaining <= 0) {
    throw new Error(
      "You've used all your free messages. " +
      "Upgrade to continue using AI chat!"
    );
  }
}

/**
 * Deduct one message from user's balance
 * Called after successful AI request
 */
export async function deductMessage(
  userId: number,
  usage: UsageLogEntry
): Promise<CreditBalance> {
  const messageCount = usage.messageCount || 1;

  // Get current balance
  const balance = await getCreditBalance(userId);

  if (balance.messagesRemaining < messageCount) {
    throw new Error("Insufficient messages remaining");
  }

  const balanceBefore = balance.messagesRemaining;
  const balanceAfter = balanceBefore - messageCount;

  // Update credits in a transaction
  await db.transaction(async (tx) => {
    // Deduct messages
    await tx
      .update(userCredits)
      .set({
        messagesRemaining: balanceAfter,
        totalUsed: balance.totalUsed + messageCount,
        updatedAt: sql`NOW()`
      })
      .where(eq(userCredits.userId, userId));

    // Log the usage
    await tx.insert(aiUsageLog).values({
      userId,
      model: usage.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      messageCount,
      wasFree: true
    });

    // Record transaction
    await tx.insert(creditTransactions).values({
      userId,
      type: "usage",
      messagesChange: -messageCount,
      balanceBefore,
      balanceAfter,
      description: `AI chat message (${usage.model})`,
      metadata: {
        model: usage.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens
      }
    });
  });

  console.log(
    `Deducted ${messageCount} message(s) from user ${userId}. ` +
    `Balance: ${balanceAfter}/${balance.totalGranted}`
  );

  return {
    messagesRemaining: balanceAfter,
    totalGranted: balance.totalGranted,
    totalUsed: balance.totalUsed + messageCount
  };
}

/**
 * Admin: Grant additional messages to user
 */
export async function grantMessages(
  userId: number,
  amount: number,
  reason: string = "Admin grant"
): Promise<void> {
  const balance = await getCreditBalance(userId);
  const balanceBefore = balance.messagesRemaining;
  const balanceAfter = balanceBefore + amount;

  await db.transaction(async (tx) => {
    await tx
      .update(userCredits)
      .set({
        messagesRemaining: balanceAfter,
        totalGranted: balance.totalGranted + amount,
        updatedAt: sql`NOW()`
      })
      .where(eq(userCredits.userId, userId));

    await tx.insert(creditTransactions).values({
      userId,
      type: "admin_grant",
      messagesChange: amount,
      balanceBefore,
      balanceAfter,
      description: reason,
      metadata: { source: "admin" }
    });
  });

  console.log(`Granted ${amount} messages to user ${userId}. New balance: ${balanceAfter}`);
}

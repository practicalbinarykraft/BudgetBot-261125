import { db } from "../db";
import { userCredits, creditTransactions, aiUsageLog } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";
import { logInfo, logError } from '../lib/logger';

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
    logInfo(`User ${userId} already has credits, skipping welcome bonus`);
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

  logInfo(`Granted ${FREE_MESSAGES_INITIAL} welcome messages to user ${userId}`);
}

/**
 * Get user's credit balance
 */
export async function getCreditBalance(userId: number): Promise<CreditBalance> {
  try {
    logInfo(`[getCreditBalance] Getting balance for user ${userId}`);
    const credits = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);

    logInfo(`[getCreditBalance] Query result: ${credits.length} records found`);

    if (credits.length === 0) {
      logInfo(`[getCreditBalance] No credits record found, granting welcome bonus`);
      // Auto-grant welcome bonus if user doesn't have credits yet
      await grantWelcomeBonus(userId);

      // Перезапрашиваем данные из БД после создания записи
      const [newCredits] = await db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userId))
        .limit(1);

      if (newCredits) {
        const result = {
          messagesRemaining: newCredits.messagesRemaining,
          totalGranted: newCredits.totalGranted,
          totalUsed: newCredits.totalUsed
        };
        logInfo(`[getCreditBalance] Returning welcome bonus from DB:`, result);
        return result;
      }

      // Fallback если что-то пошло не так
      const result = {
        messagesRemaining: FREE_MESSAGES_INITIAL,
        totalGranted: FREE_MESSAGES_INITIAL,
        totalUsed: 0
      };
      logInfo(`[getCreditBalance] Returning welcome bonus fallback:`, result);
      return result;
    }

    const record = credits[0];
    const result = {
      messagesRemaining: record.messagesRemaining,
      totalGranted: record.totalGranted,
      totalUsed: record.totalUsed
    };
    logInfo(`[getCreditBalance] Returning balance:`, result);
    return result;
  } catch (error) {
    logError(`[getCreditBalance] ERROR for user ${userId}:`, error);
    throw error;
  }
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
  const { chargeCreditsAtomic } = await import('./billing.service');

  const result = await chargeCreditsAtomic({
    userId,
    cost: messageCount,
    operation: 'ai_chat',
    provider: usage.model,
    tokens: { input: usage.inputTokens, output: usage.outputTokens },
  });

  if (!result.success) {
    throw new Error("Insufficient messages remaining");
  }

  const balance = await getCreditBalance(userId);
  return balance;
}

/**
 * Admin: Grant additional messages to user
 */
export async function grantMessages(
  userId: number,
  amount: number,
  reason: string = "Admin grant"
): Promise<void> {
  logInfo(`[grantMessages] Starting grant for user ${userId}, amount: ${amount}`);
  
  await db.transaction(async (tx) => {
    // Получаем текущий баланс внутри транзакции (с блокировкой для предотвращения race conditions)
    const [existing] = await tx
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .for('update') // Блокируем строку для обновления
      .limit(1);

    let balanceBefore: number;
    let balanceAfter: number;
    let newTotalGranted: number;
    let currentTotalUsed: number;

    if (existing) {
      // Запись существует - обновляем
      balanceBefore = existing.messagesRemaining;
      balanceAfter = balanceBefore + amount;
      newTotalGranted = existing.totalGranted + amount;
      currentTotalUsed = existing.totalUsed;
      
      logInfo(`[grantMessages] Updating existing record: before=${balanceBefore}, after=${balanceAfter}, totalGranted=${newTotalGranted}`);
      
      const [updated] = await tx
        .update(userCredits)
        .set({
          messagesRemaining: balanceAfter,
          totalGranted: newTotalGranted,
          updatedAt: sql`NOW()`
        })
        .where(eq(userCredits.userId, userId))
        .returning();
      
      if (!updated) {
        throw new Error(`Failed to update credits for user ${userId}`);
      }
      
      logInfo(`[grantMessages] Updated record: ${JSON.stringify(updated)}`);
    } else {
      // Записи нет - создаем новую
      // Если пользователь новый, даем welcome bonus + admin grant
      balanceBefore = 0;
      balanceAfter = FREE_MESSAGES_INITIAL + amount;
      newTotalGranted = FREE_MESSAGES_INITIAL + amount;
      currentTotalUsed = 0;
      
      logInfo(`[grantMessages] Creating new record: after=${balanceAfter}, totalGranted=${newTotalGranted}`);
      
      const [created] = await tx.insert(userCredits).values({
        userId,
        messagesRemaining: balanceAfter,
        totalGranted: newTotalGranted,
        totalUsed: currentTotalUsed,
        updatedAt: sql`NOW()`
      }).returning();
      
      if (!created) {
        throw new Error(`Failed to create credits record for user ${userId}`);
      }
      
      logInfo(`[grantMessages] Created record: ${JSON.stringify(created)}`);
    }

    // Логируем транзакцию
    await tx.insert(creditTransactions).values({
      userId,
      type: "admin_grant",
      messagesChange: amount,
      balanceBefore,
      balanceAfter,
      description: reason,
      metadata: { source: "admin" }
    });
    
    logInfo(`[grantMessages] Transaction logged: balanceBefore=${balanceBefore}, balanceAfter=${balanceAfter}`);
  });

  // Проверяем результат после транзакции
  const finalBalance = await getCreditBalance(userId);
  logInfo(`[grantMessages] Final balance after grant: ${JSON.stringify(finalBalance)}`);
  logInfo(`[grantMessages] Granted ${amount} messages to user ${userId}. New balance: ${finalBalance.messagesRemaining}`);
  
  if (finalBalance.messagesRemaining === 0 && amount > 0) {
    logError(`[grantMessages] WARNING: Credits were granted but balance is still 0! This indicates a problem.`);
  }
}

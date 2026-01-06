/**
 * API Key Manager Service
 *
 * Smart routing of AI API calls:
 * 1. Check if user has their own API key (BYOK)
 * 2. Check if user has credits
 * 3. Select optimal provider based on operation type
 * 4. Return appropriate API key
 */

import { settingsRepository } from '../repositories/settings.repository';
import { db } from '../db';
import { userCredits } from '@shared/schema';
import { eq } from 'drizzle-orm';
import {
  AIProvider,
  AIOperation,
  ApiKeyResult,
  BillingError,
  OPERATION_ROUTING,
} from '../types/billing';

/**
 * Get appropriate API key for an operation
 *
 * Flow:
 * 1. Check BYOK (user's own key)
 * 2. Check credits
 * 3. Use system key
 */
export async function getApiKey(
  userId: number,
  operation: AIOperation
): Promise<ApiKeyResult> {

  // 1. Check if user wants to use their own key (BYOK)
  const userKey = await checkUserOwnKey(userId, operation);
  if (userKey) {
    console.log(`🔑 [User ${userId}] Using BYOK for ${operation}`);
    return {
      provider: userKey.provider,
      key: userKey.key,
      billingMode: 'user',
      shouldCharge: false,
      userId,
    };
  }

  // 2. Check user credits
  const credits = await getUserCredits(userId);

  if (credits.messagesRemaining <= 0) {
    throw new BillingError(
      'No credits remaining. Purchase more at /app/settings/billing or add your own API key.',
      'INSUFFICIENT_CREDITS',
      userId
    );
  }

  // 3. Select optimal provider
  const provider = selectProvider(operation);
  const key = getSystemKey(provider);

  const isFree = credits.totalUsed === 0 && credits.messagesRemaining === 25;

  console.log(`🔑 [User ${userId}] Using ${provider} for ${operation} (${isFree ? 'FREE' : 'PAID'} tier, ${credits.messagesRemaining} credits left)`);

  return {
    provider,
    key,
    billingMode: isFree ? 'free' : 'system',
    shouldCharge: true,
    userId,
  };
}

/**
 * Check if user has their own API key for this operation
 */
async function checkUserOwnKey(
  userId: number,
  operation: AIOperation
): Promise<{ provider: AIProvider; key: string } | null> {

  // Determine which key we need
  const requiredProvider = OPERATION_ROUTING[operation];

  switch (requiredProvider) {
    case 'anthropic': {
      const key = await settingsRepository.getAnthropicApiKey(userId);
      if (key) return { provider: 'anthropic', key };
      break;
    }

    case 'openai': {
      const key = await settingsRepository.getOpenAiApiKey(userId);
      if (key) return { provider: 'openai', key };
      break;
    }

    // OpenRouter and DeepSeek not supported for BYOK yet
    case 'openrouter':
    case 'deepseek':
      break;
  }

  return null;
}

/**
 * Get user's credit balance
 */
async function getUserCredits(userId: number): Promise<{
  messagesRemaining: number;
  totalGranted: number;
  totalUsed: number;
}> {
  const result = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .limit(1);

  // If no credits record, create one with free tier
  if (result.length === 0) {
    await db.insert(userCredits).values({
      userId,
      messagesRemaining: 25,
      totalGranted: 25,
      totalUsed: 0,
    });

    return {
      messagesRemaining: 25,
      totalGranted: 25,
      totalUsed: 0,
    };
  }

  return result[0];
}

/**
 * Select optimal AI provider for operation
 */
function selectProvider(operation: AIOperation): AIProvider {
  return OPERATION_ROUTING[operation];
}

/**
 * Get system API key for provider
 */
function getSystemKey(provider: AIProvider): string {
  const keys: Record<AIProvider, string | undefined> = {
    anthropic: process.env.SYSTEM_ANTHROPIC_API_KEY,
    openai: process.env.SYSTEM_OPENAI_API_KEY,
    openrouter: process.env.SYSTEM_OPENROUTER_API_KEY,
    deepseek: process.env.SYSTEM_DEEPSEEK_API_KEY,
  };

  const key = keys[provider];

  if (!key) {
    throw new Error(
      `System API key not configured for ${provider}. ` +
      `Set SYSTEM_${provider.toUpperCase()}_API_KEY in environment.`
    );
  }

  return key;
}

/**
 * Check if billing is enabled
 */
export function isBillingEnabled(): boolean {
  return process.env.BILLING_ENABLED === 'true';
}

/**
 * Get free tier credits amount
 */
export function getFreeTierCredits(): number {
  return parseInt(process.env.FREE_TIER_CREDITS || '25');
}

/**
 * Credits API Routes
 * Endpoints for managing user credits and billing information
 */

import { Router } from 'express';
import { db } from '../db';
import { userCredits, settings, aiUsageLog } from '@shared/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { withAuth } from '../middleware/auth-utils';

const router = Router();

/**
 * GET /api/credits
 * Get current user's credit balance and billing mode
 */
router.get('/', withAuth(async (req, res) => {
  console.log('🎯 CREDITS ROUTE HIT! User:', req.user?.id, req.user?.email);
  try {
    const userId = req.user!.id;

    // Get credit balance
    const [credits] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);

    // Auto-initialize if not exists
    if (!credits) {
      const freeCredits = parseInt(process.env.FREE_TIER_CREDITS || '25', 10);
      await db.insert(userCredits).values({
        userId,
        messagesRemaining: freeCredits,
        totalGranted: freeCredits,
        totalUsed: 0,
      });

      console.log('✅ Credits auto-initialized:', freeCredits);
      return res.json({
        messagesRemaining: freeCredits,
        totalGranted: freeCredits,
        totalUsed: 0,
        billingMode: 'free',
        hasByok: false,
      });
    }

    // Check if user has BYOK (own API keys)
    const [userSettings] = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, userId))
      .limit(1);

    const hasAnthropicKey = !!userSettings?.anthropicApiKey;
    const hasOpenAiKey = !!userSettings?.openaiApiKey;
    const hasByok = hasAnthropicKey || hasOpenAiKey;

    // Determine billing mode
    let billingMode: 'free' | 'byok' | 'paid';
    if (hasByok) {
      billingMode = 'byok';
    } else if (credits.totalGranted === parseInt(process.env.FREE_TIER_CREDITS || '25', 10) && credits.totalUsed === 0) {
      billingMode = 'free';
    } else {
      billingMode = credits.messagesRemaining > 0 ? 'paid' : 'free';
    }

    console.log('✅ Credits data:', { messagesRemaining: credits.messagesRemaining, billingMode });
    res.json({
      messagesRemaining: credits.messagesRemaining,
      totalGranted: credits.totalGranted,
      totalUsed: credits.totalUsed,
      billingMode,
      hasByok,
    });
  } catch (error) {
    console.error('❌ Error fetching credits:', error);
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
}));

/**
 * GET /api/credits/pricing
 * Get pricing information for all operations
 */
router.get('/pricing', withAuth(async (req, res) => {
  try {
    // Import from billing types
    const { OPERATION_PRICING } = await import('../types/billing');

    res.json({
      operations: OPERATION_PRICING,
      tiers: [
        {
          id: 'free',
          name: 'Free Tier',
          credits: 50,
          price: 0,
          priceMonthly: 0,
          features: [
            '50 free credits',
            'All AI features',
            'No credit card required',
          ],
        },
        {
          id: 'basic',
          name: 'Basic',
          credits: 200,
          price: 5,
          priceMonthly: 5,
          features: [
            '200 credits/month',
            'All AI features',
            '~100-200 operations',
            'Email support',
          ],
          popular: true,
        },
        {
          id: 'pro',
          name: 'Pro',
          credits: 500,
          price: 12,
          priceMonthly: 12,
          features: [
            '500 credits/month',
            'All AI features',
            '~250-500 operations',
            'Priority support',
          ],
        },
        {
          id: 'mega',
          name: 'Mega',
          credits: 1000,
          price: 20,
          priceMonthly: 20,
          features: [
            '1000 credits/month',
            'All AI features',
            '~500-1000 operations',
            'Priority support',
          ],
        },
        {
          id: 'byok',
          name: 'BYOK',
          credits: null,
          price: 0,
          priceMonthly: 0,
          features: [
            'Unlimited usage',
            'Use your own API keys',
            'Full control',
            'No subscription needed',
          ],
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    res.status(500).json({ error: 'Failed to fetch pricing' });
  }
}));

/**
 * GET /api/credits/usage
 * Get usage history for current user
 */
router.get('/usage', withAuth(async (req, res) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get usage history
    const usage = await db
      .select()
      .from(aiUsageLog)
      .where(eq(aiUsageLog.userId, userId))
      .orderBy(desc(aiUsageLog.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(aiUsageLog)
      .where(eq(aiUsageLog.userId, userId));

    // Get usage summary by operation
    const summary = await db
      .select({
        model: aiUsageLog.model,
        totalCalls: sql<number>`count(*)::int`,
        totalCredits: sql<number>`sum(${aiUsageLog.messageCount})::int`,
        totalInputTokens: sql<number>`sum(${aiUsageLog.inputTokens})::int`,
        totalOutputTokens: sql<number>`sum(${aiUsageLog.outputTokens})::int`,
      })
      .from(aiUsageLog)
      .where(eq(aiUsageLog.userId, userId))
      .groupBy(aiUsageLog.model);

    res.json({
      usage,
      pagination: {
        total: count,
        limit,
        offset,
      },
      summary,
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({ error: 'Failed to fetch usage history' });
  }
}));

export default router;

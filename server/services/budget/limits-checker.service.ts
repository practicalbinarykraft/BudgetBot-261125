import { getBudgetProgress, LimitProgress } from '../budget-progress.service';
import { getTelegramBot } from '../../telegram/bot';
import { db } from '../../db';
import { users, settings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getUserLanguageByTelegramId } from '../../telegram/language';
import { t } from '../../telegram/i18n';

export type LimitStatus = 'ok' | 'caution' | 'warning' | 'exceeded';

export interface LimitCheck extends LimitProgress {
  status: LimitStatus;
  remaining: number;
}

export interface ComplianceResult {
  results: LimitCheck[];
  overSpendTotal: number;
  isOnTrack: boolean;
  hasWarnings: boolean;
}

/**
 * Determine limit status based on percentage
 * 
 * Thresholds:
 * - 0-70%: ok (safe)
 * - 71-90%: caution (yellow)
 * - 91-99%: warning (red)
 * - 100%+: exceeded (dark red)
 */
export function getLimitStatus(percentage: number): LimitStatus {
  if (percentage < 70) return 'ok';
  if (percentage < 90) return 'caution';
  if (percentage < 100) return 'warning';
  return 'exceeded';
}

/**
 * Check single category limit (for real-time alerts)
 * 
 * Used when user creates a transaction to check if they exceeded
 * or are close to exceeding their budget for that category.
 */
export async function checkCategoryLimit(
  userId: number,
  categoryId: number
): Promise<LimitCheck | null> {
  const allLimits = await getBudgetProgress(userId);
  const categoryLimit = allLimits.find(limit => limit.categoryId === categoryId);
  
  if (!categoryLimit) {
    return null;
  }

  const limit = parseFloat(categoryLimit.limitAmount);
  const remaining = Math.max(0, limit - categoryLimit.spent);
  const status = getLimitStatus(categoryLimit.percentage);

  return {
    ...categoryLimit,
    status,
    remaining,
  };
}

/**
 * Check all budget limits compliance
 * 
 * Returns:
 * - Full compliance report for all categories
 * - Total overspend amount
 * - Overall tracking status
 * - Whether there are any warnings
 */
export async function checkLimitsCompliance(
  userId: number
): Promise<ComplianceResult> {
  const allLimits = await getBudgetProgress(userId);

  const results: LimitCheck[] = allLimits.map(limit => {
    const limitAmount = parseFloat(limit.limitAmount);
    const remaining = Math.max(0, limitAmount - limit.spent);
    const status = getLimitStatus(limit.percentage);

    return {
      ...limit,
      status,
      remaining,
    };
  });

  const overSpendTotal = results
    .filter(r => r.status === 'exceeded')
    .reduce((sum, r) => {
      const limit = parseFloat(r.limitAmount);
      return sum + (r.spent - limit);
    }, 0);

  const isOnTrack = results.every(r => r.status !== 'exceeded');
  const hasWarnings = results.some(r => r.status !== 'ok');

  return {
    results,
    overSpendTotal,
    isOnTrack,
    hasWarnings,
  };
}

/**
 * Send budget alert to user via Telegram
 * 
 * Sends immediate notification when:
 * - Category reaches 90%+ (warning)
 * - Category exceeds 100% (exceeded)
 */
export async function sendBudgetAlert(
  userId: number,
  limitCheck: LimitCheck
): Promise<boolean> {
  try {
    const bot = getTelegramBot();
    if (!bot) {
      console.warn('Telegram bot not initialized, skipping alert');
      return false;
    }

    // Get user's Telegram ID
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length || !user[0].telegramId) {
      return false;
    }

    const telegramId = user[0].telegramId;
    
    // Get user's language
    const language = await getUserLanguageByTelegramId(telegramId);

    // Format percentage
    const percentageText = `${Math.round(limitCheck.percentage)}%`;
    const remainingText = `$${limitCheck.remaining.toFixed(2)}`;
    const limitText = `$${limitCheck.limitAmount}`;

    let message = '';

    if (limitCheck.status === 'exceeded') {
      const overspent = limitCheck.spent - parseFloat(limitCheck.limitAmount);
      message = 
        `🚨 *${t('budget.alert.exceeded', language)}*\n\n` +
        `📊 ${limitCheck.categoryName}: ${percentageText}\n` +
        `💰 ${t('budget.alert.limit', language)}: ${limitText}\n` +
        `📈 ${t('budget.alert.spent', language)}: $${limitCheck.spent.toFixed(2)}\n` +
        `⚠️ ${t('budget.alert.overspent', language)}: $${overspent.toFixed(2)}\n\n` +
        `${t('budget.alert.goals_delayed', language)}`;
    } else if (limitCheck.status === 'warning') {
      message = 
        `⚠️ *${t('budget.alert.warning', language)}*\n\n` +
        `📊 ${limitCheck.categoryName}: ${percentageText}\n` +
        `💰 ${t('budget.alert.remaining', language)}: ${remainingText} / ${limitText}\n\n` +
        `${t('budget.alert.slow_down', language)}`;
    }

    if (message) {
      await bot.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error sending budget alert:', error);
    return false;
  }
}

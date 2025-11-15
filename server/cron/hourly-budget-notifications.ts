import * as cron from 'node-cron';
import { db } from '../db';
import { users, settings } from '@shared/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { getTelegramBot } from '../telegram/bot';
import { generateDailySummary } from '../services/budget/daily-summary.service';
import { getUserLanguageByTelegramId } from '../telegram/language';
import { t } from '../telegram/i18n';
import { formatInTimeZone } from 'date-fns-tz';
import { format } from 'date-fns';

/**
 * Check if it's time to send notification for a user
 * 
 * Uses tolerance window (±7 minutes) with cross-hour support
 * 
 * Examples:
 * - User wants 09:00 → triggers at 09:00 ✅
 * - User wants 09:05 → triggers at 09:00 (within 7min) ✅
 * - User wants 09:17 → triggers at 09:15 (within 7min) ✅
 * - User wants 09:38 → triggers at 09:45 (within 7min) ✅
 * - User wants 09:57 → triggers at 10:00 (cross-hour, 3min) ✅
 * - User wants 23:59 → triggers at 00:00 (cross-midnight, 1min) ✅
 */
function isNotificationTime(
  timezone: string,
  notificationTime: string
): boolean {
  try {
    const now = new Date();
    
    // Get current time in user's timezone
    const currentMinutes = parseInt(formatInTimeZone(now, timezone, 'mm'));
    const currentHour = parseInt(formatInTimeZone(now, timezone, 'HH'));
    
    // Parse notification time
    const [notifHourStr, notifMinStr] = notificationTime.split(':');
    const notifHour = parseInt(notifHourStr);
    const notifMin = parseInt(notifMinStr);
    
    // Case 1: Same hour - check ±7 minutes tolerance
    if (currentHour === notifHour) {
      const diff = Math.abs(currentMinutes - notifMin);
      return diff <= 7;
    }
    
    // Case 2: Previous hour edge (notification time :53-:59, current time :00-:06)
    const prevHour = (currentHour - 1 + 24) % 24; // Handle midnight wrap
    if (prevHour === notifHour && notifMin >= 53 && currentMinutes <= 6) {
      // Calculate cross-hour distance: (60 - notifMin) + currentMinutes
      const crossHourDiff = (60 - notifMin) + currentMinutes;
      return crossHourDiff <= 7;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking notification time:', error);
    return false;
  }
}

/**
 * Format daily summary message for Telegram
 */
async function formatDailySummaryMessage(
  userId: number,
  timezone: string,
  language: 'en' | 'ru'
): Promise<string> {
  const summary = await generateDailySummary(userId, timezone);
  
  const today = formatInTimeZone(new Date(), timezone, 'EEEE, MMMM d');
  
  let message = `🌅 *${t('daily_summary.good_morning', language)}*\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📅 *${today}*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Today's planned expenses
  if (summary.todayExpenses.length > 0) {
    message += `💸 *${t('daily_summary.today_planned', language)}*\n`;
    summary.todayExpenses.forEach(exp => {
      message += `  • ${exp.description}: $${exp.amount.toFixed(2)}\n`;
    });
    message += `  *${t('daily_summary.total', language)}:* $${summary.todayTotal.toFixed(2)}\n\n`;
  }

  // Week's upcoming expenses
  if (summary.weekExpenses.length > 0 && summary.weekExpenses.length !== summary.todayExpenses.length) {
    message += `📆 *${t('daily_summary.week_upcoming', language)}*\n`;
    
    // Group by date
    const byDate = new Map<string, typeof summary.weekExpenses>();
    summary.weekExpenses.forEach(exp => {
      const dateExpenses = byDate.get(exp.date) || [];
      dateExpenses.push(exp);
      byDate.set(exp.date, dateExpenses);
    });

    byDate.forEach((expenses, date) => {
      const dateFormatted = formatInTimeZone(
        new Date(date + 'T00:00:00'),
        timezone,
        'EEE d'
      );
      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      message += `  ${dateFormatted}: $${total.toFixed(2)}\n`;
    });
    message += `  *${t('daily_summary.week_total', language)}:* $${summary.weekTotal.toFixed(2)}\n\n`;
  }

  // Budget status (only if there are warnings/exceeded)
  if (summary.budgetAlerts.length > 0) {
    message += `━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📊 *${t('daily_summary.budget_status', language)}*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    summary.budgetAlerts.forEach(alert => {
      const emoji = alert.status === 'exceeded' ? '🔴' : '🟡';
      const percentage = Math.round(alert.percentage);
      message += `${emoji} ${alert.categoryName}: ${percentage}%\n`;
      
      if (alert.status === 'exceeded') {
        const overspent = alert.spent - parseFloat(alert.limitAmount);
        message += `   ${t('daily_summary.overspent', language)}: $${overspent.toFixed(2)}\n`;
      } else {
        message += `   ${t('daily_summary.remaining', language)}: $${alert.remaining.toFixed(2)}\n`;
      }
    });
    message += `\n`;
  }

  // Available capital
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💰 *${t('daily_summary.capital', language)}*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `📈 ${t('daily_summary.income', language)}: $${summary.monthIncome.toFixed(2)}\n`;
  message += `📉 ${t('daily_summary.expenses', language)}: $${summary.monthExpenses.toFixed(2)}\n`;
  message += `💵 ${t('daily_summary.available', language)}: $${summary.availableCapital.toFixed(2)}\n`;

  return message;
}

/**
 * Send daily summary to a user
 */
async function sendDailySummaryToUser(
  userId: number,
  telegramId: string,
  timezone: string
): Promise<boolean> {
  try {
    const bot = getTelegramBot();
    if (!bot) {
      console.warn('Telegram bot not initialized');
      return false;
    }

    // Get user's language
    const language = await getUserLanguageByTelegramId(telegramId);

    // Generate and send message
    const message = await formatDailySummaryMessage(userId, timezone, language);
    await bot.sendMessage(telegramId, message, { parse_mode: 'Markdown' });

    console.log(`✅ Daily summary sent to user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error sending daily summary to user ${userId}:`, error);
    return false;
  }
}

/**
 * Hourly check and send notifications
 * 
 * Runs every hour, checks all users, sends notifications
 * to those whose local time matches their notification time
 */
async function hourlyNotificationCheck() {
  console.log('🕐 Running hourly budget notification check...');

  try {
    // Get all users with active Telegram notifications
    const usersWithNotifications = await db
      .select({
        userId: users.id,
        telegramId: users.telegramId,
        timezone: settings.timezone,
        notificationTime: settings.notificationTime,
        telegramNotifications: settings.telegramNotifications,
      })
      .from(users)
      .innerJoin(settings, eq(users.id, settings.userId))
      .where(
        and(
          isNotNull(users.telegramId),
          eq(settings.telegramNotifications, true)
        )
      );

    let sentCount = 0;

    for (const user of usersWithNotifications) {
      if (!user.telegramId) continue;

      const timezone = user.timezone || 'UTC';
      const notificationTime = user.notificationTime || '09:00';

      // Check if it's time to send notification
      if (isNotificationTime(timezone, notificationTime)) {
        const sent = await sendDailySummaryToUser(
          user.userId,
          user.telegramId,
          timezone
        );
        if (sent) sentCount++;
      }
    }

    console.log(`✅ Hourly check complete. Sent ${sentCount} notifications.`);
  } catch (error) {
    console.error('Error in hourly notification check:', error);
  }
}

/**
 * Initialize hourly budget notification cron job
 * 
 * Runs every 15 minutes to match user notification preferences
 * (allows notifications at :00, :15, :30, :45 past each hour)
 */
export function initHourlyBudgetNotifications() {
  // Run every 15 minutes (00, 15, 30, 45 past each hour)
  cron.schedule('*/15 * * * *', async () => {
    await hourlyNotificationCheck();
  });

  console.log('✅ Hourly budget notifications initialized (runs every 15 min)');
}

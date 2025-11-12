import * as cron from 'node-cron';
import { db } from '../db';
import { settings, users } from '@shared/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { getTelegramBot } from '../telegram/bot';
import { t } from '../telegram/i18n';

const scheduledTasks = new Map<number, cron.ScheduledTask>();

async function sendDailySummary(telegramId: string, language: 'en' | 'ru') {
  const bot = getTelegramBot();
  if (!bot) {
    console.error('Telegram bot not initialized');
    return;
  }

  const now = new Date();
  const today = now.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const message = t('daily_summary.title', language) + '\n\n' + 
                  t('daily_summary.date', language).replace('{date}', today);

  await bot.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
}

function getCronExpression(notificationTime: string, timezone: string): string {
  const [hours, minutes] = notificationTime.split(':');
  return `${minutes} ${hours} * * *`;
}

export async function scheduleNotificationForUser(userId: number) {
  const userSettings = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, userId))
    .limit(1);

  if (!userSettings.length || !userSettings[0].telegramNotifications) {
    if (scheduledTasks.has(userId)) {
      scheduledTasks.get(userId)?.stop();
      scheduledTasks.delete(userId);
    }
    return;
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user.length || !user[0].telegramId) {
    return;
  }

  const notificationTime = userSettings[0].notificationTime || '09:00';
  const timezone = userSettings[0].timezone || 'UTC';
  const language = (userSettings[0].language || 'en') as 'en' | 'ru';
  const telegramId = user[0].telegramId;

  if (scheduledTasks.has(userId)) {
    scheduledTasks.get(userId)?.stop();
  }

  const cronExpression = getCronExpression(notificationTime, timezone);
  
  const task = cron.schedule(cronExpression, () => {
    sendDailySummary(telegramId, language).catch(error => {
      console.error(`Failed to send daily summary to user ${userId}:`, error);
    });
  }, {
    timezone: timezone
  });

  scheduledTasks.set(userId, task);
  console.log(`Scheduled daily notification for user ${userId} at ${notificationTime} ${timezone}`);
}

export async function initializeScheduledNotifications() {
  const allSettings = await db
    .select()
    .from(settings)
    .where(eq(settings.telegramNotifications, true));

  for (const setting of allSettings) {
    await scheduleNotificationForUser(setting.userId);
  }

  console.log(`Initialized ${scheduledTasks.size} scheduled notifications`);
}

export async function updateScheduleForUser(userId: number) {
  await scheduleNotificationForUser(userId);
}

export function stopAllScheduledNotifications() {
  Array.from(scheduledTasks.values()).forEach(task => task.stop());
  scheduledTasks.clear();
  console.log('Stopped all scheduled notifications');
}

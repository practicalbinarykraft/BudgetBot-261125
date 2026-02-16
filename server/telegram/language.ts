import { db } from '../db';
import { users, settings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getUserLanguage, type Language } from '@shared/i18n';
import { logError } from '../lib/logger';

/**
 * Helper function to get user's language preference by Telegram ID
 * Eliminates code duplication across bot.ts and commands.ts
 * 
 * @param telegramId - Telegram user ID as string
 * @returns User's preferred language ('en' or 'ru'), defaults to 'en' if not found
 */
export async function getUserLanguageByTelegramId(telegramId: string): Promise<Language> {
  try {
    // Используем явное указание полей, исключая isBlocked
    const [user] = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);
    
    if (!user) {
      return 'en';
    }

    return getUserLanguageByUserId(user.id);
  } catch (err) {
    logError('Error fetching user language:', err);
    return 'en';
  }
}

/**
 * Helper function to get user's language preference by User ID
 * Use this when you already have the user record to avoid duplicate DB queries
 * 
 * @param userId - Internal user ID (number)
 * @returns User's preferred language ('en' or 'ru'), defaults to 'en' if not found
 */
export async function getUserLanguageByUserId(userId: number): Promise<Language> {
  try {
    const [userSettings] = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, userId))
      .limit(1);
    
    return getUserLanguage(userSettings);
  } catch (err) {
    logError('Error fetching user settings:', err);
    return 'en';
  }
}

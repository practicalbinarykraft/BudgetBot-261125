import { db } from '../../../server/db.js';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Database Helper Functions
 * 
 * FOR JUNIORS: These functions help clean up test data from the database.
 * After each test, we need to remove test users and data to keep tests isolated.
 * 
 * Usage:
 *   const dbHelper = new DbHelper();
 *   await dbHelper.cleanupTestUser('test@example.com');
 */
export class DbHelper {
  /**
   * Delete test user by email
   */
  async deleteUserByEmail(email: string): Promise<void> {
    try {
      await db.delete(users).where(eq(users.email, email));
    } catch (error) {
      // Ignore errors if user doesn't exist
      console.warn(`Failed to delete user ${email}:`, error);
    }
  }

  /**
   * Delete test user by telegram ID
   */
  async deleteUserByTelegramId(telegramId: string): Promise<void> {
    try {
      await db.delete(users).where(eq(users.telegramId, telegramId));
    } catch (error) {
      // Ignore errors if user doesn't exist
      console.warn(`Failed to delete user with telegramId ${telegramId}:`, error);
    }
  }

  /**
   * Cleanup all test users (emails starting with 'test-' or 'e2e-')
   */
  async cleanupTestUsers(): Promise<void> {
    try {
      // Delete users with test email patterns
      const testEmails = await db
        .select({ email: users.email })
        .from(users)
        .where(
          // Match emails starting with 'test-' or 'e2e-'
          // Note: This is a simplified approach. In production, use proper SQL LIKE
        );
      
      // For now, we'll delete individually in tests
      // This is a placeholder for future bulk cleanup
    } catch (error) {
      console.warn('Failed to cleanup test users:', error);
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return user;
  }

  /**
   * Check if user exists
   */
  async userExists(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    return !!user;
  }
}

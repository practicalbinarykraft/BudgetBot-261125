import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';

// Create database connection for tests
const pool = process.env.DATABASE_URL 
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

const db = pool ? drizzle(pool, { schema }) : null;

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
    if (!db) {
      console.warn('Database not available, skipping cleanup');
      return;
    }
    try {
      await db.delete(schema.users).where(eq(schema.users.email, email));
    } catch (error) {
      // Ignore errors if user doesn't exist
      console.warn(`Failed to delete user ${email}:`, error);
    }
  }

  /**
   * Delete test user by telegram ID
   */
  async deleteUserByTelegramId(telegramId: string): Promise<void> {
    if (!db) {
      console.warn('Database not available, skipping cleanup');
      return;
    }
    try {
      await db.delete(schema.users).where(eq(schema.users.telegramId, telegramId));
    } catch (error) {
      // Ignore errors if user doesn't exist
      console.warn(`Failed to delete user with telegramId ${telegramId}:`, error);
    }
  }

  /**
   * Cleanup all test users (emails containing 'test' or 'e2e')
   */
  async cleanupTestUsers(): Promise<void> {
    if (!db) {
      console.warn('Database not available, skipping cleanup');
      return;
    }
    try {
      // Get all users with test email patterns
      const allUsers = await db.select({ email: schema.users.email, id: schema.users.id }).from(schema.users);
      
      // Delete users with test email patterns
      for (const user of allUsers) {
        if (user.email && (user.email.includes('test') || user.email.includes('e2e'))) {
          await db.delete(schema.users).where(eq(schema.users.id, user.id));
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup test users:', error);
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    if (!db) {
      return null;
    }
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
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

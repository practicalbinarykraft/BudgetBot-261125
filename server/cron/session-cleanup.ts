/**
 * Session Cleanup Cron Job
 *
 * Automatically removes expired sessions from the database.
 * Runs daily at 3 AM to clean up old session records.
 *
 * Note: connect-pg-simple already has built-in cleanup via pruneSessionInterval,
 * but this provides an additional safety net and better logging.
 */

import cron from 'node-cron';
import { pool } from '../db';

let isRunning = false;

/**
 * Clean up expired sessions from database
 */
async function cleanupExpiredSessions(): Promise<void> {
  if (isRunning) {
    console.log('⏭️  Session cleanup already running, skipping...');
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    console.log('🧹 Starting session cleanup...');

    // Count expired sessions before cleanup
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM session WHERE expire < NOW()'
    );
    const expiredCount = parseInt(countResult.rows[0]?.count || '0');

    if (expiredCount === 0) {
      console.log('✅ No expired sessions to clean up');
      return;
    }

    console.log(`   Found ${expiredCount} expired sessions`);

    // Delete expired sessions
    const deleteResult = await pool.query(
      'DELETE FROM session WHERE expire < NOW()'
    );

    const deletedCount = deleteResult.rowCount || 0;
    const duration = Date.now() - startTime;

    console.log(`✅ Session cleanup completed:`);
    console.log(`   - Deleted: ${deletedCount} sessions`);
    console.log(`   - Duration: ${duration}ms`);

    // Get remaining session stats
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN expire > NOW() THEN 1 END) as active,
        MIN(expire) as oldest_expire,
        MAX(expire) as newest_expire
      FROM session
    `);

    const stats = statsResult.rows[0];
    console.log(`   - Remaining: ${stats.total} total, ${stats.active} active`);

  } catch (error: any) {
    console.error('❌ Session cleanup failed:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    isRunning = false;
  }
}

/**
 * Initialize session cleanup cron job
 * Runs daily at 3:00 AM
 */
export function initSessionCleanup(): void {
  console.log('📅 Initializing session cleanup cron job...');

  // Run daily at 3:00 AM
  cron.schedule('0 3 * * *', async () => {
    await cleanupExpiredSessions();
  });

  console.log('✅ Session cleanup cron job scheduled (daily at 3:00 AM)');

  // Optional: Run immediately on startup for testing (comment out in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode: Running initial cleanup...');
    setTimeout(() => {
      cleanupExpiredSessions().catch(console.error);
    }, 5000); // Wait 5 seconds after startup
  }
}

/**
 * Manual cleanup function (can be called from admin endpoints)
 */
export async function manualSessionCleanup(): Promise<{
  success: boolean;
  deletedCount: number;
  duration: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const result = await pool.query(
      'DELETE FROM session WHERE expire < NOW()'
    );

    return {
      success: true,
      deletedCount: result.rowCount || 0,
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      success: false,
      deletedCount: 0,
      duration: Date.now() - startTime,
      error: error.message,
    };
  }
}

/**
 * Get session statistics
 */
export async function getSessionStats(): Promise<{
  total: number;
  active: number;
  expired: number;
  oldestExpire: Date | null;
  newestExpire: Date | null;
}> {
  const result = await pool.query(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN expire > NOW() THEN 1 END) as active,
      COUNT(CASE WHEN expire < NOW() THEN 1 END) as expired,
      MIN(expire) as oldest_expire,
      MAX(expire) as newest_expire
    FROM session
  `);

  const row = result.rows[0];

  return {
    total: parseInt(row.total),
    active: parseInt(row.active),
    expired: parseInt(row.expired),
    oldestExpire: row.oldest_expire,
    newestExpire: row.newest_expire,
  };
}

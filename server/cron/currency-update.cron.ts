/**
 * Currency Update Cron Job
 *
 * Automatically updates exchange rates daily at 3 AM UTC
 */

import cron from 'node-cron';
import { fetchLatestRates } from '../services/currency-update.service';
import logger from '../lib/logger';

/**
 * Schedule: Every day at 3:00 AM UTC
 * Cron format: minute hour day month weekday
 * '0 3 * * *' = At 03:00 every day
 */
export function initCurrencyUpdateCron() {
  cron.schedule('0 3 * * *', async () => {
    logger.info('🕒 Running scheduled currency update...');

    try {
      const success = await fetchLatestRates();

      if (success) {
        logger.info('✅ Scheduled currency update completed successfully');
      } else {
        logger.warn('⚠️  Scheduled currency update failed, using fallback rates');
      }
    } catch (error: any) {
      logger.error('❌ Error in scheduled currency update', {
        error: error.message,
      });
    }
  }, {
    timezone: 'UTC',
  });

  logger.info('✅ Currency update cron job initialized (runs daily at 3:00 AM UTC)');
}

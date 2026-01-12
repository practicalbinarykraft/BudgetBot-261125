import { Router } from 'express';
import { getTelegramBot } from '../telegram/bot';
import { logInfo, logError, logWarning } from '../lib/logger';
import { isUpdateProcessed, markUpdateProcessed } from '../telegram/middleware/deduplication';

const router = Router();

/**
 * Telegram Webhook Endpoint
 *
 * This endpoint receives updates from Telegram servers when configured
 * with webhooks instead of polling.
 *
 * Benefits over polling:
 * - Instant message delivery (no delay)
 * - Lower server load (no constant requests)
 * - More scalable (no connection limits)
 * - Production best practice
 */
router.post('/webhook/:token', async (req, res) => {
  const { token } = req.params;
  const bot = getTelegramBot();

  // Verify bot exists
  if (!bot) {
    logWarning('Telegram webhook called but bot not initialized');
    return res.status(503).json({ error: 'Bot not initialized' });
  }

  // Verify token matches (simple security)
  const expectedToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!expectedToken || token !== expectedToken.split(':')[1]) {
    logWarning('Telegram webhook called with invalid token', {
      receivedToken: token?.substring(0, 10) + '...',
    });
    return res.status(403).json({ error: 'Invalid token' });
  }

  try {
    const updateId = req.body.update_id;
    
    // Дедупликация: проверяем, не обработано ли это обновление уже
    if (updateId && isUpdateProcessed(updateId)) {
      logWarning('Duplicate Telegram webhook update detected, skipping', {
        updateId,
        hasMessage: !!req.body.message,
        hasCallbackQuery: !!req.body.callback_query,
      });
      // Все равно возвращаем 200 OK, чтобы Telegram не повторял запрос
      return res.status(200).json({ ok: true, skipped: 'duplicate' });
    }

    // Process the update
    logInfo('Processing Telegram webhook update', {
      updateId,
      hasMessage: !!req.body.message,
      hasCallbackQuery: !!req.body.callback_query,
    });

    // Отмечаем обновление как обработанное ПЕРЕД обработкой
    // (чтобы избежать race condition, если обновление придет дважды одновременно)
    if (updateId) {
      markUpdateProcessed(updateId);
    }

    // Let node-telegram-bot-api handle the update
    await bot.processUpdate(req.body);

    // Telegram expects 200 OK quickly
    res.status(200).json({ ok: true });

  } catch (error) {
    logError('Error processing Telegram webhook', error as Error, {
      updateId: req.body.update_id,
    });

    // Still return 200 to prevent Telegram from retrying
    res.status(200).json({ ok: true });
  }
});

/**
 * Health check endpoint for webhook
 */
router.get('/webhook/health', (_req, res) => {
  const bot = getTelegramBot();
  res.json({
    status: bot ? 'ready' : 'not_initialized',
    mode: process.env.TELEGRAM_USE_WEBHOOK === 'true' ? 'webhook' : 'polling',
  });
});

/**
 * Diagnostic endpoint for Telegram bot
 */
router.get('/debug', async (_req, res) => {
  const bot = getTelegramBot();
  const { getDeduplicationStats } = await import('../telegram/middleware/deduplication');
  
  let webhookInfo = null;
  if (bot) {
    try {
      webhookInfo = await bot.getWebHookInfo();
    } catch (error) {
      // Ignore errors when getting webhook info
    }
  }
  
  const dedupStats = getDeduplicationStats();
  
  res.json({
    bot: {
      initialized: !!bot,
      mode: process.env.TELEGRAM_USE_WEBHOOK === 'true' ? 'webhook' : 'polling',
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || null,
      useWebhook: process.env.TELEGRAM_USE_WEBHOOK === 'true',
      disabled: process.env.DISABLE_TELEGRAM_BOT === 'true',
    },
    webhook: webhookInfo,
    deduplication: dedupStats,
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasToken: !!process.env.TELEGRAM_BOT_TOKEN,
    },
  });
});

export default router;

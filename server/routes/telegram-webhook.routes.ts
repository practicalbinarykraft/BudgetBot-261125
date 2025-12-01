import { Router } from 'express';
import { getTelegramBot } from '../telegram/bot';
import { logInfo, logError, logWarning } from '../lib/logger';

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
    // Process the update
    logInfo('Processing Telegram webhook update', {
      updateId: req.body.update_id,
      hasMessage: !!req.body.message,
      hasCallbackQuery: !!req.body.callback_query,
    });

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

export default router;

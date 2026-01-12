/**
 * /recover Command Handler
 *
 * Handles password recovery via Telegram
 * Sends 6-digit recovery code to user's Telegram
 *
 * Junior-Friendly: ~80 lines, clear flow with STEP-by-STEP comments
 */

import TelegramBot from 'node-telegram-bot-api';
import { requestPasswordRecovery } from '../../services/password-recovery.service';
import { getUserLanguageByTelegramId } from '../language';
import { t } from '@shared/i18n';

/**
 * Handle /recover command
 *
 * Flow:
 * 1. Get user's Telegram ID
 * 2. Request recovery code (via password-recovery.service)
 * 3. Code is sent automatically via Telegram
 * 4. Inform user to check their messages
 */
export async function handleRecoverCommand(
  bot: TelegramBot,
  msg: TelegramBot.Message
): Promise<void> {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  if (!telegramId) {
    const lang = await getUserLanguageByTelegramId(telegramId || '');
    await bot.sendMessage(
      chatId,
      t('password_recovery.user_not_found', lang || 'en')
    );
    return;
  }

  try {
    // STEP 1: Get user's language
    const lang = await getUserLanguageByTelegramId(telegramId);

    // STEP 2: Request recovery code
    // Service will automatically send code via Telegram if user has Telegram linked
    const result = await requestPasswordRecovery(telegramId);

    if (!result.success) {
      // STEP 3: Handle errors
      let errorMessage = '';

      if (result.method === 'none') {
        errorMessage =
          `❌ ${t('password_recovery.no_recovery_method', lang)}\n\n` +
          `💡 ${t('password_recovery.telegram_warning', lang)}`;
      } else if (result.method === 'email') {
        errorMessage =
          `❌ ${result.error || t('password_recovery.request_error', lang)}\n\n` +
          `💡 ${t('password_recovery.telegram_warning', lang)}`;
      } else {
        errorMessage = result.error || t('password_recovery.request_error', lang);
      }

      await bot.sendMessage(chatId, errorMessage, { parse_mode: 'Markdown' });
      return;
    }

    // STEP 4: Success - code sent via Telegram
    const successMessage =
      `✅ ${t('password_recovery.request_success', lang)}\n\n` +
      `📱 ${t('password_recovery.telegram_code', lang)} отправлен в Telegram\n\n` +
      `⏰ ${t('password_recovery.telegram_expiry', lang)} ${t('password_recovery.minutes', lang)}\n\n` +
      `💡 Используйте код на странице восстановления пароля`;

    await bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    // STEP 5: Handle unexpected errors
    const lang = await getUserLanguageByTelegramId(telegramId);
    await bot.sendMessage(
      chatId,
      `❌ ${t('password_recovery.request_error', lang)}`,
      { parse_mode: 'Markdown' }
    );
  }
}


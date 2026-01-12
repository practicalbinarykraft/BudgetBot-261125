import TelegramBot from "node-telegram-bot-api";
import { db } from "../db";
import { users, settings } from "@shared/schema";
import { eq } from "drizzle-orm";
import { transcribeVoiceMessage, getTelegramFileUrl } from "../services/whisper-transcription.service";
import { voiceTransactionNormalizer } from "../services/voice-transaction-normalizer.service";
import { t } from "@shared/i18n";
import { getUserLanguageByTelegramId } from "./language";
import { handleTextMessage } from "./commands/index";
import { getApiKey } from "../services/api-key-manager";
import { chargeCredits } from "../services/billing.service";
import { parseTransactionWithDeepSeek } from "../services/deepseek.service";
import { BillingError } from "../types/billing";

/**
 * Voice Message Handler for Telegram Bot
 * Responsibility: Download and transcribe voice/audio messages, then process as text
 * Junior-Friendly: <200 lines, modular and focused
 */

/**
 * Handle incoming voice or audio message from Telegram
 * 
 * @param bot - Telegram bot instance
 * @param msg - Telegram message with voice or audio
 */
export async function handleVoiceMessage(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  // Логирование для отладки
  const { logInfo, logWarning, logError } = await import('../lib/logger');
  logInfo('Voice message handler called', {
    chatId,
    telegramId: telegramId || 'missing',
    hasVoice: !!msg.voice,
    hasAudio: !!msg.audio,
  });

  if (!telegramId) {
    logWarning('Voice message without telegramId', { chatId });
    return;
  }

  let lang = await getUserLanguageByTelegramId(telegramId);

  try {
    // Check if voice or audio message
    const voiceFile = msg.voice?.file_id || msg.audio?.file_id;
    
    if (!voiceFile) {
      logWarning('Voice message handler called but no voice/audio file found', {
        chatId,
        telegramId,
        hasVoice: !!msg.voice,
        hasAudio: !!msg.audio,
      });
      return;
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (!user) {
      await bot.sendMessage(chatId, t('verify.not_verified', lang), { parse_mode: 'Markdown' });
      return;
    }

    // 🔐 Get user's settings
    const { settingsRepository } = await import('../repositories/settings.repository');
    const userSettings = await settingsRepository.getSettingsByUserId(user.id);

    // 🎯 Smart API key selection: BYOK or system key with credits
    let whisperApiKey;
    let whisperBillingMode;

    try {
      const apiKeyInfo = await getApiKey(user.id, 'voice_transcription');
      whisperApiKey = apiKeyInfo.key;
      whisperBillingMode = apiKeyInfo;
    } catch (error) {
      if (error instanceof BillingError && error.code === 'INSUFFICIENT_CREDITS') {
        await bot.sendMessage(
          chatId,
          t('voice.no_credits', lang) ||
          '❌ No credits remaining. Purchase more at /app/settings/billing or add your own OpenAI API key.',
          { parse_mode: 'Markdown' }
        );
        return;
      }
      throw error;
    }

    // Send "transcribing..." status message
    const statusMsg = await bot.sendMessage(
      chatId,
      t('voice.transcribing', lang)
    );

    // Get Telegram bot token
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('[Voice] TELEGRAM_BOT_TOKEN not found');
      await bot.editMessageText(
        t('voice.error_unexpected', lang),
        { chat_id: chatId, message_id: statusMsg.message_id }
      );
      return;
    }

    // Get file download URL from Telegram
    const fileUrl = await getTelegramFileUrl(botToken, voiceFile);

    if (!fileUrl) {
      console.error('[Voice] Failed to get Telegram file URL');
      await bot.editMessageText(
        t('voice.download_error', lang),
        { chat_id: chatId, message_id: statusMsg.message_id }
      );
      return;
    }

    console.log(`[Voice] Transcribing voice message for user ${user.id} (${lang})`);

    // Transcribe using OpenAI Whisper
    const result = await transcribeVoiceMessage(
      whisperApiKey,
      fileUrl,
      lang // Pass user's language for better accuracy
    );

    if (!result.success || !result.text) {
      console.error('[Voice] Transcription failed:', result.errorCode);

      // Map error code to i18n key
      const errorKey = result.errorCode
        ? `voice.error_${result.errorCode}`
        : 'voice.error_unknown';

      await bot.editMessageText(
        t(errorKey, lang),
        { chat_id: chatId, message_id: statusMsg.message_id }
      );
      return;
    }

    console.log(`[Voice] Transcription successful: "${result.text}"`);

    // 💳 Charge credits for Whisper transcription
    if (whisperBillingMode.shouldCharge) {
      const durationSeconds = msg.voice?.duration || msg.audio?.duration || 30;
      await chargeCredits(
        user.id,
        'voice_transcription',
        whisperBillingMode.provider,
        { input: durationSeconds * 100, output: 0 }, // Approximate token count
        whisperBillingMode.billingMode === 'free'
      );
    }

    // Delete status message
    await bot.deleteMessage(chatId, statusMsg.message_id);

    // Send transcribed text back to user (plain text to avoid Markdown formatting issues)
    await bot.sendMessage(
      chatId,
      `${t('voice.transcribed', lang)}:\n\n"${result.text}"`
    );

    // 🚀 AI normalization using DeepSeek (12x cheaper than Claude!)
    let processedText = result.text;

    try {
      // Get API key for normalization (DeepSeek by default)
      const normalizationApiKey = await getApiKey(user.id, 'voice_normalization');

      console.log(`[Voice] Attempting AI normalization with ${normalizationApiKey.provider}...`);

      // Parse transaction with DeepSeek
      const parsed = await parseTransactionWithDeepSeek(
        normalizationApiKey.key,
        result.text,
        userSettings?.currency || 'USD'
      );

      console.log('[Voice] AI normalization successful:', parsed);

      // Convert normalized data back to "smart" text for handleTextMessage
      // Format: "{amount} {currency} {description}"
      // Example: "150000 IDR Coffee at Starbucks"
      if (parsed.amount > 0 && parsed.currency) {
        const description = parsed.description?.trim() || result.text.slice(0, 50).trim();
        processedText = `${parsed.amount} ${parsed.currency} ${description}`;

        await bot.sendMessage(
          chatId,
          `💡 AI processed: ${processedText}`
        );

        // 💳 Charge credits for normalization
        if (normalizationApiKey.shouldCharge) {
          await chargeCredits(
            user.id,
            'voice_normalization',
            normalizationApiKey.provider,
            { input: result.text.length * 4, output: 200 }, // Estimate tokens
            normalizationApiKey.billingMode === 'free'
          );
        }
      } else {
        console.log('[Voice] AI normalization incomplete (missing amount or currency), using original text');
      }
    } catch (normError) {
      // If normalization fails (no credits or error), use original text
      if (normError instanceof BillingError) {
        console.log('[Voice] Skipping AI normalization: no credits');
      } else {
        console.error('[Voice] AI normalization error:', normError);
      }
      // Continue with original text
    }

    // Create a synthetic text message to reuse existing text handler
    const syntheticMsg: TelegramBot.Message = {
      ...msg,
      text: processedText,
    };

    // Process text as a regular text message
    // This will handle transaction parsing, AI chat, etc.
    await handleTextMessage(bot, syntheticMsg);

  } catch (err: any) {
    console.error('[Voice] Unexpected error:', err);
    await bot.sendMessage(
      chatId,
      t('voice.error_unexpected', lang)
    );
  }
}

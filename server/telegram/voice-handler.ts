import TelegramBot from "node-telegram-bot-api";
import { db } from "../db";
import { users, settings } from "@shared/schema";
import { eq } from "drizzle-orm";
import { transcribeVoiceMessage, getTelegramFileUrl } from "../services/whisper-transcription.service";
import { voiceTransactionNormalizer } from "../services/voice-transaction-normalizer.service";
import { t } from "@shared/i18n";
import { getUserLanguageByTelegramId } from "./language";
import { handleTextMessage } from "./commands/index";

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

  if (!telegramId) {
    return;
  }

  let lang = await getUserLanguageByTelegramId(telegramId);

  try {
    // Check if voice or audio message
    const voiceFile = msg.voice?.file_id || msg.audio?.file_id;
    
    if (!voiceFile) {
      console.error('[Voice] No voice/audio file found in message');
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

    // 🔐 Get user's settings and decrypted OpenAI API key
    const { settingsRepository } = await import('../repositories/settings.repository');
    const userSettings = await settingsRepository.getSettingsByUserId(user.id);
    const openaiApiKey = await settingsRepository.getOpenAiApiKey(user.id);

    if (!openaiApiKey) {
      await bot.sendMessage(
        chatId,
        t('voice.no_api_key', lang),
        { parse_mode: 'Markdown' }
      );
      return;
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
      openaiApiKey,
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

    // Delete status message
    await bot.deleteMessage(chatId, statusMsg.message_id);

    // Send transcribed text back to user (plain text to avoid Markdown formatting issues)
    await bot.sendMessage(
      chatId,
      `${t('voice.transcribed', lang)}:\n\n"${result.text}"`
    );

    // Try AI normalization (if Anthropic API key available)
    const anthropicApiKey = await settingsRepository.getAnthropicApiKey(user.id);
    let processedText = result.text;

    if (anthropicApiKey) {
      console.log('[Voice] Attempting AI normalization...');
      
      const normalizationResult = await voiceTransactionNormalizer.normalize({
        transcribedText: result.text,
        userCurrency: userSettings?.currency || 'USD',
        anthropicApiKey
      });

      if (normalizationResult.success) {
        const normalized = normalizationResult.data;
        console.log('[Voice] AI normalization successful:', normalized);

        // Validate that we have required fields (description optional)
        if (normalized.amount > 0 && normalized.currency) {
          // Convert normalized data back to "smart" text for handleTextMessage
          // Format: "{amount} {currency} {description}"
          // Example: "150000 IDR Coffee at Starbucks"
          const description = normalized.description?.trim() || result.text.slice(0, 50).trim();
          processedText = `${normalized.amount} ${normalized.currency} ${description}`;
          
          // Show confidence indicator to user
          if (normalized.confidence === 'medium' || normalized.confidence === 'low') {
            await bot.sendMessage(
              chatId,
              `ℹ️ ${t('voice.ai_processed', lang)}: ${processedText}`
            );
          }
        } else {
          console.log('[Voice] AI normalization incomplete (missing amount or currency), using original text');
        }
      } else {
        // AI normalization failed - use fallback if available
        console.log('[Voice] AI normalization failed, trying fallback...');
        
        if (normalizationResult.fallback) {
          const fallback = normalizationResult.fallback;
          
          if (fallback.amount > 0 && fallback.currency) {
            const fallbackDesc = fallback.description?.trim() || result.text.slice(0, 50);
            processedText = `${fallback.amount} ${fallback.currency} ${fallbackDesc}`;
            console.log('[Voice] Using fallback parser:', processedText);
          }
        }
      }
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

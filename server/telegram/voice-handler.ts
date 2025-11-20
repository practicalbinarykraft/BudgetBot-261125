import TelegramBot from "node-telegram-bot-api";
import { db } from "../db";
import { users, settings } from "@shared/schema";
import { eq } from "drizzle-orm";
import { transcribeVoiceMessage, getTelegramFileUrl } from "../services/whisper-transcription.service";
import { t } from "@shared/i18n";
import { getUserLanguageByTelegramId } from "./language";
import { handleTextMessage } from "./commands";

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

    // Get user's OpenAI API key from settings
    const [userSettings] = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, user.id))
      .limit(1);

    const openaiApiKey = userSettings?.openaiApiKey;

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

    // Create a synthetic text message to reuse existing text handler
    const syntheticMsg: TelegramBot.Message = {
      ...msg,
      text: result.text,
    };

    // Process transcribed text as a regular text message
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

/**
 * Photo Message Handler
 *
 * Обрабатывает фотографии чеков от пользователя
 * Использует OCR (Anthropic Vision API) для извлечения данных
 */

import TelegramBot from 'node-telegram-bot-api';
import { db } from '../../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { processReceiptImage } from '../ocr';
import { formatCurrency } from '../parser';
import { t } from '@shared/i18n';
import { getUserLanguageByTelegramId, getUserLanguageByUserId } from '../language';
import { convertToUSD, getUserExchangeRates } from '../../services/currency-service';
import { resolveCategoryId } from '../../services/category-resolution.service';
import { storage } from '../../storage';
import { pendingReceipts } from '../pending-receipts';
import { getApiKey } from '../../services/api-key-manager';
import { chargeCredits } from '../../services/billing.service';
import { BillingError } from '../../types/billing';
import { TELEGRAM_BOT_TOKEN } from '../config';

export async function handlePhotoMessage(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  // Логирование для отладки
  const { logInfo, logWarning, logError } = await import('../../lib/logger');
  logInfo('Photo message handler called', {
    chatId,
    telegramId: telegramId || 'missing',
    hasPhoto: !!msg.photo,
    photoCount: msg.photo?.length || 0,
    hasCaption: !!msg.caption,
  });

  if (!telegramId) {
    logWarning('Photo message without telegramId', { chatId });
    return;
  }

  if (!msg.photo || msg.photo.length === 0) {
    logWarning('Photo message handler called but no photo found', { chatId, telegramId });
    return;
  }

  let lang = await getUserLanguageByTelegramId(telegramId);

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (!user) {
      await bot.sendMessage(chatId, t('verify.not_verified', lang), { parse_mode: 'Markdown' });
      return;
    }

    lang = await getUserLanguageByUserId(user.id);

    // 🎯 Smart API key selection for OCR (Claude Vision)
    let ocrApiKey;
    let ocrBillingMode;

    try {
      const apiKeyInfo = await getApiKey(user.id, 'ocr');
      ocrApiKey = apiKeyInfo.key;
      ocrBillingMode = apiKeyInfo;
    } catch (error) {
      if (error instanceof BillingError && error.code === 'INSUFFICIENT_CREDITS') {
        await bot.sendMessage(
          chatId,
          t('receipt.no_credits', lang) ||
          '❌ No credits remaining. Purchase more at /app/settings/billing or add your own Anthropic API key.',
          { parse_mode: 'Markdown' }
        );
        return;
      }
      throw error;
    }

    const photo = msg.photo[msg.photo.length - 1];

    await bot.sendMessage(chatId, t('receipt.processing', lang));

    const file = await bot.getFile(photo.file_id);
    
    if (!file.file_path) {
      logError('Failed to get file path from Telegram', new Error('file.file_path is missing'), {
        userId: user.id,
        chatId,
        fileId: photo.file_id
      });
      await bot.sendMessage(chatId, t('receipt.error', lang), { parse_mode: 'Markdown' });
      return;
    }

    // Determine MIME type from file extension
    const fileExtension = file.file_path.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif'
    };
    const mimeType = mimeTypeMap[fileExtension] || 'image/jpeg';

    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`;

    logInfo('Downloading photo from Telegram', {
      userId: user.id,
      filePath: file.file_path,
      mimeType,
      fileSize: file.file_size
    });

    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      logError('Failed to download photo from Telegram', new Error(`HTTP ${response.status}: ${response.statusText}`), {
        userId: user.id,
        chatId,
        status: response.status,
        statusText: response.statusText,
        fileUrl
      });
      await bot.sendMessage(chatId, t('receipt.error', lang), { parse_mode: 'Markdown' });
      return;
    }

    const buffer = await response.arrayBuffer();
    
    if (!buffer || buffer.byteLength === 0) {
      logError('Empty buffer received from Telegram', new Error('Buffer is empty'), {
        userId: user.id,
        chatId,
        filePath: file.file_path
      });
      await bot.sendMessage(chatId, t('receipt.error', lang), { parse_mode: 'Markdown' });
      return;
    }

    const base64 = Buffer.from(buffer).toString('base64');

    logInfo('Processing receipt image with OCR', {
      userId: user.id,
      imageSize: buffer.byteLength,
      mimeType
    });

    // Process receipt with Claude Vision (using smart-routed API key)
    const parsed = await processReceiptImage(user.id, base64, ocrApiKey, mimeType);

    // 💳 Charge credits for OCR
    if (ocrBillingMode.shouldCharge) {
      await chargeCredits(
        user.id,
        'ocr',
        ocrBillingMode.provider,
        { input: 1500, output: 200 }, // Typical token count for receipt OCR
        ocrBillingMode.billingMode === 'free'
      );
    }

    if (!parsed) {
      await bot.sendMessage(chatId, t('receipt.error', lang), {
        parse_mode: 'Markdown'
      });
      return;
    }

    // Resolve category using category resolution service
    const categoryId = await resolveCategoryId(user.id, parsed.category);

    // Get user's custom exchange rates
    const rates = await getUserExchangeRates(user.id);
    const amountUsd = convertToUSD(parsed.amount, parsed.currency, rates);

    // Store receipt data temporarily and get short ID
    const receiptId = pendingReceipts.store({
      parsed,
      categoryId,
      userId: user.id
    });

    const confirmMessage =
      `${t('receipt.extracted', lang)}\n\n` +
      `${t('transaction.amount', lang)}: ${formatCurrency(parsed.amount, parsed.currency)}\n` +
      `${t('transaction.description', lang)}: ${parsed.description}\n` +
      `${t('transaction.category', lang)}: ${parsed.category}\n\n` +
      `${t('receipt.confirm_question', lang)}`;

    await bot.sendMessage(chatId, confirmMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: t('receipt.confirm_button', lang), callback_data: `confirm_receipt:${receiptId}` },
            { text: t('receipt.cancel_button', lang), callback_data: 'cancel_receipt' }
          ]
        ]
      }
    });

  } catch (error) {
    const { logError } = await import('../../lib/logger');
    logError('Photo message handling error', error as Error, {
      chatId,
      telegramId: telegramId || 'missing',
      userId: (error as any)?.userId
    });
    
    const lang = await getUserLanguageByTelegramId(telegramId || '');
    try {
      await bot.sendMessage(chatId, t('error.receipt', lang));
    } catch (sendError) {
      logError('Failed to send error message to user', sendError as Error, { chatId });
    }
  }
}

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

export async function handlePhotoMessage(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  if (!telegramId || !msg.photo || msg.photo.length === 0) {
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

    // Check if user has Anthropic API key for OCR (using storage for consistency)
    const userSettings = await storage.getSettingsByUserId(user.id);

    if (!userSettings?.anthropicApiKey) {
      await bot.sendMessage(chatId, t('receipt.no_api_key', lang), {
        parse_mode: 'Markdown'
      });
      return;
    }

    const photo = msg.photo[msg.photo.length - 1];

    await bot.sendMessage(chatId, t('receipt.processing', lang));

    const file = await bot.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    const parsed = await processReceiptImage(user.id, base64);

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
    console.error('Photo message handling error:', error);
    const lang = await getUserLanguageByTelegramId(telegramId);
    await bot.sendMessage(chatId, t('error.receipt', lang));
  }
}

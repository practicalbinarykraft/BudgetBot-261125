import TelegramBot from 'node-telegram-bot-api';
import { db } from '../db';
import { users, telegramVerificationCodes, wallets, transactions, categories, settings } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { parseTransactionText, formatCurrency } from './parser';
import { processReceiptImage } from './ocr';
import { t, getWelcomeMessage, getHelpMessage, type Language } from './i18n';
import { getUserLanguageByTelegramId, getUserLanguageByUserId } from './language';
import { convertToUSD } from '../services/currency-service';
import { format } from 'date-fns';

export async function handleStartCommand(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  
  const lang = telegramId ? await getUserLanguageByTelegramId(telegramId) : 'en';
  
  await bot.sendMessage(chatId, getWelcomeMessage(lang), { parse_mode: 'Markdown' });
}

export async function handleVerifyCommand(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  code: string
) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  const telegramUsername = msg.from?.username || null;

  // Try to get user's language (fallback to 'en' if not possible yet)
  let lang = telegramId ? await getUserLanguageByTelegramId(telegramId) : 'en';

  if (!telegramId) {
    await bot.sendMessage(chatId, t('verify.no_telegram_id', lang));
    return;
  }

  if (!code || code.length !== 6) {
    await bot.sendMessage(chatId, t('verify.invalid_format', lang), {
      parse_mode: 'Markdown'
    });
    return;
  }

  try {
    const [verificationRecord] = await db
      .select()
      .from(telegramVerificationCodes)
      .where(
        and(
          eq(telegramVerificationCodes.code, code),
          eq(telegramVerificationCodes.isUsed, false),
          sql`${telegramVerificationCodes.expiresAt} > NOW()`
        )
      )
      .limit(1);

    if (!verificationRecord) {
      await bot.sendMessage(chatId, t('verify.invalid_code', lang));
      return;
    }

    await db
      .update(users)
      .set({
        telegramId,
        telegramUsername,
      })
      .where(eq(users.id, verificationRecord.userId));

    await db
      .update(telegramVerificationCodes)
      .set({ isUsed: true })
      .where(eq(telegramVerificationCodes.id, verificationRecord.id));

    // Re-fetch settings after connection to get user's preferred language
    lang = await getUserLanguageByTelegramId(telegramId);

    await bot.sendMessage(chatId, t('verify.success', lang), { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Verification error:', error);
    await bot.sendMessage(chatId, t('error.generic', lang));
  }
}

export async function handleHelpCommand(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  
  const lang = telegramId ? await getUserLanguageByTelegramId(telegramId) : 'en';
  
  await bot.sendMessage(chatId, getHelpMessage(lang), { parse_mode: 'Markdown' });
}

export async function handleBalanceCommand(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  let lang = telegramId ? await getUserLanguageByTelegramId(telegramId) : 'en';

  if (!telegramId) {
    await bot.sendMessage(chatId, t('verify.no_telegram_id', lang));
    return;
  }

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

    const userWallets = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, user.id));

    if (userWallets.length === 0) {
      await bot.sendMessage(chatId, `${t('balance.title', lang)}\n\n${t('balance.no_wallets', lang)}`, {
        parse_mode: 'Markdown'
      });
      return;
    }

    let message = `${t('balance.title', lang)}\n\n`;
    let totalUSD = 0;

    for (const wallet of userWallets) {
      const balance = parseFloat(wallet.balance);
      const currency = wallet.currency || 'USD';
      message += `📊 *${wallet.name}*\n`;
      message += `   ${formatCurrency(balance, currency as any)}\n\n`;
      
      totalUSD += parseFloat(wallet.balanceUsd || '0');
    }

    message += `\n${t('balance.total', lang)} $${totalUSD.toFixed(2)}`;

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Balance command error:', error);
    const lang = await getUserLanguageByTelegramId(telegramId);
    await bot.sendMessage(chatId, t('error.balance', lang));
  }
}

export async function handleTextMessage(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  const text = msg.text;

  if (!telegramId || !text) {
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

    // Pre-parse validation for better error messages
    const trimmedText = text.trim();
    
    // Check 1: Empty text
    if (trimmedText.length === 0) {
      await bot.sendMessage(chatId, t('transaction.parse_error_empty', lang), {
        parse_mode: 'Markdown'
      });
      return;
    }

    // Check 2: No amount found
    const amountRegex = /(\d+(?:[.,]\d+)?)/;
    if (!amountRegex.test(trimmedText)) {
      await bot.sendMessage(chatId, t('transaction.parse_error_no_amount', lang), {
        parse_mode: 'Markdown'
      });
      return;
    }

    const parsed = parseTransactionText(text);

    // Check 3: Invalid amount (negative or zero)
    if (!parsed) {
      await bot.sendMessage(chatId, t('transaction.parse_error_invalid_amount', lang), {
        parse_mode: 'Markdown'
      });
      return;
    }

    const userCategories = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.userId, user.id),
          eq(categories.name, parsed.category)
        )
      )
      .limit(1);

    const categoryId = userCategories[0]?.id || null;

    const amountUsd = convertToUSD(parsed.amount, parsed.currency);

    const [transaction] = await db
      .insert(transactions)
      .values({
        userId: user.id,
        date: format(new Date(), 'yyyy-MM-dd'),
        type: parsed.type,
        amount: parsed.amount.toString(),
        description: parsed.description,
        categoryId,
        currency: parsed.currency,
        amountUsd: amountUsd.toString(),
        originalAmount: parsed.amount.toString(),
        originalCurrency: parsed.currency,
        exchangeRate: (parsed.amount / amountUsd).toFixed(4),
        source: 'telegram',
        walletId: null,
      })
      .returning();

    const emoji = parsed.type === 'income' ? '💰' : '💸';
    const messageKey = parsed.type === 'income' ? 'transaction.income_added' : 'transaction.expense_added';
    
    await bot.sendMessage(
      chatId,
      `${t(messageKey, lang)}\n\n` +
      `${t('transaction.amount', lang)}: ${formatCurrency(parsed.amount, parsed.currency)}\n` +
      `${t('transaction.description', lang)}: ${parsed.description}\n` +
      `${t('transaction.category', lang)}: ${parsed.category}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Text message handling error:', error);
    const lang = await getUserLanguageByTelegramId(telegramId);
    await bot.sendMessage(chatId, t('error.transaction', lang));
  }
}

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

    const photo = msg.photo[msg.photo.length - 1];
    
    await bot.sendMessage(chatId, t('receipt.processing', lang));

    const file = await bot.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    const parsed = await processReceiptImage(base64);

    if (!parsed) {
      await bot.sendMessage(chatId, t('receipt.error', lang), {
        parse_mode: 'Markdown'
      });
      return;
    }

    const userCategories = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.userId, user.id),
          eq(categories.name, parsed.category)
        )
      )
      .limit(1);

    const categoryId = userCategories[0]?.id || null;

    const amountUsd = convertToUSD(parsed.amount, parsed.currency);

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
            { text: t('receipt.confirm_button', lang), callback_data: `confirm_receipt:${JSON.stringify({ parsed, categoryId, amountUsd })}` },
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

export async function handleLanguageCommand(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  let lang = telegramId ? await getUserLanguageByTelegramId(telegramId) : 'en';

  if (!telegramId) {
    await bot.sendMessage(chatId, t('verify.no_telegram_id', lang));
    return;
  }

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

    await bot.sendMessage(chatId, `${t('language.current', lang)}: ${t(`language.${lang}`, lang)}\n\n${t('language.choose', lang)}`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: t('language.en', lang), callback_data: 'set_language:en' },
            { text: t('language.ru', lang), callback_data: 'set_language:ru' }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Language command error:', error);
    await bot.sendMessage(chatId, t('error.generic', lang));
  }
}

export async function handleCallbackQuery(bot: TelegramBot, query: TelegramBot.CallbackQuery) {
  const chatId = query.message?.chat.id;
  const telegramId = query.from.id.toString();

  if (!chatId || !query.data) {
    return;
  }

  try {
    let lang = await getUserLanguageByTelegramId(telegramId);

    // Handle language change
    if (query.data?.startsWith('set_language:')) {
      const newLang = query.data.substring('set_language:'.length) as Language;
      
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.telegramId, telegramId))
        .limit(1);

      if (!user) {
        await bot.answerCallbackQuery(query.id, { text: t('error.user_not_found', lang) });
        return;
      }

      lang = await getUserLanguageByUserId(user.id);

      // Check if settings exist, create if not
      const [existingSettings] = await db
        .select()
        .from(settings)
        .where(eq(settings.userId, user.id))
        .limit(1);

      if (existingSettings) {
        await db
          .update(settings)
          .set({ language: newLang })
          .where(eq(settings.userId, user.id));
      } else {
        await db
          .insert(settings)
          .values({
            userId: user.id,
            language: newLang,
          });
      }

      await bot.editMessageText(t('language.changed', newLang), {
        chat_id: chatId,
        message_id: query.message?.message_id,
      });
      await bot.answerCallbackQuery(query.id);
      return;
    }

    if (query.data === 'cancel_receipt') {
      await bot.editMessageText(t('receipt.cancelled', lang), {
        chat_id: chatId,
        message_id: query.message?.message_id,
      });
      await bot.answerCallbackQuery(query.id);
      return;
    }

    if (query.data.startsWith('confirm_receipt:')) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.telegramId, telegramId))
        .limit(1);

      if (!user) {
        await bot.answerCallbackQuery(query.id, { text: t('error.user_not_found', lang) });
        return;
      }

      lang = await getUserLanguageByUserId(user.id);

      const dataStr = query.data.substring('confirm_receipt:'.length);
      const { parsed, categoryId, amountUsd } = JSON.parse(dataStr);

      await db
        .insert(transactions)
        .values({
          userId: user.id,
          date: format(new Date(), 'yyyy-MM-dd'),
          type: 'expense',
          amount: parsed.amount.toString(),
          description: parsed.description,
          categoryId,
          currency: parsed.currency,
          amountUsd: amountUsd.toString(),
          originalAmount: parsed.amount.toString(),
          originalCurrency: parsed.currency,
          exchangeRate: (parsed.amount / amountUsd).toFixed(4),
          source: 'ocr',
          walletId: null,
        });

      await bot.editMessageText(
        `${t('transaction.expense_added', lang)}\n\n` +
        `${t('transaction.amount', lang)}: ${formatCurrency(parsed.amount, parsed.currency)}\n` +
        `${t('transaction.description', lang)}: ${parsed.description}\n` +
        `${t('transaction.category', lang)}: ${parsed.category}`,
        {
          chat_id: chatId,
          message_id: query.message?.message_id,
          parse_mode: 'Markdown'
        }
      );

      await bot.answerCallbackQuery(query.id, { text: t('receipt.added', lang) });
    }
  } catch (error) {
    console.error('Callback query handling error:', error);
    const lang = await getUserLanguageByTelegramId(telegramId);
    await bot.answerCallbackQuery(query.id, { text: t('error.generic', lang) });
  }
}

export async function handleLastCommand(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  if (!telegramId) {
    await bot.sendMessage(chatId, t('verify.no_telegram_id', 'en'));
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

    const userTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, user.id))
      .orderBy(sql`${transactions.date} DESC, ${transactions.id} DESC`)
      .limit(5);

    if (userTransactions.length === 0) {
      await bot.sendMessage(chatId, t('last.no_transactions', lang), {
        parse_mode: 'Markdown'
      });
      return;
    }

    let message = `${t('last.title', lang)}\n\n`;

    for (const tx of userTransactions) {
      const typeText = tx.type === 'income' ? t('last.income', lang) : t('last.expense', lang);
      const formattedDate = format(new Date(tx.date), 'MMM dd');
      const amount = formatCurrency(parseFloat(tx.originalAmount || tx.amount), (tx.originalCurrency || tx.currency) as 'USD' | 'RUB' | 'IDR');
      
      message += `${typeText}\n`;
      message += `📅 ${formattedDate} • ${tx.description}\n`;
      message += `💵 ${amount}\n\n`;
    }

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Last command error:', error);
    const lang = await getUserLanguageByTelegramId(telegramId);
    await bot.sendMessage(chatId, t('error.generic', lang));
  }
}

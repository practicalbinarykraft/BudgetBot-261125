import TelegramBot from 'node-telegram-bot-api';
import { db } from '../db';
import { users, telegramVerificationCodes, wallets, transactions, categories } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { parseTransactionText, formatCurrency } from './parser';
import { processReceiptImage } from './ocr';
import {
  WELCOME_TEXT,
  VERIFICATION_SUCCESS_TEXT,
  NOT_VERIFIED_TEXT,
  HELP_TEXT,
} from './config';
import { convertToUSD } from '../services/currency-service';
import { format } from 'date-fns';

export async function handleStartCommand(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, WELCOME_TEXT, { parse_mode: 'Markdown' });
}

export async function handleVerifyCommand(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  code: string
) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  const telegramUsername = msg.from?.username || null;

  if (!telegramId) {
    await bot.sendMessage(chatId, '❌ Could not identify your Telegram account.');
    return;
  }

  if (!code || code.length !== 6) {
    await bot.sendMessage(chatId, '❌ Invalid code format. Please use a 6-digit code.\n\nExample: `/verify 123456`', {
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
      await bot.sendMessage(chatId, '❌ Invalid or expired verification code.\n\nPlease generate a new code in Budget Buddy Settings.');
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

    await bot.sendMessage(chatId, VERIFICATION_SUCCESS_TEXT, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Verification error:', error);
    await bot.sendMessage(chatId, '❌ An error occurred. Please try again later.');
  }
}

export async function handleHelpCommand(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, HELP_TEXT, { parse_mode: 'Markdown' });
}

export async function handleBalanceCommand(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  if (!telegramId) {
    await bot.sendMessage(chatId, '❌ Could not identify your Telegram account.');
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (!user) {
      await bot.sendMessage(chatId, NOT_VERIFIED_TEXT, { parse_mode: 'Markdown' });
      return;
    }

    const userWallets = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, user.id));

    if (userWallets.length === 0) {
      await bot.sendMessage(chatId, '💰 *Your Wallets*\n\nNo wallets found. Create one in Budget Buddy!', {
        parse_mode: 'Markdown'
      });
      return;
    }

    let message = '💰 *Your Wallets*\n\n';
    let totalUSD = 0;

    for (const wallet of userWallets) {
      const balance = parseFloat(wallet.balance);
      const currency = wallet.currency || 'USD';
      message += `📊 *${wallet.name}*\n`;
      message += `   ${formatCurrency(balance, currency as any)}\n\n`;
      
      totalUSD += parseFloat(wallet.balanceUsd || '0');
    }

    message += `\n💵 *Total (USD):* $${totalUSD.toFixed(2)}`;

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Balance command error:', error);
    await bot.sendMessage(chatId, '❌ An error occurred while fetching your balance.');
  }
}

export async function handleTextMessage(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  const text = msg.text;

  if (!telegramId || !text) {
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (!user) {
      await bot.sendMessage(chatId, NOT_VERIFIED_TEXT, { parse_mode: 'Markdown' });
      return;
    }

    const parsed = parseTransactionText(text);

    if (!parsed) {
      await bot.sendMessage(chatId, '❌ Could not parse transaction.\n\nExample: `100 coffee` or `1500₽ taxi`', {
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
    const typeText = parsed.type === 'income' ? 'Income' : 'Expense';
    
    await bot.sendMessage(
      chatId,
      `${emoji} *${typeText} added!*\n\n` +
      `Amount: ${formatCurrency(parsed.amount, parsed.currency)}\n` +
      `Description: ${parsed.description}\n` +
      `Category: ${parsed.category}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Text message handling error:', error);
    await bot.sendMessage(chatId, '❌ An error occurred while processing your transaction.');
  }
}

export async function handlePhotoMessage(bot: TelegramBot, msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  if (!telegramId || !msg.photo || msg.photo.length === 0) {
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (!user) {
      await bot.sendMessage(chatId, NOT_VERIFIED_TEXT, { parse_mode: 'Markdown' });
      return;
    }

    const photo = msg.photo[msg.photo.length - 1];
    
    await bot.sendMessage(chatId, '🔍 Processing receipt...');

    const file = await bot.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    const parsed = await processReceiptImage(base64);

    if (!parsed) {
      await bot.sendMessage(chatId, '❌ Could not extract information from receipt.\n\nPlease try:\n• Better lighting\n• Clearer photo\n• Or enter manually: `100 coffee`', {
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
      `📝 *Receipt extracted:*\n\n` +
      `Amount: ${formatCurrency(parsed.amount, parsed.currency)}\n` +
      `Description: ${parsed.description}\n` +
      `Category: ${parsed.category}\n\n` +
      `Confirm to add this expense?`;

    await bot.sendMessage(chatId, confirmMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Confirm', callback_data: `confirm_receipt:${JSON.stringify({ parsed, categoryId, amountUsd })}` },
            { text: '❌ Cancel', callback_data: 'cancel_receipt' }
          ]
        ]
      }
    });

  } catch (error) {
    console.error('Photo message handling error:', error);
    await bot.sendMessage(chatId, '❌ An error occurred while processing your receipt.');
  }
}

export async function handleCallbackQuery(bot: TelegramBot, query: TelegramBot.CallbackQuery) {
  const chatId = query.message?.chat.id;
  const telegramId = query.from.id.toString();

  if (!chatId || !query.data) {
    return;
  }

  try {
    if (query.data === 'cancel_receipt') {
      await bot.editMessageText('❌ Receipt cancelled.', {
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
        await bot.answerCallbackQuery(query.id, { text: 'User not found' });
        return;
      }

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
        `💸 *Expense added!*\n\n` +
        `Amount: ${formatCurrency(parsed.amount, parsed.currency)}\n` +
        `Description: ${parsed.description}\n` +
        `Category: ${parsed.category}`,
        {
          chat_id: chatId,
          message_id: query.message?.message_id,
          parse_mode: 'Markdown'
        }
      );

      await bot.answerCallbackQuery(query.id, { text: 'Transaction added!' });
    }
  } catch (error) {
    console.error('Callback query handling error:', error);
    await bot.answerCallbackQuery(query.id, { text: 'An error occurred' });
  }
}

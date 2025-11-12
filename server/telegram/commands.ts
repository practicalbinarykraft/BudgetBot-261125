import TelegramBot from 'node-telegram-bot-api';
import { db } from '../db';
import { users, telegramVerificationCodes, wallets, transactions, categories, settings, budgets } from '@shared/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { parseTransactionText, formatCurrency } from './parser';
import { processReceiptImage } from './ocr';
import { t, getWelcomeMessage, getHelpMessage, type Language } from './i18n';
import { getUserLanguageByTelegramId, getUserLanguageByUserId } from './language';
import { convertToUSD, getUserExchangeRates } from '../services/currency-service';
import { resolveCategoryId } from '../services/category-resolution.service';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

async function formatTransactionMessage(
  userId: number,
  transactionId: number,
  amount: number,
  currency: string,
  amountUsd: number,
  description: string,
  categoryId: number | null,
  type: 'income' | 'expense',
  lang: Language
): Promise<{ message: string; reply_markup?: TelegramBot.InlineKeyboardMarkup }> {
  const userWallets = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId));

  const totalCapital = userWallets.reduce(
    (sum, w) => sum + parseFloat(w.balanceUsd as unknown as string || "0"),
    0
  );

  const exchangeRate = currency === 'USD' ? 1 : (amount / amountUsd);
  
  let budgetInfo = '';
  let categoryName = t('transaction.no_category', lang);
  
  // Load category by ID if provided
  if (categoryId) {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(
        eq(categories.userId, userId),
        eq(categories.id, categoryId)
      ))
      .limit(1);

    if (category) {
      categoryName = category.name;
      
      const today = new Date();
      const budgetList = await db
        .select()
        .from(budgets)
        .where(and(
          eq(budgets.userId, userId),
          eq(budgets.categoryId, category.id)
        ));

      for (const budget of budgetList) {
        let startDate: Date, endDate: Date;
        
        if (budget.period === 'week') {
          startDate = startOfWeek(today, { weekStartsOn: 1 });
          endDate = endOfWeek(today, { weekStartsOn: 1 });
        } else if (budget.period === 'month') {
          startDate = startOfMonth(today);
          endDate = endOfMonth(today);
        } else {
          startDate = startOfYear(today);
          endDate = endOfYear(today);
        }

        const startStr = format(startDate, 'yyyy-MM-dd');
        const endStr = format(endDate, 'yyyy-MM-dd');

        const [result] = await db
          .select({
            total: sql<string>`COALESCE(SUM(CAST(${transactions.amountUsd} AS DECIMAL)), 0)`
          })
          .from(transactions)
          .where(and(
            eq(transactions.userId, userId),
            eq(transactions.categoryId, category.id),
            eq(transactions.type, 'expense'),
            gte(transactions.date, startStr),
            lte(transactions.date, endStr)
          ));

        const spent = parseFloat(result?.total || '0');
        const limit = parseFloat(budget.limitAmount);
        
        budgetInfo = `\n${t('transaction.budget_limit', lang)}: $${spent.toFixed(0)}/$${limit.toFixed(0)}`;
        break;
      }
    }
  }

  const typeLabel = type === 'income' 
    ? t('transaction.income_added', lang)
    : t('transaction.expense_added', lang);

  let message = `${typeLabel}\n\n`;
  message += `${t('transaction.description', lang)}: ${description}\n`;
  message += `${t('transaction.category', lang)}: ${categoryName}\n`;
  message += `${t('transaction.amount', lang)}: ${formatCurrency(amount, currency as 'USD' | 'RUB' | 'IDR')}\n`;
  
  if (currency !== 'USD') {
    message += `\n${t('transaction.conversion', lang)}: 1 USD = ${exchangeRate.toFixed(2)} ${currency}\n`;
    message += `${t('transaction.usd_amount', lang)}: ~$${amountUsd.toFixed(0)}`;
  }
  
  message += `\n\n${t('transaction.total_capital', lang)}: $${totalCapital.toFixed(0)}`;
  
  if (budgetInfo) {
    message += budgetInfo;
  }

  const reply_markup: TelegramBot.InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: t('transaction.edit_button', lang), callback_data: `edit_transaction:${transactionId}` },
        { text: t('transaction.delete_button', lang), callback_data: `delete_transaction:${transactionId}` }
      ]
    ]
  };

  return { message, reply_markup };
}

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

    // Resolve category using category resolution service
    const categoryId = await resolveCategoryId(user.id, parsed.category);

    // Get user's custom exchange rates
    const rates = await getUserExchangeRates(user.id);
    const amountUsd = convertToUSD(parsed.amount, parsed.currency, rates);
    const exchangeRate = parsed.currency === 'USD' ? 1 : rates[parsed.currency] || 1;

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
        amountUsd: amountUsd.toFixed(2),
        originalAmount: parsed.amount.toString(),
        originalCurrency: parsed.currency,
        exchangeRate: exchangeRate.toFixed(4),
        source: 'telegram',
        walletId: null,
      })
      .returning();

    const { message, reply_markup } = await formatTransactionMessage(
      user.id,
      transaction.id,
      parsed.amount,
      parsed.currency,
      amountUsd,
      parsed.description,
      categoryId,
      parsed.type,
      lang
    );
    
    await bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      reply_markup 
    });
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

    // Resolve category using category resolution service
    const categoryId = await resolveCategoryId(user.id, parsed.category);

    // Get user's custom exchange rates
    const rates = await getUserExchangeRates(user.id);
    const amountUsd = convertToUSD(parsed.amount, parsed.currency, rates);

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
            { text: t('receipt.confirm_button', lang), callback_data: `confirm_receipt:${JSON.stringify({ parsed, categoryId, userId: user.id })}` },
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
      const { parsed, categoryId, userId } = JSON.parse(dataStr);

      // Recalculate with fresh user rates
      const rates = await getUserExchangeRates(user.id);
      const amountUsd = convertToUSD(parsed.amount, parsed.currency, rates);
      const exchangeRate = parsed.currency === 'USD' ? 1 : rates[parsed.currency] || 1;

      const [transaction] = await db
        .insert(transactions)
        .values({
          userId: user.id,
          date: format(new Date(), 'yyyy-MM-dd'),
          type: 'expense',
          amount: parsed.amount.toString(),
          description: parsed.description,
          categoryId,
          currency: parsed.currency,
          amountUsd: amountUsd.toFixed(2),
          originalAmount: parsed.amount.toString(),
          originalCurrency: parsed.currency,
          exchangeRate: exchangeRate.toFixed(4),
          source: 'ocr',
          walletId: null,
        })
        .returning();

      const { message, reply_markup } = await formatTransactionMessage(
        user.id,
        transaction.id,
        parsed.amount,
        parsed.currency,
        amountUsd,
        parsed.description,
        categoryId,
        'expense',
        lang
      );

      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        parse_mode: 'Markdown',
        reply_markup
      });

      await bot.answerCallbackQuery(query.id, { text: t('receipt.added', lang) });
    }

    if (query.data === 'cancel_income') {
      await bot.editMessageText(t('income.cancelled', lang), {
        chat_id: chatId,
        message_id: query.message?.message_id,
      });
      await bot.answerCallbackQuery(query.id);
      return;
    }

    if (query.data.startsWith('confirm_income:')) {
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

      const dataStr = query.data.substring('confirm_income:'.length);
      const { parsed, categoryId, userId } = JSON.parse(dataStr);

      // Recalculate with fresh user rates
      const rates = await getUserExchangeRates(user.id);
      const amountUsd = convertToUSD(parsed.amount, parsed.currency, rates);
      const exchangeRate = parsed.currency === 'USD' ? 1 : rates[parsed.currency] || 1;

      const [transaction] = await db
        .insert(transactions)
        .values({
          userId: user.id,
          date: format(new Date(), 'yyyy-MM-dd'),
          type: 'income',
          amount: parsed.amount.toString(),
          description: parsed.description,
          categoryId,
          currency: parsed.currency,
          amountUsd: amountUsd.toFixed(2),
          originalAmount: parsed.amount.toString(),
          originalCurrency: parsed.currency,
          exchangeRate: exchangeRate.toFixed(4),
          source: 'telegram',
          walletId: null,
        })
        .returning();

      const { message, reply_markup } = await formatTransactionMessage(
        user.id,
        transaction.id,
        parsed.amount,
        parsed.currency,
        amountUsd,
        parsed.description,
        categoryId,
        'income',
        lang
      );

      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        parse_mode: 'Markdown',
        reply_markup
      });

      await bot.answerCallbackQuery(query.id, { text: t('transaction.income_added', lang) });
    }

    if (query.data.startsWith('delete_transaction:')) {
      const transactionId = parseInt(query.data.substring('delete_transaction:'.length));

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

      await bot.editMessageText(t('transaction.delete_confirm', lang), {
        chat_id: chatId,
        message_id: query.message?.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: t('transaction.delete_yes', lang), callback_data: `confirm_delete:${transactionId}` },
              { text: t('transaction.delete_no', lang), callback_data: `cancel_delete:${transactionId}` }
            ]
          ]
        }
      });

      await bot.answerCallbackQuery(query.id);
    }

    if (query.data.startsWith('confirm_delete:')) {
      const transactionId = parseInt(query.data.substring('confirm_delete:'.length));

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

      await db
        .delete(transactions)
        .where(and(
          eq(transactions.id, transactionId),
          eq(transactions.userId, user.id)
        ));

      await bot.editMessageText(t('transaction.deleted', lang), {
        chat_id: chatId,
        message_id: query.message?.message_id,
      });

      await bot.answerCallbackQuery(query.id, { text: t('transaction.deleted', lang) });
    }

    if (query.data.startsWith('cancel_delete:')) {
      await bot.deleteMessage(chatId, query.message?.message_id || 0);
      await bot.answerCallbackQuery(query.id);
    }

    if (query.data.startsWith('edit_transaction:')) {
      const transactionId = parseInt(query.data.substring('edit_transaction:'.length));

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

      await bot.editMessageText(
        t('transaction.edit_coming_soon', lang),
        {
          chat_id: chatId,
          message_id: query.message?.message_id,
        }
      );

      await bot.answerCallbackQuery(query.id, { text: t('transaction.edit_coming_soon', lang) });
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

export async function handleStatusCommand(bot: TelegramBot, msg: TelegramBot.Message) {
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
      await bot.sendMessage(chatId, t('status.not_connected', lang), { parse_mode: 'Markdown' });
      return;
    }

    lang = await getUserLanguageByUserId(user.id);

    const languageDisplay = lang === 'en' ? 'English 🇬🇧' : 'Русский 🇷🇺';
    const username = user.telegramUsername || telegramId;

    const message = t('status.connected', lang)
      .replace('{name}', user.name)
      .replace('{username}', username)
      .replace('{language}', languageDisplay);

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Status command error:', error);
    const lang = await getUserLanguageByTelegramId(telegramId);
    await bot.sendMessage(chatId, t('error.generic', lang));
  }
}

export async function handleIncomeCommand(bot: TelegramBot, msg: TelegramBot.Message, text: string) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  if (!telegramId) {
    await bot.sendMessage(chatId, t('verify.no_telegram_id', 'en'));
    return;
  }

  let lang = await getUserLanguageByTelegramId(telegramId);

  if (!text || text.trim().length === 0) {
    await bot.sendMessage(chatId, t('income.usage', lang), { parse_mode: 'Markdown' });
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

    const parsed = parseTransactionText(text);

    if (!parsed) {
      await bot.sendMessage(chatId, t('income.usage', lang), { parse_mode: 'Markdown' });
      return;
    }

    parsed.type = 'income';

    // Resolve category using category resolution service
    const categoryId = await resolveCategoryId(user.id, parsed.category);
    
    // Get user's custom exchange rates
    const rates = await getUserExchangeRates(user.id);
    const amountUsd = convertToUSD(parsed.amount, parsed.currency, rates);

    const dataPayload = {
      parsed,
      categoryId,
      amountUsd,
      userId: user.id // Pass userId to recalculate in callback
    };

    await bot.sendMessage(
      chatId,
      `💰 *${t('transaction.income', lang)}*\n\n` +
      `${t('transaction.amount', lang)}: ${formatCurrency(parsed.amount, parsed.currency)}\n` +
      `${t('transaction.description', lang)}: ${parsed.description}\n` +
      `${t('transaction.category', lang)}: ${parsed.category}\n\n` +
      `${t('income.confirm_question', lang)}`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: t('income.confirm_button', lang), callback_data: `confirm_income:${JSON.stringify(dataPayload)}` },
            { text: t('income.cancel_button', lang), callback_data: 'cancel_income' }
          ]]
        }
      }
    );
  } catch (error) {
    console.error('Income command error:', error);
    const lang = await getUserLanguageByTelegramId(telegramId);
    await bot.sendMessage(chatId, t('error.generic', lang));
  }
}

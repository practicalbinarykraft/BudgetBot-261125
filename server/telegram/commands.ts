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
import { getPrimaryWallet, updateWalletBalance } from '../services/wallet.service';
import { storage } from '../storage';
import { pendingReceipts } from './pending-receipts';
import { pendingEdits } from './pending-edits';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ReceiptItemsRepository } from '../repositories/receipt-items.repository';
import { parseShoppingList, isShoppingList } from './shopping-list-parser';

async function formatTransactionMessage(
  userId: number,
  transactionId: number,
  amount: number,
  currency: string,
  amountUsd: number,
  description: string,
  categoryId: number | null,
  type: 'income' | 'expense',
  lang: Language,
  items?: any[]  // Receipt items (optional)
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
  
  // Show capital change
  const delta = type === 'expense' ? -amountUsd : amountUsd;
  const deltaSign = delta > 0 ? '+' : '';
  message += `\n\n${t('transaction.total_capital', lang)}: $${totalCapital.toFixed(0)} (${deltaSign}$${delta.toFixed(0)})`;
  
  if (budgetInfo) {
    message += budgetInfo;
  }

  // Add receipt items if available
  if (items && items.length > 0) {
    const currencySymbol = currency === 'IDR' ? 'Rp' : currency === 'RUB' ? '₽' : '$';
    message += '\n\n🛒 ' + (lang === 'ru' ? 'Товары' : 'Items') + ':\n';
    
    const displayItems = items.slice(0, 5);
    for (const item of displayItems) {
      const price = parseFloat(item.totalPrice || item.pricePerUnit || 0);
      const formattedPrice = price.toLocaleString('en-US', { maximumFractionDigits: 0 });
      message += `• ${item.name} - ${currencySymbol}${formattedPrice}\n`;
    }
    
    if (items.length > 5) {
      const remaining = items.length - 5;
      const andMore = lang === 'ru' ? `... и ещё ${remaining}` : `... and ${remaining} more`;
      message += andMore + '\n';
    }
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
  
  // ALWAYS send welcome message first (for both verified and unverified users)
  await bot.sendMessage(chatId, getWelcomeMessage(lang), { parse_mode: 'Markdown' });
  
  // Show main menu ONLY if user is already verified
  if (telegramId) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);
    
    if (user) {
      const { getMainMenuKeyboard, getMainMenuHint } = await import('./menu/keyboards');
      
      await bot.sendMessage(chatId, getMainMenuHint(lang), {
        parse_mode: 'Markdown',
        reply_markup: getMainMenuKeyboard()
      });
    }
  }
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
    
    // Показать главное меню после успешной верификации
    const { getMainMenuKeyboard, getMainMenuHint } = await import('./menu/keyboards');
    
    await bot.sendMessage(chatId, getMainMenuHint(lang), {
      parse_mode: 'Markdown',
      reply_markup: getMainMenuKeyboard()
    });
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

    // Get user's default currency from settings
    const [userSettings] = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, user.id))
      .limit(1);
    
    const defaultCurrency = (userSettings?.currency || 'USD') as 'USD' | 'RUB' | 'IDR';

    // Check if user is editing a transaction
    const pendingEdit = pendingEdits.get(telegramId);
    if (pendingEdit) {
      const parsed = parseTransactionText(text, defaultCurrency);

      if (!parsed) {
        await bot.sendMessage(chatId, t('transaction.parse_error', lang), {
          parse_mode: 'Markdown'
        });
        return;
      }

      // Get user's exchange rates
      const rates = await getUserExchangeRates(user.id);
      const newAmountUsd = convertToUSD(parsed.amount, parsed.currency, rates);
      const newExchangeRate = parsed.currency === 'USD' ? 1 : rates[parsed.currency] || 1;

      // Resolve category
      const categoryId = await resolveCategoryId(user.id, parsed.category);

      // CRITICAL: Validate old USD amount BEFORE updating transaction
      // This prevents data corruption if validation fails after DB update
      let oldAmountUsd: number | null = null;

      if (pendingEdit.oldTransaction.walletId) {
        // Strategy 1: Recalculate from originalAmount and exchangeRate (most accurate)
        if (pendingEdit.oldTransaction.originalAmount && pendingEdit.oldTransaction.exchangeRate) {
          const oldOriginalAmount = parseFloat(pendingEdit.oldTransaction.originalAmount);
          const oldExchangeRate = parseFloat(pendingEdit.oldTransaction.exchangeRate);
          
          if (!isNaN(oldOriginalAmount) && !isNaN(oldExchangeRate) && oldExchangeRate > 0) {
            oldAmountUsd = pendingEdit.oldTransaction.currency === 'USD' 
              ? oldOriginalAmount 
              : oldOriginalAmount / oldExchangeRate;
          }
        }
        
        // Strategy 2: Use stored amountUsd (legacy transactions)
        if (oldAmountUsd === null && pendingEdit.oldTransaction.amountUsd) {
          const parsedUsd = parseFloat(pendingEdit.oldTransaction.amountUsd);
          if (!isNaN(parsedUsd) && parsedUsd > 0) {
            oldAmountUsd = parsedUsd;
          }
        }
        
        // Strategy 3: Fallback to amount (assume USD if no conversion data)
        if (oldAmountUsd === null && pendingEdit.oldTransaction.amount) {
          const parsedAmount = parseFloat(pendingEdit.oldTransaction.amount);
          if (!isNaN(parsedAmount) && parsedAmount > 0) {
            oldAmountUsd = parsedAmount;
          }
        }

        // Abort edit if we cannot safely calculate old USD amount
        if (oldAmountUsd === null || isNaN(oldAmountUsd) || !isFinite(oldAmountUsd)) {
          console.error('Cannot calculate old USD amount for transaction:', pendingEdit.transactionId);
          pendingEdits.delete(telegramId);
          await bot.sendMessage(chatId, t('error.transaction', lang));
          return;
        }
      }

      // Update transaction in database (only after validation passes)
      await db
        .update(transactions)
        .set({
          type: parsed.type,
          amount: parsed.amount.toString(),
          description: parsed.description,
          categoryId,
          currency: parsed.currency,
          amountUsd: newAmountUsd.toFixed(2),
          originalAmount: parsed.amount.toString(),
          originalCurrency: parsed.currency,
          exchangeRate: newExchangeRate.toFixed(4),
        })
        .where(and(
          eq(transactions.id, pendingEdit.transactionId),
          eq(transactions.userId, user.id)
        ));

      // Update wallet balance: reverse old transaction, apply new one
      // Note: walletId is not changed during Telegram edit - transaction stays in same wallet
      // This is intentional as Telegram parser doesn't support wallet selection
      if (pendingEdit.oldTransaction.walletId && oldAmountUsd !== null) {
        const walletId = pendingEdit.oldTransaction.walletId;

        // Reverse old transaction effect (use old type and validated old amount)
        const reverseType = pendingEdit.oldTransaction.type === 'income' ? 'expense' : 'income';
        await updateWalletBalance(walletId, user.id, oldAmountUsd, reverseType);

        // Apply new transaction effect (use new type and new amount from parsed input)
        await updateWalletBalance(walletId, user.id, newAmountUsd, parsed.type);
      }

      // Clear pending edit
      pendingEdits.delete(telegramId);

      // Send success message with transaction details
      const { message, reply_markup } = await formatTransactionMessage(
        user.id,
        pendingEdit.transactionId,
        parsed.amount,
        parsed.currency,
        newAmountUsd,
        parsed.description,
        categoryId,
        parsed.type,
        lang
      );

      await bot.editMessageText(message, {
        chat_id: pendingEdit.chatId,
        message_id: pendingEdit.messageId,
        parse_mode: 'Markdown',
        reply_markup
      });

      await bot.sendMessage(chatId, t('transaction.edit_success', lang));
      return;
    }

    // SHOPPING LIST CHECK: Try to parse as shopping list first
    const trimmedText = text.trim();
    
    if (isShoppingList(trimmedText)) {
      const shoppingList = parseShoppingList(trimmedText, defaultCurrency);
      
      if (shoppingList) {
        // Get primary wallet
        const primaryWallet = await getPrimaryWallet(user.id);
        
        // Get exchange rates
        const rates = await getUserExchangeRates(user.id);
        const amountUsd = convertToUSD(shoppingList.total, shoppingList.currency, rates);
        const exchangeRate = shoppingList.currency === 'USD' ? 1 : rates[shoppingList.currency] || 1;
        
        // Resolve category (use merchant name or default)
        const categoryId = await resolveCategoryId(user.id, shoppingList.merchant);
        
        // Create transaction
        const [transaction] = await db
          .insert(transactions)
          .values({
            userId: user.id,
            date: format(new Date(), 'yyyy-MM-dd'),
            type: 'expense',
            amount: shoppingList.total.toString(),
            description: shoppingList.merchant,
            categoryId,
            currency: shoppingList.currency,
            amountUsd: amountUsd.toFixed(2),
            originalAmount: shoppingList.total.toString(),
            originalCurrency: shoppingList.currency,
            exchangeRate: exchangeRate.toFixed(4),
            source: 'telegram',
            walletId: primaryWallet.id,
          })
          .returning();
        
        // Save receipt items with USD conversion
        if (shoppingList.items.length > 0) {
          try {
            const receiptItemsRepo = new ReceiptItemsRepository();
            const itemsToSave = shoppingList.items.map(item => {
              // Convert item price to USD
              const itemUsd = convertToUSD(item.price, shoppingList.currency, rates);
              
              return {
                transactionId: transaction.id,
                itemName: item.name,
                normalizedName: item.normalizedName,
                quantity: '1',
                pricePerUnit: item.price.toString(),
                totalPrice: item.price.toString(),
                currency: shoppingList.currency,
                merchantName: shoppingList.merchant,
                amountUsd: itemUsd.toFixed(2)  // USD conversion for analytics
              };
            });
            
            await receiptItemsRepo.createBulk(itemsToSave);
            console.log(`✅ Saved ${itemsToSave.length} items from shopping list for transaction ${transaction.id}`);
          } catch (error) {
            console.error('Failed to save shopping list items:', error);
          }
        }
        
        // Update wallet balance
        await updateWalletBalance(
          primaryWallet.id,
          user.id,
          amountUsd,
          'expense'
        );
        
        // Format response message
        const { message, reply_markup } = await formatTransactionMessage(
          user.id,
          transaction.id,
          shoppingList.total,
          shoppingList.currency,
          amountUsd,
          shoppingList.merchant,
          categoryId,
          'expense',
          lang,
          shoppingList.items  // Pass items to show in message
        );
        
        await bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_markup
        });
        
        return; // Shopping list handled, exit
      }
    }
    
    // NORMAL TRANSACTION: Pre-parse validation for better error messages
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

    const parsed = parseTransactionText(text, defaultCurrency);

    // Check 3: Invalid amount (negative or zero)
    if (!parsed) {
      await bot.sendMessage(chatId, t('transaction.parse_error_invalid_amount', lang), {
        parse_mode: 'Markdown'
      });
      return;
    }

    // Resolve category using category resolution service
    const categoryId = await resolveCategoryId(user.id, parsed.category);

    // Get primary wallet for transaction
    const primaryWallet = await getPrimaryWallet(user.id);

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
        walletId: primaryWallet.id,
      })
      .returning();

    // Update wallet balance
    await updateWalletBalance(
      primaryWallet.id,
      user.id,
      amountUsd,
      parsed.type
    );

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

      const receiptId = query.data.substring('confirm_receipt:'.length);
      const receiptData = pendingReceipts.get(receiptId);

      if (!receiptData) {
        await bot.answerCallbackQuery(query.id, { text: t('receipt.expired', lang) });
        return;
      }

      // Security: Verify receipt belongs to this user
      if (receiptData.userId !== user.id) {
        pendingReceipts.delete(receiptId);
        await bot.answerCallbackQuery(query.id, { text: t('receipt.expired', lang) });
        return;
      }

      const { parsed, categoryId } = receiptData;
      pendingReceipts.delete(receiptId);

      // Get primary wallet for transaction
      const primaryWallet = await getPrimaryWallet(user.id);

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
          walletId: primaryWallet.id,
        })
        .returning();

      // Save receipt items if available (with USD conversion for analytics)
      if ('items' in parsed && parsed.items && parsed.items.length > 0) {
        try {
          const receiptItemsRepo = new ReceiptItemsRepository();
          const itemsToSave = parsed.items.map((item: any) => {
            // Convert item total price to USD
            const itemTotalUsd = convertToUSD(
              parseFloat(item.totalPrice), 
              parsed.currency, 
              rates
            );
            
            return {
              transactionId: transaction.id,
              itemName: item.name,
              normalizedName: item.normalizedName,
              quantity: item.quantity?.toString(),
              pricePerUnit: item.pricePerUnit.toString(),
              totalPrice: item.totalPrice.toString(),
              currency: parsed.currency,
              merchantName: parsed.description,
              amountUsd: itemTotalUsd.toFixed(2)  // USD conversion for analytics
            };
          });
          
          await receiptItemsRepo.createBulk(itemsToSave);
          console.log(`✅ Saved ${itemsToSave.length} items from receipt for transaction ${transaction.id}`);
        } catch (error) {
          console.error('Failed to save receipt items:', error);
          // Don't fail the transaction if items fail to save
        }
      }

      // Update wallet balance
      await updateWalletBalance(
        primaryWallet.id,
        user.id,
        amountUsd,
        'expense'
      );

      const { message, reply_markup } = await formatTransactionMessage(
        user.id,
        transaction.id,
        parsed.amount,
        parsed.currency,
        amountUsd,
        parsed.description,
        categoryId,
        'expense',
        lang,
        'items' in parsed ? parsed.items : undefined  // Pass receipt items
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

      // Get primary wallet for transaction
      const primaryWallet = await getPrimaryWallet(user.id);

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
          walletId: primaryWallet.id,
        })
        .returning();

      // Update wallet balance
      await updateWalletBalance(
        primaryWallet.id,
        user.id,
        amountUsd,
        'income'
      );

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

      // Get transaction
      const [transaction] = await db
        .select()
        .from(transactions)
        .where(and(
          eq(transactions.id, transactionId),
          eq(transactions.userId, user.id)
        ))
        .limit(1);

      if (!transaction) {
        await bot.answerCallbackQuery(query.id, { text: t('error.generic', lang) });
        return;
      }

      // Store pending edit
      pendingEdits.store(telegramId, {
        transactionId,
        userId: user.id,
        oldTransaction: {
          amount: transaction.amount,
          amountUsd: transaction.amountUsd || '0',
          currency: transaction.currency || 'USD',
          type: transaction.type as 'income' | 'expense',
          walletId: transaction.walletId,
          originalAmount: transaction.originalAmount || transaction.amount,
          exchangeRate: transaction.exchangeRate || '1',
        },
        chatId,
        messageId: query.message?.message_id || 0,
      });

      // Send edit prompt - use original amount/currency that user entered
      const promptMessage = t('transaction.edit_prompt', lang)
        .replace('{amount}', transaction.originalAmount || transaction.amount)
        .replace('{currency}', transaction.originalCurrency || transaction.currency || 'USD')
        .replace('{description}', transaction.description || 'N/A');

      await bot.editMessageText(promptMessage, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: t('transaction.delete_no', lang), callback_data: 'cancel_edit' }
            ]
          ]
        }
      });

      await bot.answerCallbackQuery(query.id);
    }

    if (query.data === 'cancel_edit') {
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

      // Get pending edit before deleting it
      const pendingEdit = pendingEdits.get(telegramId);
      
      if (!pendingEdit) {
        await bot.editMessageText(t('transaction.edit_cancelled', lang), {
          chat_id: chatId,
          message_id: query.message?.message_id,
        });
        await bot.answerCallbackQuery(query.id);
        return;
      }

      const transactionId = pendingEdit.transactionId;
      pendingEdits.delete(telegramId);

      // Get transaction to restore original message with buttons
      const [transaction] = await db
        .select()
        .from(transactions)
        .where(and(
          eq(transactions.id, transactionId),
          eq(transactions.userId, user.id)
        ))
        .limit(1);

      if (!transaction) {
        await bot.editMessageText(t('transaction.edit_cancelled', lang), {
          chat_id: chatId,
          message_id: query.message?.message_id,
        });
        await bot.answerCallbackQuery(query.id);
        return;
      }

      // Restore original transaction message with buttons
      const amount = parseFloat(transaction.originalAmount || transaction.amount);
      const currency = (transaction.originalCurrency || transaction.currency || 'USD') as 'USD' | 'RUB' | 'IDR';
      const amountUsd = parseFloat(transaction.amountUsd || '0');

      const { message, reply_markup } = await formatTransactionMessage(
        user.id,
        transaction.id,
        amount,
        currency,
        amountUsd,
        transaction.description || '',
        transaction.categoryId,
        transaction.type as 'income' | 'expense',
        lang
      );

      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: query.message?.message_id,
        parse_mode: 'Markdown',
        reply_markup
      });

      await bot.answerCallbackQuery(query.id, { text: t('transaction.edit_cancelled', lang) });
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

    // Get user's default currency from settings
    const [userSettings] = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, user.id))
      .limit(1);
    
    const defaultCurrency = (userSettings?.currency || 'USD') as 'USD' | 'RUB' | 'IDR';

    const parsed = parseTransactionText(text, defaultCurrency);

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

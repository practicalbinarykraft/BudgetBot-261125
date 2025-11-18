// Transaction Tool Handler - add new income or expense transaction
import { storage } from '../../storage';
import { trainCategory } from '../../services/categorization.service';
import { updateWalletBalance } from '../../services/wallet.service';
import { getUserExchangeRates, convertToUSD } from '../../services/currency-service';
import { ToolResult } from '../tool-types';

export async function handleAddTransaction(
  userId: number,
  params: {
    amount: number;
    description: string;
    category?: string;
    type: 'income' | 'expense';
    personal_tag?: string;
    date?: string;
    currency?: string;
  }
): Promise<ToolResult> {
  try {
    // Validate required params
    if (!params.amount || !params.description || !params.type) {
      return {
        success: false,
        error: 'Missing required parameters: amount, description, and type'
      };
    }

    // Get primary wallet for this user (needed for walletId)
    const wallets = await storage.getWalletsByUserId(userId);
    const primaryWallet = wallets.find(w => w.isPrimary === 1) || wallets[0];

    // Get user settings for default currency
    const settings = await storage.getSettingsByUserId(userId);
    const currency = params.currency || settings?.currency || 'USD';
    const amount = params.amount;
    
    // Get user's exchange rates (includes custom rates + fallbacks)
    const exchangeRates = await getUserExchangeRates(userId);
    
    // Validate currency is supported
    if (!exchangeRates[currency]) {
      return {
        success: false,
        error: `Unsupported currency: ${currency}. Supported: ${Object.keys(exchangeRates).join(', ')}`
      };
    }
    
    // Convert to USD using cached exchange rates
    const amountUsd = convertToUSD(amount, currency, exchangeRates);
    const exchangeRate = exchangeRates[currency];
    
    // Resolve personal tag name to ID if provided (case-insensitive)
    let personalTagId: number | undefined = undefined;
    if (params.personal_tag) {
      const tags = await storage.getPersonalTagsByUserId(userId);
      const matchedTag = tags.find(t => 
        t.name.toLowerCase() === params.personal_tag!.toLowerCase()
      );
      personalTagId = matchedTag?.id;
    }
    
    // Create transaction with proper USD conversion (preserve precision)
    const transaction = await storage.createTransaction({
      userId,
      amount: amount.toString(),
      amountUsd: amountUsd.toString(), // Preserve full precision, database handles scale
      description: params.description,
      category: params.category,
      personalTagId,
      type: params.type,
      date: params.date || new Date().toISOString().split('T')[0],
      currency,
      exchangeRate: exchangeRate.toString(),
      source: 'manual', // AI-created transactions marked as manual
      walletId: primaryWallet?.id
    });
    
    // Update wallet balance atomically (round to match DECIMAL(10,2) precision)
    if (primaryWallet?.id) {
      const roundedAmountUsd = Math.round(amountUsd * 100) / 100; // Round to 2 decimals
      await updateWalletBalance(
        primaryWallet.id,
        userId,
        roundedAmountUsd,
        params.type
      );
    }
    
    // Train ML model if category was provided
    if (params.category) {
      await trainCategory(userId, params.description, params.category);
    }
    
    return {
      success: true,
      data: {
        id: transaction.id,
        amount: transaction.amount,
        description: transaction.description,
        type: transaction.type,
        date: transaction.date,
        currency: transaction.currency
      },
      message: `${params.type === 'income' ? 'Income' : 'Expense'} of ${amount} ${currency} added: ${params.description}`
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to add transaction'
    };
  }
}

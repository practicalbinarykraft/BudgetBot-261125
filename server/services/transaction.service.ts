import { db } from '../db';
import { transactions } from '@shared/schema';
import { applyMLCategory, trainMLCategory } from '../middleware/ml-middleware';
import { convertToUSD, getExchangeRate } from './currency-service';
import { storage } from '../storage';

export interface CreateTransactionInput {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category?: string;
  date: string;
  currency?: string;
  source?: string;
  walletId?: number;
  personalTagId?: number | null;
  financialType?: 'essential' | 'discretionary' | 'asset' | 'liability';
}

export interface TransactionWithML {
  id: number;
  userId: number;
  date: string;
  type: string;
  amount: string;
  description: string;
  category: string | null;
  categoryId: number | null;
  currency: string | null;
  amountUsd: string;
  originalAmount: string | null;
  originalCurrency: string | null;
  exchangeRate: string | null;
  source: string | null;
  walletId: number | null;
  createdAt: Date;
  mlSuggested: boolean;
  mlConfidence: number;
}

export async function createTransaction(
  userId: number,
  input: CreateTransactionInput
): Promise<TransactionWithML> {
  const enhanced = await applyMLCategory(userId, {
    description: input.description,
    category: input.category
  });
  
  const inputCurrency = input.currency || 'USD';
  const inputAmount = input.amount;
  
  let amountUsd: string;
  let originalAmount: string | undefined;
  let originalCurrency: string | undefined;
  let exchangeRate: string | undefined;
  
  if (inputCurrency !== 'USD') {
    const usdValue = convertToUSD(inputAmount, inputCurrency);
    amountUsd = usdValue.toFixed(2);
    originalAmount = inputAmount.toString();
    originalCurrency = inputCurrency;
    exchangeRate = getExchangeRate(inputCurrency).toString();
  } else {
    amountUsd = inputAmount.toFixed(2);
  }
  
  let categoryId: number | null = null;
  if (enhanced.category) {
    const category = await storage.getCategoryByNameAndUserId(enhanced.category, userId);
    categoryId = category?.id ?? null;
  }
  
  const [transaction] = await db
    .insert(transactions)
    .values({
      userId,
      type: input.type,
      amount: inputAmount.toString(),
      amountUsd,
      description: enhanced.description,
      category: enhanced.category || null,
      date: input.date,
      currency: inputCurrency,
      originalAmount,
      originalCurrency,
      exchangeRate,
      source: input.source || 'manual',
      walletId: input.walletId || null,
      categoryId,
      personalTagId: input.personalTagId || null,
      financialType: input.financialType || 'discretionary',
    })
    .returning();
  
  await trainMLCategory(userId, {
    description: transaction.description,
    category: transaction.category ?? undefined
  });
  
  return {
    ...transaction,
    mlSuggested: enhanced.mlSuggested,
    mlConfidence: enhanced.mlConfidence
  };
}

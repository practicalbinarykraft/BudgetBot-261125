import { db } from '../db';
import { transactions, InsertTransaction } from '@shared/schema';
import { applyMLCategory, trainMLCategory } from '../middleware/ml-middleware';
import { convertToUSD, getExchangeRate } from './currency-service';
import { transactionRepository } from '../repositories/transaction.repository';
import { walletRepository } from '../repositories/wallet.repository';
import { categoryRepository } from '../repositories/category.repository';
import { checkCategoryLimit, sendBudgetAlert } from './budget/limits-checker.service';
import { logError } from '../lib/logger';

export interface CreateTransactionInput {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category?: string;
  categoryId?: number | null;
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

export class TransactionService {
  async getTransactions(
    userId: number,
    filters?: {
      personalTagIds?: number[];
      categoryIds?: number[];
      types?: ('income' | 'expense')[];
      from?: string;
      to?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    return transactionRepository.getTransactionsByUserId(userId, filters);
  }

  async getTransaction(id: number, userId: number) {
    const transaction = await transactionRepository.getTransactionById(id);
    if (!transaction || transaction.userId !== userId) {
      return null;
    }
    return transaction;
  }

  async createTransaction(
    userId: number,
    input: CreateTransactionInput
  ): Promise<TransactionWithML> {
    // Verify wallet ownership
    if (input.walletId) {
      const wallet = await walletRepository.getWalletById(input.walletId);
      if (!wallet || wallet.userId !== userId) {
        throw new Error("Invalid wallet");
      }
    }

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

    let categoryId: number | null = input.categoryId ?? null;
    if (!categoryId && enhanced.category) {
      const category = await categoryRepository.getCategoryByNameAndUserId(enhanced.category, userId);
      categoryId = category?.id ?? null;
    }

    const transaction = await transactionRepository.createTransaction({
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
      source: (input.source as 'manual' | 'telegram' | 'ocr') || 'manual',
      walletId: input.walletId || null,
      categoryId,
      personalTagId: input.personalTagId || null,
      financialType: input.financialType || 'discretionary',
    });

    await trainMLCategory(userId, {
      description: transaction.description,
      category: transaction.category ?? undefined
    });

    // Check budget limits (side effect)
    if (transaction.type === 'expense' && transaction.categoryId) {
      checkCategoryLimit(userId, transaction.categoryId)
        .then(async (limitCheck) => {
          if (limitCheck && (limitCheck.status === 'warning' || limitCheck.status === 'exceeded')) {
            await sendBudgetAlert(userId, limitCheck);
          }
        })
        .catch(error => {
          logError('Error checking budget limit', error);
        });
    }

    return {
      ...transaction,
      mlSuggested: enhanced.mlSuggested,
      mlConfidence: enhanced.mlConfidence
    };
  }

  async updateTransaction(id: number, userId: number, data: Partial<InsertTransaction>) {
    const transaction = await this.getTransaction(id, userId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Verify wallet ownership if changing wallet
    if (data.walletId) {
      const wallet = await walletRepository.getWalletById(data.walletId);
      if (!wallet || wallet.userId !== userId) {
        throw new Error("Invalid wallet");
      }
    }

    // Handle currency conversion
    if (data.amount || data.currency) {
      const amount = data.amount ? parseFloat(data.amount) : parseFloat(transaction.amount);
      const currency = data.currency || transaction.currency || "USD";

      if (currency !== "USD") {
        const usdValue = convertToUSD(amount, currency);
        const rate = getExchangeRate(currency);
        data = {
          ...data,
          amountUsd: usdValue.toFixed(2),
          originalAmount: amount.toString(),
          originalCurrency: currency,
          exchangeRate: rate.toString(),
        };
      } else {
        data = {
          ...data,
          amountUsd: amount.toFixed(2),
          originalAmount: undefined,
          originalCurrency: undefined,
          exchangeRate: undefined,
        };
      }
    }

    // Handle category resolution
    if (data.category) {
      const category = await categoryRepository.getCategoryByNameAndUserId(data.category, userId);
      data = { ...data, categoryId: category?.id ?? null };
    }

    return transactionRepository.updateTransaction(id, data);
  }

  async deleteTransaction(id: number, userId: number) {
    const transaction = await this.getTransaction(id, userId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }
    await transactionRepository.deleteTransaction(id);
  }
}

export const transactionService = new TransactionService();
// Export standalone function for backward compatibility if needed, or just use service
export const createTransaction = transactionService.createTransaction.bind(transactionService);

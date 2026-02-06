/**
 * Shared types mirroring the server schema.
 * These are kept in sync with shared/schema.ts from the web app.
 */

export interface User {
  id: number;
  email: string | null;
  name: string;
  telegramId: string | null;
  telegramUsername: string | null;
  telegramFirstName: string | null;
  telegramPhotoUrl: string | null;
  twoFactorEnabled: boolean;
  isBlocked: boolean;
  tier: string;
  createdAt: string;
}

export interface Transaction {
  id: number;
  userId: number;
  date: string;
  type: 'income' | 'expense';
  amount: string;
  amountUsd: string;
  description: string;
  category: string | null;
  categoryId: number | null;
  currency: string;
  originalAmount: string | null;
  originalCurrency: string | null;
  exchangeRate: string | null;
  source: string;
  walletId: number | null;
  personalTagId: number | null;
  financialType: 'essential' | 'discretionary' | 'asset' | 'liability' | null;
  createdAt: string;
}

export interface Wallet {
  id: number;
  userId: number;
  name: string;
  type: 'card' | 'cash' | 'crypto';
  balance: string;
  balanceUsd: string;
  currency: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  userId: number;
  name: string;
  type: 'income' | 'expense';
  icon: string | null;
  color: string | null;
  applicableTo: string | null;
  createdAt: string;
}

export interface PersonalTag {
  id: number;
  userId: number;
  name: string;
  icon: string | null;
  color: string | null;
  type: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface Budget {
  id: number;
  userId: number;
  categoryId: number;
  limitAmount: string;
  period: 'week' | 'month' | 'year';
  startDate: string;
  createdAt: string;
}

export interface Settings {
  id: number;
  userId: number;
  language: string;
  currency: string;
  telegramNotifications: boolean;
  timezone: string;
  notificationTime: string | null;
  exchangeRateRUB: string | null;
  exchangeRateIDR: string | null;
  exchangeRateKRW: string | null;
  exchangeRateEUR: string | null;
  exchangeRateCNY: string | null;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  plannedTransactionId: number | null;
  plannedIncomeId: number | null;
  transactionData: TransactionData | null;
  status: string;
  createdAt: string;
  readAt: string | null;
  dismissedAt: string | null;
  completedAt: string | null;
}

export interface TransactionData {
  amount: string;
  currency: string;
  description: string;
  category?: string;
  categoryId?: number;
  type: 'income' | 'expense';
  date: string;
  recurringId?: number;
  frequency?: string;
  nextDate?: string;
}

export interface Stats {
  income: string;
  expense: string;
  balance: string;
}

export interface CategoryAnalytics {
  categoryId: number | null;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  total: string;
  count: number;
  percentage: number;
}

export interface CreateTransactionInput {
  date: string;
  type: 'income' | 'expense';
  amount: string;
  description: string;
  categoryId?: number;
  currency?: string;
  walletId?: number;
  personalTagId?: number;
  financialType?: string;
}

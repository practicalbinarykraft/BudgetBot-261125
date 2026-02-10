export interface Transaction {
  id: number;
  userId: number;
  date: string;
  type: "income" | "expense";
  amount: string;
  description: string;
  category: string | null;
  categoryId: number | null;
  currency: string;
  amountUsd: string;
  originalAmount: string | null;
  originalCurrency: string | null;
  exchangeRate: string | null;
  source: string;
  walletId: number | null;
  personalTagId: number | null;
  financialType: string;
  createdAt: string;
}

export interface Category {
  id: number;
  userId: number;
  name: string;
  type: "income" | "expense";
  applicableTo: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface Budget {
  id: number;
  userId: number;
  categoryId: number;
  limitAmount: string;
  period: "week" | "month" | "year";
  startDate: string;
  createdAt: string;
}

export interface LimitProgress {
  budgetId: number;
  categoryId: number;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  limitAmount: string;
  spent: number;
  period: string;
  periodStart: string;
  periodEnd: string;
  percentage: number;
}

export interface PersonalTag {
  id: number;
  userId: number;
  name: string;
  icon: string;
  color: string;
  type: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Recurring {
  id: number;
  userId: number;
  type: "income" | "expense";
  amount: string;
  description: string;
  category: string | null;
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  nextDate: string;
  isActive: boolean;
  currency: string | null;
  amountUsd: string;
  createdAt: string;
}

export interface PlannedTransaction {
  id: number;
  userId: number;
  name: string;
  amount: string;
  category: string | null;
  targetDate: string;
  source: string;
  wishlistId: number | null;
  status: "planned" | "purchased" | "cancelled";
  showOnChart: boolean;
  currency: string | null;
  createdAt: string;
}

export interface PlannedIncome {
  id: number;
  userId: number;
  amount: string;
  currency: string | null;
  amountUsd: string;
  description: string;
  categoryId: number | null;
  expectedDate: string;
  status: "pending" | "received" | "cancelled";
  transactionId: number | null;
  source: string;
  notes: string | null;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  plannedTransactionId: number | null;
  plannedIncomeId: number | null;
  transactionData: {
    amount: string;
    currency: string;
    description: string;
    type: string;
    date: string;
    category?: string;
    recurringId?: number;
    frequency?: string;
  } | null;
  status: "unread" | "read" | "completed" | "dismissed";
  createdAt: string;
  readAt: string | null;
  dismissedAt: string | null;
  completedAt: string | null;
}

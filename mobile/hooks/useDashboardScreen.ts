import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import type {
  Transaction,
  Wallet,
  Category,
  Budget,
  PaginatedResponse,
} from "../types";

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

export function formatMonthYear(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

export function formatAmount(usdAmount: number): string {
  return "$" + Math.abs(usdAmount).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export interface StatsResponse {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount?: number;
}

export interface CategoryBreakdownItem {
  id: number;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
}

interface CategoryBreakdownResponse {
  total: number;
  items: CategoryBreakdownItem[];
}

export function useDashboardScreen() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const fromDate = formatLocalDate(monthStart);
  const toDate = formatLocalDate(monthEnd);

  const walletsQuery = useQuery({
    queryKey: ["wallets"],
    queryFn: () => api.get<PaginatedResponse<Wallet>>("/api/wallets?limit=50"),
  });

  const statsQuery = useQuery({
    queryKey: ["stats", fromDate, toDate],
    queryFn: () => api.get<StatsResponse>(`/api/stats?from=${fromDate}&to=${toDate}`),
  });

  const categoryBreakdownQuery = useQuery({
    queryKey: ["analytics-by-category", fromDate, toDate],
    queryFn: () => api.get<CategoryBreakdownResponse>(`/api/analytics/by-category?period=month`),
  });

  const transactionsQuery = useQuery({
    queryKey: ["transactions", "home", fromDate, toDate],
    queryFn: () => api.get<PaginatedResponse<Transaction>>(`/api/transactions?from=${fromDate}&to=${toDate}&limit=5`),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<PaginatedResponse<Category>>("/api/categories"),
  });

  const budgetsQuery = useQuery({
    queryKey: ["budgets"],
    queryFn: () => api.get<PaginatedResponse<Budget>>("/api/budgets"),
  });

  const wallets = walletsQuery.data?.data ?? (Array.isArray(walletsQuery.data) ? walletsQuery.data as Wallet[] : []);
  const totalBalanceUsd = wallets.reduce(
    (sum, w) => sum + parseFloat(w.balanceUsd || w.balance || "0"), 0
  );

  const stats = statsQuery.data;
  const totalIncome = stats?.totalIncome ?? 0;
  const totalExpense = stats?.totalExpense ?? 0;
  const balance = stats?.balance ?? 0;

  const topCategories = categoryBreakdownQuery.data?.items ?? [];
  const recentTransactions = transactionsQuery.data?.data ?? [];
  const categories = categoriesQuery.data?.data ?? (Array.isArray(categoriesQuery.data) ? categoriesQuery.data as Category[] : []);
  const budgets = budgetsQuery.data?.data ?? (Array.isArray(budgetsQuery.data) ? budgetsQuery.data as Budget[] : []);

  const categoryMap = useMemo(() => {
    const map: Record<number, Category> = {};
    categories.forEach((c) => { map[c.id] = c; });
    return map;
  }, [categories]);

  const budgetByCategoryId = useMemo(() => {
    const map: Record<number, Budget> = {};
    budgets.forEach((b) => { map[b.categoryId] = b; });
    return map;
  }, [budgets]);

  const isLoading = walletsQuery.isLoading || statsQuery.isLoading || transactionsQuery.isLoading;
  const isRefreshing = walletsQuery.isRefetching || statsQuery.isRefetching || transactionsQuery.isRefetching || categoryBreakdownQuery.isRefetching;

  const handleRefresh = useCallback(() => {
    walletsQuery.refetch();
    statsQuery.refetch();
    categoryBreakdownQuery.refetch();
    transactionsQuery.refetch();
    categoriesQuery.refetch();
    budgetsQuery.refetch();
  }, [walletsQuery, statsQuery, categoryBreakdownQuery, transactionsQuery, categoriesQuery, budgetsQuery]);

  const goToPrevMonth = () => setSelectedMonth((m) => addMonths(m, -1));
  const goToNextMonth = () => setSelectedMonth((m) => addMonths(m, 1));

  return {
    selectedMonth, goToPrevMonth, goToNextMonth,
    totalBalanceUsd, totalIncome, totalExpense, balance,
    topCategories, budgetByCategoryId,
    recentTransactions, categoryMap,
    isLoading, isRefreshing, handleRefresh,
  };
}

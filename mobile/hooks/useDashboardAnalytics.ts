import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import {
  type DateFilterValue,
  type StatsResponse,
  getDateRange,
  groupTransactionsByDate,
} from "../utils/date-helpers";
import type {
  Transaction,
  Wallet,
  Category,
  PersonalTag,
  LimitProgress,
  PaginatedResponse,
} from "../types";

export function useDashboardAnalytics() {
  const [dateFilter, setDateFilter] = useState<DateFilterValue>("month");

  const walletsQuery = useQuery({
    queryKey: ["wallets"],
    queryFn: () => api.get<PaginatedResponse<Wallet>>("/api/wallets?limit=50"),
  });

  const transactionsQuery = useQuery({
    queryKey: ["transactions", "dashboard", dateFilter],
    queryFn: () => {
      const range = getDateRange(dateFilter);
      const params = range
        ? `?from=${range.from}&to=${range.to}&limit=20`
        : "?limit=20";
      return api.get<PaginatedResponse<Transaction>>(
        `/api/transactions${params}`
      );
    },
  });

  const statsQuery = useQuery({
    queryKey: ["stats", dateFilter],
    queryFn: () => {
      const range = getDateRange(dateFilter);
      const params = range
        ? `?from=${range.from}&to=${range.to}`
        : "";
      return api.get<StatsResponse>(`/api/stats${params}`);
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<PaginatedResponse<Category>>("/api/categories"),
  });

  const limitsQuery = useQuery({
    queryKey: ["limits"],
    queryFn: () => api.get<LimitProgress[]>("/api/limits"),
  });

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get<PersonalTag[]>("/api/tags"),
  });

  const wallets = walletsQuery.data?.data || [];
  const transactions = transactionsQuery.data?.data || [];
  const categories = categoriesQuery.data?.data || [];
  const stats = statsQuery.data;
  const limits = limitsQuery.data || [];

  const totalBalance = wallets.reduce(
    (sum, w) => sum + parseFloat(w.balanceUsd || w.balance || "0"),
    0
  );

  const totalIncome = stats?.totalIncome ?? 0;
  const totalExpense = stats?.totalExpense ?? 0;

  const categoryMap = useMemo(() => {
    const map: Record<number, Category> = {};
    categories.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [categories]);

  const tags = tagsQuery.data ?? [];
  const tagMap = useMemo(() => {
    const map: Record<number, PersonalTag> = {};
    tags.forEach((t) => { map[t.id] = t; });
    return map;
  }, [tags]);

  const recentTransactions = transactions.slice(0, 5);

  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(recentTransactions),
    [recentTransactions]
  );

  const exceededBudgets = limits.filter((b) => b.percentage > 100);
  const warningBudgets = limits.filter(
    (b) => b.percentage >= 75 && b.percentage <= 100
  );

  const isLoading =
    walletsQuery.isLoading ||
    transactionsQuery.isLoading ||
    categoriesQuery.isLoading ||
    statsQuery.isLoading;

  const isRefreshing =
    walletsQuery.isRefetching ||
    transactionsQuery.isRefetching ||
    categoriesQuery.isRefetching ||
    statsQuery.isRefetching;

  const handleRefresh = useCallback(() => {
    walletsQuery.refetch();
    transactionsQuery.refetch();
    categoriesQuery.refetch();
    statsQuery.refetch();
    limitsQuery.refetch();
    tagsQuery.refetch();
  }, [walletsQuery, transactionsQuery, categoriesQuery, statsQuery, limitsQuery, tagsQuery]);

  return {
    dateFilter,
    setDateFilter,
    totalBalance,
    totalIncome,
    totalExpense,
    categoryMap,
    tagMap,
    recentTransactions,
    groupedTransactions,
    exceededBudgets,
    warningBudgets,
    isLoading,
    isRefreshing,
    handleRefresh,
  };
}

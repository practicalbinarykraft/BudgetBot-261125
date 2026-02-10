import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { buildFilterBadges } from "../components/transactions/buildFilterBadges";
import type { Transaction, Category, PersonalTag, PaginatedResponse } from "../types";

export interface TransactionFilters {
  types: ("income" | "expense")[];
  categoryIds: number[];
  personalTagIds: number[];
  from: string;
  to: string;
}

export const emptyFilters: TransactionFilters = {
  types: [], categoryIds: [], personalTagIds: [], from: "", to: "",
};

export interface FilterBadge {
  key: string;
  label: string;
  onRemove: () => void;
}

function isTodayDate(date: Date): boolean {
  const now = new Date();
  return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function isYesterdayDate(date: Date): boolean {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return date.getDate() === y.getDate() && date.getMonth() === y.getMonth() && date.getFullYear() === y.getFullYear();
}

export function getDateHeader(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  if (isTodayDate(date)) return "Today";
  if (isYesterdayDate(date)) return "Yesterday";
  return date.toLocaleDateString("en-US", { day: "numeric", month: "long" });
}

function groupTransactionsByDate(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();
  transactions.forEach((t) => {
    const dateKey = t.date.split("T")[0];
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey)!.push(t);
  });
  return groups;
}

export function useTransactionsScreen() {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>(emptyFilters);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<PaginatedResponse<Category>>("/api/categories"),
  });
  const categories = categoriesQuery.data?.data || [];

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get<PersonalTag[]>("/api/tags"),
  });
  const tags = tagsQuery.data || [];

  const transactionsQuery = useQuery({
    queryKey: ["transactions", "list", filters],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "50" });
      filters.types.forEach((t) => params.append("type", t));
      filters.categoryIds.forEach((id) => params.append("categoryId", String(id)));
      filters.personalTagIds.forEach((id) => params.append("personalTagId", String(id)));
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      return api.get<PaginatedResponse<Transaction>>(`/api/transactions?${params.toString()}`);
    },
  });
  const transactions = transactionsQuery.data?.data || [];

  const categoryMap = useMemo(() => {
    const map: Record<number, Category> = {};
    categories.forEach((c) => { map[c.id] = c; });
    return map;
  }, [categories]);

  const tagMap = useMemo(() => {
    const map: Record<number, PersonalTag> = {};
    tags.forEach((t) => { map[t.id] = t; });
    return map;
  }, [tags]);

  const groupedTransactions = useMemo(() => groupTransactionsByDate(transactions), [transactions]);

  const hasActiveFilters =
    filters.types.length > 0 || filters.categoryIds.length > 0 ||
    filters.personalTagIds.length > 0 || filters.from !== "" || filters.to !== "";

  const activeFilterCount =
    filters.types.length + filters.categoryIds.length +
    filters.personalTagIds.length + (filters.from ? 1 : 0) + (filters.to ? 1 : 0);

  const activeFilterBadges = useMemo(
    () => buildFilterBadges(filters, categoryMap, tagMap, setFilters),
    [filters, categoryMap, tagMap]
  );

  const clearAllFilters = useCallback(() => { setFilters(emptyFilters); }, []);

  const toggleTypeFilter = useCallback((type: "income" | "expense") => {
    setFilters((f) => ({
      ...f,
      types: f.types.includes(type) ? f.types.filter((t) => t !== type) : [...f.types, type],
    }));
  }, []);

  const toggleCategoryFilter = useCallback((id: number) => {
    setFilters((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(id) ? f.categoryIds.filter((c) => c !== id) : [...f.categoryIds, id],
    }));
  }, []);

  const toggleTagFilter = useCallback((id: number) => {
    setFilters((f) => ({
      ...f,
      personalTagIds: f.personalTagIds.includes(id) ? f.personalTagIds.filter((t) => t !== id) : [...f.personalTagIds, id],
    }));
  }, []);

  const setDateFrom = useCallback((text: string) => { setFilters((f) => ({ ...f, from: text })); }, []);
  const setDateTo = useCallback((text: string) => { setFilters((f) => ({ ...f, to: text })); }, []);

  const isLoading = transactionsQuery.isLoading || categoriesQuery.isLoading;
  const isRefreshing = transactionsQuery.isRefetching;
  const handleRefresh = useCallback(() => {
    transactionsQuery.refetch();
    categoriesQuery.refetch();
    tagsQuery.refetch();
  }, [transactionsQuery, categoriesQuery, tagsQuery]);

  return {
    filters, showFilters, setShowFilters, categories, tags, transactions,
    categoryMap, tagMap, groupedTransactions, hasActiveFilters, activeFilterCount,
    activeFilterBadges, clearAllFilters, toggleTypeFilter, toggleCategoryFilter,
    toggleTagFilter, setDateFrom, setDateTo, isLoading, isRefreshing, handleRefresh,
  };
}

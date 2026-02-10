import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import type { BreakdownItem } from "../components/BreakdownCard";

export type Period = "week" | "month" | "year";
export type TabKey = "category" | "person" | "type" | "unsorted";

export interface BreakdownResponse {
  total: number;
  items: BreakdownItem[];
}

export interface TypeItem {
  type: string;
  name: string;
  amount: number;
  percentage: number;
}

export interface UnsortedResponse {
  count: number;
  transactions: Array<{
    id: number;
    description: string;
    date: string;
    amountUsd: number;
  }>;
}

export const periods: { key: Period; label: string }[] = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

export const tabs: { key: TabKey; label: string }[] = [
  { key: "category", label: "Category" },
  { key: "person", label: "Person" },
  { key: "type", label: "Type" },
  { key: "unsorted", label: "Unsorted" },
];

export function useExpensesAnalyticsScreen() {
  const [period, setPeriod] = useState<Period>("month");
  const [activeTab, setActiveTab] = useState<TabKey>("category");

  const categoryQuery = useQuery({
    queryKey: ["analytics-by-category", period],
    queryFn: () =>
      api.get<BreakdownResponse>(`/api/analytics/by-category?period=${period}`),
    enabled: activeTab === "category",
  });

  const personQuery = useQuery({
    queryKey: ["analytics-by-person", period],
    queryFn: () =>
      api.get<BreakdownResponse>(`/api/analytics/by-person?period=${period}`),
    enabled: activeTab === "person",
  });

  const typeQuery = useQuery({
    queryKey: ["analytics-by-type", period],
    queryFn: () =>
      api.get<{ total: number; items: TypeItem[] }>(
        `/api/analytics/by-type?period=${period}`
      ),
    enabled: activeTab === "type",
  });

  const unsortedQuery = useQuery({
    queryKey: ["analytics-unsorted", period],
    queryFn: () =>
      api.get<UnsortedResponse>(`/api/analytics/unsorted?period=${period}`),
    enabled: activeTab === "unsorted",
  });

  const migrateMutation = useMutation({
    mutationFn: () =>
      api.post("/api/admin/migrate-transaction-classifications", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics-by-category"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-by-person"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-by-type"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-unsorted"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  return {
    period,
    setPeriod,
    activeTab,
    setActiveTab,
    categoryQuery,
    personQuery,
    typeQuery,
    unsortedQuery,
    migrateMutation,
    formatDate,
  };
}

import { useState, useMemo } from "react";
import { Alert } from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import { useTranslation } from "../i18n";
import { getDateLocale } from "../lib/date-locale";
import type { PlannedIncome } from "../types";

export type TabFilter = "all" | "pending" | "received" | "cancelled";

export function usePlannedIncomeScreen() {
  const { language } = useTranslation();
  const [tab, setTab] = useState<TabFilter>("all");

  const incomeQuery = useQuery({
    queryKey: ["planned-income"],
    queryFn: () => api.get<PlannedIncome[]>("/api/planned-income"),
  });

  const allItems = incomeQuery.data || [];

  const filtered = useMemo(() => {
    if (tab === "all") return allItems;
    return allItems.filter((i) => i.status === tab);
  }, [allItems, tab]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/planned-income/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planned-income"] });
    },
    onError: (error: Error) => Alert.alert("Error", error.message),
  });

  const receiveMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/planned-income/${id}/receive`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planned-income"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (error: Error) => Alert.alert("Error", error.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/planned-income/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planned-income"] });
    },
    onError: (error: Error) => Alert.alert("Error", error.message),
  });

  const handleDelete = (item: PlannedIncome) => {
    Alert.alert("Delete", `Remove "${item.description}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(item.id) },
    ]);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString(getDateLocale(language), {
      month: "short", day: "numeric", year: "numeric",
    });

  return {
    tab,
    setTab,
    incomeQuery,
    allItems,
    filtered,
    receiveMutation,
    cancelMutation,
    handleDelete,
    formatDate,
  };
}

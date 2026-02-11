import { useState, useMemo } from "react";
import { Alert } from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import { useTranslation } from "../i18n";
import { getDateLocale } from "../lib/date-locale";
import type { PlannedTransaction } from "../types";

export type TabFilter = "all" | "planned" | "completed";

export function usePlannedExpensesScreen() {
  const { language } = useTranslation();
  const [tab, setTab] = useState<TabFilter>("all");

  const plannedQuery = useQuery({
    queryKey: ["planned"],
    queryFn: () => api.get<PlannedTransaction[]>("/api/planned"),
  });

  const allItems = plannedQuery.data || [];

  const filtered = useMemo(() => {
    if (tab === "all") return allItems;
    if (tab === "planned") return allItems.filter((p) => p.status === "planned");
    return allItems.filter((p) => p.status === "purchased" || p.status === "cancelled");
  }, [allItems, tab]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/planned/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planned"] });
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/planned/${id}/purchase`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planned"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/planned/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planned"] });
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleDelete = (item: PlannedTransaction) => {
    Alert.alert("Delete", `Remove "${item.name}"?`, [
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
    plannedQuery,
    allItems,
    filtered,
    purchaseMutation,
    cancelMutation,
    handleDelete,
    formatDate,
  };
}

import { useState, useMemo, useCallback } from "react";
import { uiAlert } from "@/lib/uiAlert";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import { useTranslation } from "../i18n";
import { getDateLocale } from "../lib/date-locale";
import type { Notification } from "../types";

export type FilterType = "all" | "missed" | "today" | "upcoming";

export function useNotificationsScreen() {
  const { language } = useTranslation();
  const [filterType, setFilterType] = useState<FilterType>("all");

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<Notification[]>("/api/notifications"),
  });

  const allNotifications = notificationsQuery.data || [];

  const notifications = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return allNotifications.filter((n) => {
      const txData = n.transactionData as any;
      const txDate = txData?.date;
      if (!txDate) return filterType === "all";

      const dateStr =
        typeof txDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(txDate)
          ? txDate
          : new Date(txDate).toISOString().split("T")[0];

      if (filterType === "missed") {
        return dateStr < todayStr && n.status !== "completed" && n.status !== "dismissed";
      }
      if (filterType === "today") return dateStr === todayStr;
      if (filterType === "upcoming") return dateStr > todayStr;
      return true;
    });
  }, [allNotifications, filterType]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
  };

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/api/notifications/${id}/read`, {}),
    onSuccess: invalidateAll,
  });

  const dismissMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/api/notifications/${id}/dismiss`, {}),
    onSuccess: invalidateAll,
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/api/notifications/${id}/complete`, {}),
    onSuccess: () => {
      invalidateAll();
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      uiAlert("Success", "Transaction created from notification");
    },
    onError: (error: Error) => {
      uiAlert("Error", error.message || "Failed to complete notification");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/notifications/${id}`),
    onSuccess: invalidateAll,
  });

  const handleRefresh = useCallback(() => {
    notificationsQuery.refetch();
  }, [notificationsQuery]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(getDateLocale(language), {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "missed", label: "Missed" },
    { value: "today", label: "Today" },
    { value: "upcoming", label: "Upcoming" },
  ];

  return {
    filterType,
    setFilterType,
    notificationsQuery,
    notifications,
    completeMutation,
    dismissMutation,
    deleteMutation,
    handleRefresh,
    formatDate,
    filters,
  };
}

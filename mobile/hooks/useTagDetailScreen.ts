import { uiAlert } from "@/lib/uiAlert";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient, normalizePaginatedData } from "../lib/query-client";
import { useTranslation } from "../i18n";
import { getDateLocale } from "../lib/date-locale";
import type { PersonalTag, Transaction, PaginatedResponse } from "../types";

type RouteParams = {
  TagDetail: { tagId: number };
};

interface TagStats {
  transactionCount: number;
  totalSpent: number;
  totalIncome: number;
}

export function groupByDate(transactions: Transaction[], locale: string = "en-US") {
  const map: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    const d = new Date(tx.date).toLocaleDateString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    if (!map[d]) map[d] = [];
    map[d].push(tx);
  }
  return Object.entries(map).map(([title, data]) => ({ title, data }));
}

export function useTagDetailScreen() {
  const { language } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, "TagDetail">>();
  const tagId = route.params.tagId;

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get<PaginatedResponse<PersonalTag>>("/api/tags"),
  });

  const statsQuery = useQuery({
    queryKey: ["tags", tagId, "stats"],
    queryFn: () => api.get<TagStats>(`/api/tags/${tagId}/stats`),
  });

  const transactionsQuery = useQuery({
    queryKey: ["transactions", { personalTagId: tagId }],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Transaction> | Transaction[]>(
        `/api/transactions?personalTagId=${tagId}`
      );
      if (Array.isArray(res)) return res;
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["tags", tagId, "stats"] });
    },
    onError: (error: Error) => {
      uiAlert("Error", error.message);
    },
  });

  const handleDeleteTransaction = (tx: Transaction) => {
    uiAlert("Delete Transaction", `Delete "${tx.description}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(tx.id) },
    ]);
  };

  const tags = normalizePaginatedData<PersonalTag>(tagsQuery.data);
  const currentTag = tags.find((t) => t.id === tagId);
  const stats = statsQuery.data || { transactionCount: 0, totalSpent: 0, totalIncome: 0 };
  const transactions = transactionsQuery.data || [];
  const sections = groupByDate(transactions, getDateLocale(language));

  const typeSubtitle =
    currentTag?.type === "personal"
      ? "Personal expenses"
      : currentTag?.type === "shared"
        ? "Shared expenses"
        : currentTag?.type === "person"
          ? "Expenses for this person"
          : "Project expenses";

  const isRefreshing = tagsQuery.isRefetching || statsQuery.isRefetching || transactionsQuery.isRefetching;
  const isLoading = tagsQuery.isLoading || statsQuery.isLoading;
  const isTransactionsLoading = transactionsQuery.isLoading;

  return {
    navigation,
    currentTag,
    stats,
    sections,
    typeSubtitle,
    isRefreshing,
    isLoading,
    isTransactionsLoading,
    handleDeleteTransaction,
    tagsQuery,
    statsQuery,
    transactionsQuery,
  };
}

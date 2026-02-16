import { useState, useMemo } from "react";
import { uiAlert } from "@/lib/uiAlert";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import type { WishlistItem } from "../types";

export type SortOption = "priority" | "amount" | "date";

const PRIORITY_ORDER: Record<string, number> = { high: 1, medium: 2, low: 3 };

export function useWishlistScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [sortBy, setSortBy] = useState<SortOption>("priority");

  const wishlistQuery = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => api.get<WishlistItem[]>("/api/wishlist"),
  });

  const items = wishlistQuery.data || [];

  const sorted = useMemo(() => {
    const arr = [...items];
    if (sortBy === "priority") {
      arr.sort((a, b) => (PRIORITY_ORDER[a.priority] || 2) - (PRIORITY_ORDER[b.priority] || 2));
    } else if (sortBy === "amount") {
      arr.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
    } else {
      arr.sort((a, b) => b.id - a.id);
    }
    return arr;
  }, [items, sortBy]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/wishlist/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (error: Error) => {
      uiAlert("Error", error.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isPurchased }: { id: number; isPurchased: boolean }) =>
      api.patch(`/api/wishlist/${id}`, { isPurchased }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (error: Error) => {
      uiAlert("Error", error.message);
    },
  });

  const handleDelete = (item: WishlistItem) => {
    uiAlert("Delete", `Remove "${item.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(item.id) },
    ]);
  };

  const handleTogglePurchased = (item: WishlistItem) => {
    toggleMutation.mutate({ id: item.id, isPurchased: !item.isPurchased });
  };

  return {
    navigation,
    sortBy,
    setSortBy,
    items,
    sorted,
    isLoading: wishlistQuery.isLoading,
    isRefetching: wishlistQuery.isRefetching,
    handleRefresh: () => wishlistQuery.refetch(),
    handleDelete,
    handleTogglePurchased,
  };
}

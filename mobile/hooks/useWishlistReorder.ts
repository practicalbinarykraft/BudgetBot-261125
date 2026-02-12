import { useState, useMemo } from "react";
import { Alert } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import { useTranslation } from "../i18n";
import type { WishlistItem } from "../types";

export function buildReorderPayload(
  items: WishlistItem[],
): { id: number; sortOrder: number }[] {
  return items.map((item, i) => ({ id: item.id, sortOrder: i + 1 }));
}

export function useWishlistReorder(items: WishlistItem[]) {
  const { t } = useTranslation();
  const [isReorderMode, setReorderMode] = useState(false);
  const [localOrder, setLocalOrder] = useState<WishlistItem[] | null>(null);

  // When entering reorder mode, snapshot the current order
  const reorderItems = useMemo(() => {
    if (!isReorderMode) return items;
    return localOrder || items;
  }, [isReorderMode, localOrder, items]);

  const reorderMutation = useMutation({
    mutationFn: (payload: { id: number; sortOrder: number }[]) =>
      api.patch("/api/wishlist/reorder", payload),
    onMutate: async (payload) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: ["wishlist"] });
      // Snapshot for rollback
      const previousData = queryClient.getQueryData<WishlistItem[]>(["wishlist"]);
      // Optimistic update
      if (previousData) {
        const orderMap = new Map(payload.map((p) => [p.id, p.sortOrder]));
        const updated = previousData.map((item) => ({
          ...item,
          sortOrder: orderMap.get(item.id) ?? item.sortOrder,
        }));
        queryClient.setQueryData(["wishlist"], updated);
      }
      return { previousData };
    },
    onError: (_error, _payload, context) => {
      // Rollback
      if (context?.previousData) {
        queryClient.setQueryData(["wishlist"], context.previousData);
      }
      Alert.alert(t("common.error"), _error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      setReorderMode(false);
      setLocalOrder(null);
    },
  });

  const handleDragEnd = (data: WishlistItem[]) => {
    setLocalOrder(data);
  };

  const saveOrder = () => {
    const ordered = localOrder || items;
    const payload = buildReorderPayload(ordered);
    reorderMutation.mutate(payload);
  };

  const cancelReorder = () => {
    setReorderMode(false);
    setLocalOrder(null);
  };

  return {
    isReorderMode,
    setReorderMode,
    reorderItems,
    handleDragEnd,
    saveOrder,
    cancelReorder,
    isSaving: reorderMutation.isPending,
  };
}

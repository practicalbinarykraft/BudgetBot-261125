import { useState, useMemo } from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import type { Asset, AssetSummary } from "../types";

export type TabFilter = "asset" | "liability";

export function useAssetsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [tab, setTab] = useState<TabFilter>("asset");

  const assetsQuery = useQuery({
    queryKey: ["assets"],
    queryFn: () =>
      api.get<{ assets: Asset[]; grouped: Record<string, Asset[]> }>(
        "/api/assets"
      ),
  });

  const summaryQuery = useQuery({
    queryKey: ["assets-summary"],
    queryFn: () => api.get<AssetSummary>("/api/assets/summary"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["assets-summary"] });
    },
    onError: (error: Error) => Alert.alert("Error", error.message),
  });

  const allAssets = assetsQuery.data?.assets || [];
  const filtered = useMemo(
    () => allAssets.filter((a) => a.type === tab),
    [allAssets, tab]
  );

  const summary = summaryQuery.data;

  const handleDelete = (item: Asset) => {
    Alert.alert("Delete", `Remove "${item.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(item.id),
      },
    ]);
  };

  const handleRefresh = () => {
    assetsQuery.refetch();
    summaryQuery.refetch();
  };

  return {
    navigation,
    tab,
    setTab,
    allAssets,
    filtered,
    summary,
    isLoading: assetsQuery.isLoading,
    isRefetching: assetsQuery.isRefetching,
    handleDelete,
    handleRefresh,
  };
}

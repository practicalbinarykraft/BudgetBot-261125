import { useState } from "react";
import { Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import { useTranslation } from "../i18n";
import { getDateLocale } from "../lib/date-locale";
import type { Asset, AssetValuation } from "../types";

type AssetDetailRoute = RouteProp<
  { AssetDetail: { assetId: number } },
  "AssetDetail"
>;

export interface AssetDetailData {
  asset: Asset;
  valuations: AssetValuation[];
  change: {
    changeAmount: number;
    changePercent: number;
    ownershipYears: number;
  } | null;
}

export function useAssetDetailScreen() {
  const { language } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<AssetDetailRoute>();
  const { assetId } = route.params;

  const [showCalibrate, setShowCalibrate] = useState(false);
  const [calibrateValue, setCalibrateValue] = useState("");
  const [calibrateNotes, setCalibrateNotes] = useState("");

  const detailQuery = useQuery({
    queryKey: ["assets", assetId],
    queryFn: () => api.get<AssetDetailData>(`/api/assets/${assetId}`),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/assets/${assetId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["assets-summary"] });
      navigation.goBack();
    },
    onError: (error: Error) => Alert.alert("Error", error.message),
  });

  const calibrateMutation = useMutation({
    mutationFn: (data: { newValue: string; notes: string; source: string }) =>
      api.post(`/api/assets/${assetId}/calibrate`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets", assetId] });
      queryClient.invalidateQueries({ queryKey: ["assets-summary"] });
      setShowCalibrate(false);
      setCalibrateValue("");
      setCalibrateNotes("");
      Alert.alert("Success", "Asset value updated");
    },
    onError: (error: Error) => Alert.alert("Error", error.message),
  });

  const handleDelete = () => {
    Alert.alert("Delete Asset", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(),
      },
    ]);
  };

  const handleCalibrate = () => {
    if (!calibrateValue || parseFloat(calibrateValue) <= 0) {
      Alert.alert("Error", "Please enter a valid value");
      return;
    }
    calibrateMutation.mutate({
      newValue: calibrateValue,
      notes: calibrateNotes,
      source: "manual",
    });
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(getDateLocale(language), {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return {
    detailQuery,
    showCalibrate,
    setShowCalibrate,
    calibrateValue,
    setCalibrateValue,
    calibrateNotes,
    setCalibrateNotes,
    calibrateMutation,
    handleDelete,
    handleCalibrate,
    formatDate,
  };
}

import { Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import type { PriceHistoryData } from "../types";

type ProductDetailRoute = RouteProp<
  { ProductDetail: { productId: number } },
  "ProductDetail"
>;

export function useProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<ProductDetailRoute>();
  const { productId } = route.params;

  const historyQuery = useQuery({
    queryKey: ["product-catalog", productId, "price-history"],
    queryFn: () =>
      api.get<PriceHistoryData>(
        `/api/product-catalog/${productId}/price-history`
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/product-catalog/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-catalog"] });
      navigation.goBack();
    },
    onError: (error: Error) => Alert.alert("Error", error.message),
  });

  const handleDelete = () => {
    Alert.alert("Delete Product", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(),
      },
    ]);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return {
    historyQuery,
    handleDelete,
    formatDate,
  };
}

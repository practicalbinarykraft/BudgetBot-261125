import { useCallback } from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import type { Category, PaginatedResponse } from "../types";

export function useCategoriesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      api.get<PaginatedResponse<Category>>("/api/categories?limit=100"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  const allCategories = data?.data || [];

  const incomeCategories = allCategories.filter(
    (c) =>
      c.type === "income" &&
      (c.applicableTo === "transaction" || c.applicableTo === "both")
  );
  const expenseCategories = allCategories.filter(
    (c) =>
      c.type === "expense" &&
      (c.applicableTo === "transaction" || c.applicableTo === "both")
  );

  const handleDelete = useCallback(
    (category: Category) => {
      Alert.alert(
        "Delete Category",
        `Delete "${category.name}"? Any budgets linked to this category will also be removed.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteMutation.mutate(category.id),
          },
        ]
      );
    },
    [deleteMutation]
  );

  const handlePress = useCallback(
    (category: Category) => {
      navigation.navigate("AddEditCategory", { category });
    },
    [navigation]
  );

  return {
    navigation,
    isLoading,
    isRefetching,
    refetch,
    incomeCategories,
    expenseCategories,
    handleDelete,
    handlePress,
  };
}

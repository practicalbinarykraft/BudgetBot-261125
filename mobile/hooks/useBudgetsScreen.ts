import { useCallback } from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import type { LimitProgress } from "../types";

export function useBudgetsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["limits"],
    queryFn: () => api.get<LimitProgress[]>("/api/limits"),
  });

  const deleteMutation = useMutation({
    mutationFn: (budgetId: number) => api.delete(`/api/budgets/${budgetId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["limits"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (error: Error) => Alert.alert("Error", error.message),
  });

  const limits = data || [];
  const exceededBudgets = limits.filter((b) => b.percentage > 100);

  const handleDelete = useCallback(
    (item: LimitProgress) => {
      Alert.alert(
        "Delete Budget",
        `Delete budget for "${item.categoryName}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteMutation.mutate(item.budgetId),
          },
        ]
      );
    },
    [deleteMutation]
  );

  const handleEdit = useCallback(
    (item: LimitProgress) => {
      navigation.navigate("AddEditBudget", {
        budget: {
          id: item.budgetId,
          categoryId: item.categoryId,
          limitAmount: item.limitAmount,
          period: item.period,
          periodStart: item.periodStart,
        },
      });
    },
    [navigation]
  );

  const navigateToAddBudget = useCallback(() => {
    navigation.navigate("AddEditBudget", {});
  }, [navigation]);

  return {
    limits,
    exceededBudgets,
    isLoading,
    isRefetching,
    refetch,
    handleDelete,
    handleEdit,
    navigateToAddBudget,
  };
}

export function getStatusColor(
  percentage: number,
  theme: { destructive: string; warning: string; success: string }
) {
  if (percentage > 100) return theme.destructive;
  if (percentage >= 75) return theme.warning;
  return theme.success;
}

export function getStatusLabel(percentage: number) {
  if (percentage > 100) return "Budget exceeded";
  if (percentage >= 75) return "Approaching limit";
  return null;
}

export function getPeriodLabel(period: string) {
  switch (period) {
    case "week":
      return "Weekly limit";
    case "month":
      return "Monthly limit";
    case "year":
      return "Yearly limit";
    default:
      return "Monthly limit";
  }
}

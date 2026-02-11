import { useState } from "react";
import { Alert } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import type { Category, PaginatedResponse } from "../types";

type Period = "week" | "month" | "year";

interface BudgetParam {
  id: number;
  categoryId: number;
  limitAmount: string;
  period: string;
  periodStart: string;
}

type RouteParams = {
  AddEditBudget: { budget?: BudgetParam };
};

export function useAddEditBudgetScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, "AddEditBudget">>();
  const existing = route.params?.budget;
  const isEditing = !!existing;

  const [categoryId, setCategoryId] = useState<number | null>(
    existing?.categoryId || null
  );
  const [limitAmount, setLimitAmount] = useState(
    existing?.limitAmount || ""
  );
  const [period, setPeriod] = useState<Period>(
    (existing?.period as Period) || "month"
  );

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      api.get<PaginatedResponse<Category>>("/api/categories?limit=100"),
  });

  const expenseCategories = (categoriesQuery.data?.data || []).filter(
    (c) => c.type === "expense"
  );

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/api/budgets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["limits"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      navigation.goBack();
    },
    onError: (error: Error) => Alert.alert("Error", error.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      api.patch(`/api/budgets/${existing!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["limits"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      navigation.goBack();
    },
    onError: (error: Error) => Alert.alert("Error", error.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    if (!categoryId) {
      Alert.alert("Error", "Please select a category");
      return;
    }
    if (!limitAmount || parseFloat(limitAmount) <= 0) {
      Alert.alert("Error", "Please enter a valid limit amount");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    if (isEditing) {
      updateMutation.mutate({
        categoryId,
        limitAmount,
        period,
      });
    } else {
      createMutation.mutate({
        categoryId,
        limitAmount,
        period,
        startDate: today,
      });
    }
  };

  const periods: { key: Period; label: string }[] = [
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "year", label: "Year" },
  ];

  return {
    isEditing,
    categoryId,
    setCategoryId,
    limitAmount,
    setLimitAmount,
    period,
    setPeriod,
    expenseCategories,
    isPending,
    handleSave,
    periods,
  };
}

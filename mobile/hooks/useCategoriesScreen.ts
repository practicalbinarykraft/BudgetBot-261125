import { useCallback, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient, normalizePaginatedData, categoriesQueryKey } from "../lib/query-client";
import { useToast } from "../components/Toast";
import type { Category, PaginatedResponse } from "../types";

export function useCategoriesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const toast = useToast();
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const { data, isLoading, isRefetching, isError, refetch } = useQuery({
    queryKey: categoriesQueryKey(),
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
      toast.show(error.message, "error");
    },
  });

  const allCategories = normalizePaginatedData<Category>(data);

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
      setCategoryToDelete(category);
    },
    [],
  );

  const confirmDelete = useCallback(() => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete.id);
      setCategoryToDelete(null);
    }
  }, [categoryToDelete, deleteMutation]);

  const cancelDelete = useCallback(() => {
    setCategoryToDelete(null);
  }, []);

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
    isError,
    refetch,
    incomeCategories,
    expenseCategories,
    handleDelete,
    handlePress,
    categoryToDelete,
    confirmDelete,
    cancelDelete,
  };
}

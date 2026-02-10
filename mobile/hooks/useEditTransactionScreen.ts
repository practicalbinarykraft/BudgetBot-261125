import { useState } from "react";
import { Alert } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import type { Transaction, Category, PersonalTag, PaginatedResponse } from "../types";

export type FinancialType = "essential" | "discretionary" | "asset" | "liability";

type RouteParams = {
  EditTransaction: { transaction: Transaction };
};

export const financialTypes: { key: FinancialType; label: string }[] = [
  { key: "essential", label: "Essential" },
  { key: "discretionary", label: "Discretionary" },
  { key: "asset", label: "Asset" },
  { key: "liability", label: "Liability" },
];

export const currencies = [
  { key: "USD", label: "USD ($)" },
  { key: "RUB", label: "RUB (\u20BD)" },
  { key: "IDR", label: "IDR (Rp)" },
];

export function useEditTransactionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, "EditTransaction">>();
  const tx = route.params.transaction;

  const [type, setType] = useState<"income" | "expense">(tx.type);
  const [amount, setAmount] = useState(tx.amount);
  const [currency, setCurrency] = useState(tx.currency || "USD");
  const [description, setDescription] = useState(tx.description);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    tx.category || null
  );
  const [financialType, setFinancialType] = useState<FinancialType>(
    (tx.financialType as FinancialType) || "discretionary"
  );
  const [personalTagId, setPersonalTagId] = useState<number | null>(
    tx.personalTagId ?? null
  );
  const [date, setDate] = useState(tx.date);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      api.get<PaginatedResponse<Category>>("/api/categories?limit=100"),
  });

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get<PersonalTag[]>("/api/tags"),
  });

  const allCategories = categoriesQuery.data?.data || [];
  const tags = tagsQuery.data || [];

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/api/transactions/${tx.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-by-category"] });
      navigation.goBack();
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return;
    }

    updateMutation.mutate({
      type,
      amount,
      amountUsd: amount,
      description: description.trim(),
      category: selectedCategory || undefined,
      currency,
      personalTagId,
      financialType,
      date,
    });
  };

  return {
    navigation,
    type,
    setType,
    amount,
    setAmount,
    currency,
    setCurrency,
    description,
    setDescription,
    selectedCategory,
    setSelectedCategory,
    financialType,
    setFinancialType,
    personalTagId,
    setPersonalTagId,
    date,
    setDate,
    allCategories,
    tags,
    updateMutation,
    handleSubmit,
  };
}

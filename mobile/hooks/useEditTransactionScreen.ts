import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient, normalizePaginatedData, categoriesQueryKey } from "../lib/query-client";
import { useTranslation } from "../i18n";
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
  const { t } = useTranslation();
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
    queryKey: categoriesQueryKey(),
    queryFn: () =>
      api.get<PaginatedResponse<Category>>("/api/categories?limit=100"),
  });

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get<PaginatedResponse<PersonalTag>>("/api/tags"),
  });

  const allCategories = normalizePaginatedData<Category>(categoriesQuery.data);
  const tags = normalizePaginatedData<PersonalTag>(tagsQuery.data);

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
      Alert.alert(t("common.error"), error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/transactions/${tx.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-trend"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      navigation.goBack();
    },
    onError: (error: Error) => {
      Alert.alert(t("common.error"), error.message);
    },
  });

  const handleDelete = useCallback(() => {
    Alert.alert(
      t("common.delete"),
      `${t("transactions.delete_confirm")} "${tx.description}"?`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  }, [deleteMutation, tx.description, t]);

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert(t("common.error"), t("transactions.error_invalid_amount"));
      return;
    }
    if (!description.trim()) {
      Alert.alert(t("common.error"), t("transactions.error_enter_description"));
      return;
    }

    updateMutation.mutate({
      type,
      amount,
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
    deleteMutation,
    handleSubmit,
    handleDelete,
  };
}

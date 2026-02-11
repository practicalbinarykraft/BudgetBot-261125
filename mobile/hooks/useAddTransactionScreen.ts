import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import { useTranslation } from "../i18n";
import type { Category, Wallet, PersonalTag, PaginatedResponse } from "../types";

interface Prefill {
  amount?: string;
  description?: string;
  type?: "expense" | "income";
}

export function useAddTransactionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const prefill = (route.params as { prefill?: Prefill } | undefined)?.prefill;

  const [type, setType] = useState<"expense" | "income">(prefill?.type || "expense");
  const [amount, setAmount] = useState(prefill?.amount || "");
  const [description, setDescription] = useState(prefill?.description || "");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
  const [personalTagId, setPersonalTagId] = useState<number | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<PaginatedResponse<Category>>("/api/categories?limit=50"),
  });

  const walletsQuery = useQuery({
    queryKey: ["wallets"],
    queryFn: () => api.get<PaginatedResponse<Wallet>>("/api/wallets?limit=50"),
  });

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get<PersonalTag[]>("/api/tags"),
  });

  const categories = (categoriesQuery.data?.data || []).filter(
    (c) => c.type === type
  );
  const wallets = walletsQuery.data?.data || [];
  const tags = tagsQuery.data || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/api/transactions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      navigation.goBack();
    },
    onError: (error: Error) => {
      Alert.alert(t("common.error"), error.message);
    },
  });

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert(t("common.error"), t("transactions.error_invalid_amount"));
      return;
    }
    if (!description.trim()) {
      Alert.alert(t("common.error"), t("transactions.error_enter_description"));
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    createMutation.mutate({
      type,
      amount,
      description: description.trim(),
      categoryId: selectedCategoryId,
      walletId: selectedWalletId,
      personalTagId,
      date: today,
      currency: "USD",
      source: "manual",
    });
  };

  return {
    type, setType,
    amount, setAmount,
    description, setDescription,
    selectedCategoryId, setSelectedCategoryId,
    selectedWalletId, setSelectedWalletId,
    personalTagId, setPersonalTagId,
    categories, wallets, tags,
    createMutation,
    handleSubmit,
    navigation,
  };
}

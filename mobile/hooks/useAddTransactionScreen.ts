import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import { useTranslation } from "../i18n";
import type { Category, Wallet, PersonalTag, PaginatedResponse } from "../types";

interface ExchangeRatesResponse {
  rates: Record<string, number>;
  lastUpdated: string;
  source: string;
}

interface Prefill {
  amount?: string;
  description?: string;
  type?: "expense" | "income";
  currency?: string;
  category?: string;
}

export function computeConvertedAmount(
  amount: string,
  currency: string,
  rates: Record<string, number>,
): string | null {
  if (currency === "USD" || !amount) return null;
  const rate = rates[currency];
  if (!rate || rate === 0) return null;
  return (parseFloat(amount) / rate).toFixed(2);
}

export function useAddTransactionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const params = route.params as { prefill?: Prefill; selectedCategoryId?: number } | undefined;
  const prefill = params?.prefill;

  const [type, setType] = useState<"expense" | "income">(prefill?.type || "expense");
  const [amount, setAmount] = useState(prefill?.amount || "");
  const [description, setDescription] = useState(prefill?.description || "");
  const [currency, setCurrency] = useState(prefill?.currency || "USD");
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

  const exchangeRatesQuery = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: () => api.get<ExchangeRatesResponse>("/api/exchange-rates"),
  });

  const categories = (categoriesQuery.data?.data || []).filter(
    (c) => c.type === type
  );
  const categoriesLoading = categoriesQuery.isLoading;
  const wallets = walletsQuery.data?.data || [];
  const tags = tagsQuery.data || [];

  const rates = exchangeRatesQuery.data?.rates || {};
  const convertedAmount = computeConvertedAmount(amount, currency, rates);

  // Reset category when switching expense↔income (category belongs to a type)
  useEffect(() => {
    setSelectedCategoryId(null);
  }, [type]);

  // Handle category selected from CategoryPicker
  useEffect(() => {
    if (params?.selectedCategoryId) {
      setSelectedCategoryId(params.selectedCategoryId);
    }
  }, [params?.selectedCategoryId]);

  // Auto-match prefill category name to existing categories
  useEffect(() => {
    if (prefill?.category && categories.length > 0 && selectedCategoryId === null) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === prefill.category!.toLowerCase(),
      );
      if (match) setSelectedCategoryId(match.id);
    }
  }, [prefill?.category, categories.length]);

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
      currency,
      source: "manual",
    });
  };

  return {
    type, setType,
    amount, setAmount,
    description, setDescription,
    currency, setCurrency,
    selectedCategoryId, setSelectedCategoryId,
    selectedWalletId, setSelectedWalletId,
    personalTagId, setPersonalTagId,
    categories, categoriesLoading, wallets, tags,
    convertedAmount,
    createMutation,
    handleSubmit,
    navigation,
  };
}

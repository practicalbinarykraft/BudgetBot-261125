import { useState, useEffect } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient, normalizePaginatedData, categoriesQueryKey } from "../lib/query-client";
import { useTranslation } from "../i18n";
import { useToast } from "../components/Toast";
import { completeTutorialStep } from "../lib/tutorial-step";
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
  tutorialSource?: "voice" | "receipt";
}

export function pickDefaultWalletId(wallets: Wallet[]): number | null {
  if (wallets.length === 0) return null;
  const primary = wallets.find((w) => w.isPrimary === 1);
  if (primary) return primary.id;
  // Fallback: highest balanceUsd
  const sorted = [...wallets].sort(
    (a, b) => parseFloat(b.balanceUsd || "0") - parseFloat(a.balanceUsd || "0"),
  );
  return sorted[0].id;
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
  const toast = useToast();
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
    queryKey: categoriesQueryKey(),
    queryFn: () => api.get<PaginatedResponse<Category>>("/api/categories?limit=100"),
  });

  const walletsQuery = useQuery({
    queryKey: ["wallets"],
    queryFn: () => api.get<PaginatedResponse<Wallet>>("/api/wallets?limit=50"),
  });

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get<PaginatedResponse<PersonalTag>>("/api/tags"),
  });

  const exchangeRatesQuery = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: () => api.get<ExchangeRatesResponse>("/api/exchange-rates"),
  });

  const categories = normalizePaginatedData<Category>(categoriesQuery.data)
    .filter((c) => c.type === type)
    .sort((a, b) => {
      // Selected category always first
      if (a.id === selectedCategoryId) return -1;
      if (b.id === selectedCategoryId) return 1;
      return 0;
    });
  const categoriesLoading = categoriesQuery.isLoading;
  const wallets = walletsQuery.data?.data || [];
  const tags = normalizePaginatedData<PersonalTag>(tagsQuery.data);

  const rates = exchangeRatesQuery.data?.rates || {};
  const convertedAmount = computeConvertedAmount(amount, currency, rates);

  // Auto-select primary wallet on first load (don't override user's manual pick)
  const [walletTouched, setWalletTouched] = useState(false);
  useEffect(() => {
    if (!walletTouched && wallets.length > 0 && selectedWalletId === null) {
      const defaultId = pickDefaultWalletId(wallets);
      if (defaultId !== null) setSelectedWalletId(defaultId);
    }
  }, [wallets, walletTouched, selectedWalletId]);

  const handleSetWalletId = (id: number | null) => {
    setWalletTouched(true);
    setSelectedWalletId(id);
  };

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

  // Category hint — from prefill (navigation) or inline voice
  const [categoryHint, setCategoryHint] = useState<string | null>(prefill?.category || null);
  const [categorySuggestionDismissed, setCategorySuggestionDismissed] = useState(false);

  // Auto-match category hint to existing categories (exact match → auto-select)
  useEffect(() => {
    if (categoryHint && categories.length > 0 && selectedCategoryId === null) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === categoryHint.toLowerCase(),
      );
      if (match) setSelectedCategoryId(match.id);
    }
  }, [categoryHint, categories.length]);

  // Build suggested categories from AI category hint (fuzzy match top 3)
  const suggestedCategories = (() => {
    if (!categoryHint || categories.length === 0 || categorySuggestionDismissed) return [];
    const hint = categoryHint.toLowerCase();
    // Exact match already handled above — show suggestions when no exact match
    const exact = categories.find((c) => c.name.toLowerCase() === hint);
    if (exact && selectedCategoryId === exact.id) return [];
    // Score by substring match or word overlap
    const scored = categories.map((c) => {
      const name = c.name.toLowerCase();
      if (name.includes(hint) || hint.includes(name)) return { cat: c, score: 3 };
      // Word overlap
      const hintWords = hint.split(/[\s&,]+/);
      const nameWords = name.split(/[\s&,]+/);
      const overlap = hintWords.filter((w) => nameWords.some((nw) => nw.includes(w) || w.includes(nw))).length;
      return { cat: c, score: overlap };
    });
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => s.cat);
  })();

  const hasCategorySuggestion = suggestedCategories.length > 0 && selectedCategoryId === null && !!categoryHint;

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/api/transactions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      completeTutorialStep("add_transaction");
      if (prefill?.tutorialSource === "voice") {
        completeTutorialStep("voice_input");
        navigation.goBack();
      } else if (prefill?.tutorialSource === "receipt") {
        completeTutorialStep("receipt_scan");
        (navigation as any).navigate("Main");
      } else {
        navigation.goBack();
      }
    },
    onError: (error: Error) => {
      toast.show(error.message, "error");
    },
  });

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.show(t("transactions.error_invalid_amount"), "error");
      return;
    }
    if (!description.trim()) {
      toast.show(t("transactions.error_enter_description"), "error");
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
    selectedWalletId, setSelectedWalletId: handleSetWalletId,
    personalTagId, setPersonalTagId,
    categories, categoriesLoading, wallets, tags,
    convertedAmount,
    suggestedCategories, hasCategorySuggestion,
    setCategoryHint,
    dismissCategorySuggestion: () => setCategorySuggestionDismissed(true),
    createMutation,
    handleSubmit,
    navigation,
  };
}

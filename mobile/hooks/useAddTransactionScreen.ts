import { useState } from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import type { Category, Wallet, PersonalTag, PaginatedResponse } from "../types";

export function useAddTransactionScreen() {
  const navigation = useNavigation();

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
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

    const today = new Date().toISOString().split("T")[0];

    createMutation.mutate({
      type,
      amount,
      amountUsd: amount,
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

import { useState } from "react";
import { uiAlert } from "@/lib/uiAlert";
import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";

export const FREQUENCY_OPTIONS: { key: string; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "yearly", label: "Yearly" },
];

export const CURRENCY_OPTIONS = [
  { key: "USD", label: "USD ($)" },
  { key: "RUB", label: "RUB (\u20BD)" },
  { key: "EUR", label: "EUR (\u20AC)" },
  { key: "KRW", label: "KRW (\u20A9)" },
  { key: "CNY", label: "CNY (\u00A5)" },
  { key: "IDR", label: "IDR (Rp)" },
];

export function useAddRecurringScreen() {
  const navigation = useNavigation();

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [nextDate, setNextDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/api/recurring", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      navigation.goBack();
    },
    onError: (error: Error) => {
      uiAlert("Error", error.message);
    },
  });

  const handleSubmit = () => {
    if (!description.trim()) {
      uiAlert("Error", "Please enter a description");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      uiAlert("Error", "Please enter a valid amount");
      return;
    }

    createMutation.mutate({
      type,
      amount,
      description: description.trim(),
      category: category.trim() || null,
      frequency,
      nextDate,
      isActive: true,
      currency,
    });
  };

  return {
    type, setType,
    amount, setAmount,
    currency, setCurrency,
    description, setDescription,
    category, setCategory,
    frequency, setFrequency,
    nextDate, setNextDate,
    createMutation,
    handleSubmit,
    navigation,
  };
}

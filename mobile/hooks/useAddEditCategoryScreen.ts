import { useState } from "react";
import { Alert } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient, categoriesQueryKey } from "../lib/query-client";
import type { Category } from "../types";

export const EMOJI_OPTIONS = [
  "\u{1F354}", "\u{1F697}", "\u{1F6CD}\uFE0F", "\u{1F3AE}", "\u{1F4B3}", "\u{1F4B0}", "\u{1F4BB}", "\u{1F3E0}",
  "\u{1F3AC}", "\u{1F4DA}", "\u2708\uFE0F", "\u{1F3E5}", "\u{1F381}", "\u2615", "\u{1F527}", "\u{1F4F1}",
  "\u{1F455}", "\u{1F415}", "\u{1F3CB}\uFE0F", "\u{1F3B5}", "\u{1F48A}", "\u{1F68C}", "\u{1F3E6}", "\u2753",
];

export const COLOR_OPTIONS = [
  "#ef4444", "#f97316", "#f59e0b", "#10b981",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
  "#ec4899", "#dc2626", "#059669", "#0891b2",
];

type RouteParams = {
  AddEditCategory: { category?: Category };
};

export function useAddEditCategoryScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, "AddEditCategory">>();
  const existing = route.params?.category;
  const isEditing = !!existing;

  const [name, setName] = useState(existing?.name || "");
  const [type, setType] = useState<"expense" | "income">(
    existing?.type || "expense"
  );
  const [icon, setIcon] = useState(existing?.icon || "\u{1F354}");
  const [color, setColor] = useState(existing?.color || "#3b82f6");

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/api/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      navigation.goBack();
    },
    onError: (error: Error) => Alert.alert("Error", error.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      api.patch(`/api/categories/${existing!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      navigation.goBack();
    },
    onError: (error: Error) => Alert.alert("Error", error.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a category name");
      return;
    }

    if (isEditing) {
      updateMutation.mutate({ name: name.trim(), icon, color });
    } else {
      createMutation.mutate({ name: name.trim(), type, icon, color });
    }
  };

  return {
    name, setName,
    type, setType,
    icon, setIcon,
    color, setColor,
    isEditing,
    isPending,
    handleSave,
  };
}

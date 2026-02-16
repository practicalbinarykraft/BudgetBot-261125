import { useState } from "react";
import { uiAlert } from "@/lib/uiAlert";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import type { PersonalTag } from "../types";

type RouteParams = {
  AddEditTag: { tag?: PersonalTag };
};

export const ICON_OPTIONS: { name: string; feather: keyof typeof Feather.glyphMap }[] = [
  { name: "User", feather: "user" },
  { name: "Heart", feather: "heart" },
  { name: "Home", feather: "home" },
  { name: "Users", feather: "users" },
  { name: "Baby", feather: "smile" },
  { name: "UserPlus", feather: "user-plus" },
  { name: "Briefcase", feather: "briefcase" },
  { name: "Gift", feather: "gift" },
  { name: "Dog", feather: "gitlab" },
  { name: "Cat", feather: "star" },
];

export const COLOR_OPTIONS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f97316",
  "#10b981", "#06b6d4", "#6366f1", "#84cc16",
];

export const TYPE_OPTIONS: { key: string; label: string }[] = [
  { key: "person", label: "Person" },
  { key: "personal", label: "Personal" },
  { key: "shared", label: "Shared" },
  { key: "project", label: "Project" },
];

export function useAddEditTagScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, "AddEditTag">>();
  const editTag = route.params?.tag;

  const [name, setName] = useState(editTag?.name || "");
  const [icon, setIcon] = useState(editTag?.icon || "User");
  const [color, setColor] = useState(editTag?.color || "#3b82f6");
  const [type, setType] = useState(editTag?.type || "person");

  const createMutation = useMutation({
    mutationFn: (data: { name: string; icon: string; color: string; type: string }) =>
      api.post("/api/tags", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      navigation.goBack();
    },
    onError: (error: Error) => {
      uiAlert("Error", error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; icon: string; color: string; type: string }) =>
      api.patch(`/api/tags/${editTag!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      navigation.goBack();
    },
    onError: (error: Error) => {
      uiAlert("Error", error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/tags/${editTag!.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      navigation.goBack();
    },
    onError: (error: Error) => {
      uiAlert("Error", error.message);
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      uiAlert("Error", "Please enter a tag name");
      return;
    }
    const data = { name: name.trim(), icon, color, type };
    if (editTag) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    uiAlert("Delete Tag", `Delete "${editTag?.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() },
    ]);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return {
    name, setName,
    icon, setIcon,
    color, setColor,
    type, setType,
    editTag,
    isPending,
    handleSubmit,
    handleDelete,
    navigation,
  };
}

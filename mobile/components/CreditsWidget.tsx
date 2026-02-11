import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ThemedText } from "./ThemedText";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api-client";
import type { CreditsData } from "../types";

export default function CreditsWidget() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const { data, isLoading } = useQuery<CreditsData>({
    queryKey: ["credits"],
    queryFn: () => api.get<CreditsData>("/api/credits"),
    refetchInterval: 30000,
  });

  if (isLoading || !data) return null;

  const isByok = data.billingMode === "byok";
  const isLow = data.messagesRemaining < 5;
  const isVeryLow = data.messagesRemaining === 0;

  const textColor = isByok
    ? "#22c55e"
    : isVeryLow
      ? "#dc2626"
      : isLow
        ? "#f59e0b"
        : theme.primary;

  return (
    <Pressable
      onPress={() => navigation.navigate("Billing")}
      style={[styles.container, { backgroundColor: textColor + "15", borderColor: textColor + "30" }]}
    >
      <Feather
        name={isByok ? "key" : "zap"}
        size={14}
        color={textColor}
      />
      <ThemedText type="small" color={textColor} style={styles.text}>
        {isByok ? "BYOK" : String(data.messagesRemaining)}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  text: {
    fontWeight: "600",
  },
});

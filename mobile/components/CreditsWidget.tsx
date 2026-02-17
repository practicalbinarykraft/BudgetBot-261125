import React, { useRef, useEffect } from "react";
import { Pressable, Animated, StyleSheet, Platform } from "react-native";
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

  const prevBalance = useRef(data?.messagesRemaining);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (data && prevBalance.current !== undefined && data.messagesRemaining > prevBalance.current) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 200, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: Platform.OS !== "web" }),
      ]).start();
    }
    prevBalance.current = data?.messagesRemaining;
  }, [data?.messagesRemaining]);

  if (isLoading || !data) return null;

  const remaining = Math.max(0, data.messagesRemaining);
  const isByok = data.billingMode === "byok";
  const isLow = remaining < 5;
  const isVeryLow = remaining === 0;

  const textColor = isByok
    ? "#22c55e"
    : isVeryLow
      ? "#dc2626"
      : isLow
        ? "#f59e0b"
        : theme.primary;

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
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
          {isByok ? "BYOK" : String(remaining)}
        </ThemedText>
      </Pressable>
    </Animated.View>
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

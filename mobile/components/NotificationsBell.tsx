import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api-client";

export default function NotificationsBell() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const { data } = useQuery<{ count: number }>({
    queryKey: ["notifications-unread"],
    queryFn: () => api.get<{ count: number }>("/api/notifications/unread-count"),
    refetchInterval: 30000,
  });

  const unreadCount = data?.count || 0;

  return (
    <Pressable
      onPress={() => navigation.navigate("Notifications")}
      style={styles.container}
    >
      <Feather name="bell" size={20} color={theme.textSecondary} />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <ThemedText type="caption" color="#ffffff" style={styles.badgeText}>
            {unreadCount > 99 ? "99+" : String(unreadCount)}
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontWeight: "700",
    fontSize: 10,
    lineHeight: 14,
  },
});

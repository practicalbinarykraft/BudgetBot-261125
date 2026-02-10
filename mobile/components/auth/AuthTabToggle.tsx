import React from "react";
import { View, Pressable } from "react-native";
import { ThemedText } from "../ThemedText";
import { useTheme } from "../../hooks/useTheme";
import { authStyles as styles } from "./authStyles";

interface AuthTabToggleProps {
  activeTab: "login" | "register";
  onTabChange: (tab: "login" | "register") => void;
}

export function AuthTabToggle({ activeTab, onTabChange }: AuthTabToggleProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.tabList, { backgroundColor: theme.muted }]}>
      <Pressable
        onPress={() => onTabChange("login")}
        style={[
          styles.tabTrigger,
          activeTab === "login"
            ? { backgroundColor: theme.background }
            : null,
        ]}
      >
        <ThemedText
          type="bodySm"
          color={activeTab === "login" ? theme.text : theme.textSecondary}
          style={styles.tabText}
        >
          {"Login"}
        </ThemedText>
      </Pressable>
      <Pressable
        onPress={() => onTabChange("register")}
        style={[
          styles.tabTrigger,
          activeTab === "register"
            ? { backgroundColor: theme.background }
            : null,
        ]}
      >
        <ThemedText
          type="bodySm"
          color={activeTab === "register" ? theme.text : theme.textSecondary}
          style={styles.tabText}
        >
          {"Register"}
        </ThemedText>
      </Pressable>
    </View>
  );
}

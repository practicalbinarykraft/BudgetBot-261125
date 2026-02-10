import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

export function TypingIndicator() {
  const { theme } = useTheme();

  return (
    <View style={[styles.messageRow, styles.messageRowAssistant]}>
      <View
        style={[styles.avatar, { backgroundColor: theme.primary + "20" }]}
      >
        <Feather name="cpu" size={16} color={theme.primary} />
      </View>
      <View
        style={[
          styles.messageBubble,
          styles.assistantBubble,
          { backgroundColor: theme.card, borderColor: theme.cardBorder },
        ]}
      >
        <View style={styles.typingRow}>
          <ActivityIndicator size="small" color={theme.primary} />
          <ThemedText type="small" color={theme.textSecondary}>
            {"AI is thinking..."}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
    maxWidth: "90%",
  },
  messageRowAssistant: { alignSelf: "flex-start" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  messageBubble: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    maxWidth: "80%",
    flexShrink: 1,
  },
  assistantBubble: { borderWidth: 1 },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
});

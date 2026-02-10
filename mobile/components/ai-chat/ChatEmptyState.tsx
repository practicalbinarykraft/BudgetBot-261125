import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

const QUICK_ACTIONS = [
  {
    icon: "credit-card" as const,
    label: "Ask about budget",
    question: "How should I distribute my budget?",
  },
  {
    icon: "trending-down" as const,
    label: "Analyze spending",
    question: "Analyze my spending patterns",
  },
  {
    icon: "zap" as const,
    label: "Savings tips",
    question: "Give me tips on how to save money",
  },
];

interface Props {
  onQuickAction: (question: string) => void;
}

export function ChatEmptyState({ onQuickAction }: Props) {
  const { theme } = useTheme();

  return (
    <View style={styles.emptyState}>
      <Feather name="message-circle" size={48} color={theme.primary} />
      <ThemedText type="h4" style={styles.emptyTitle}>
        {"Start a conversation"}
      </ThemedText>
      <ThemedText
        type="bodySm"
        color={theme.textSecondary}
        style={styles.emptySubtitle}
      >
        {"Ask about your finances or use quick actions below"}
      </ThemedText>

      <View style={styles.quickActions}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.label}
            onPress={() => onQuickAction(action.question)}
            style={[
              styles.quickActionBtn,
              {
                backgroundColor: theme.secondary,
                borderColor: theme.border,
              },
            ]}
          >
            <Feather name={action.icon} size={14} color={theme.primary} />
            <ThemedText type="small">{action.label}</ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyTitle: { fontWeight: "600" },
  emptySubtitle: { textAlign: "center" },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  quickActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
});

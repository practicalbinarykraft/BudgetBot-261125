import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { Badge } from "./Badge";
import { TagBadge } from "./TagBadge";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import type { Transaction, PersonalTag } from "../types";

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  categoryLabel?: string;
  tag?: Pick<PersonalTag, "icon" | "name" | "color"> | null;
}

export function TransactionItem({ transaction, onPress, categoryLabel, tag }: TransactionItemProps) {
  const { theme } = useTheme();
  const isIncome = transaction.type === "income";
  const amountColor = isIncome ? theme.income : theme.expense;
  const sign = isIncome ? "+" : "-";

  const formattedDate = new Date(transaction.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const amount = parseFloat(transaction.amountUsd).toFixed(2);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: pressed ? theme.muted : theme.muted + "80" },
      ]}
    >
      <View style={styles.left}>
        <ThemedText type="bodySm" style={styles.description} numberOfLines={1}>
          {transaction.description}
        </ThemedText>
        <View style={styles.meta}>
          <ThemedText type="small" color={theme.textSecondary}>
            {formattedDate}
          </ThemedText>
          {tag ? <TagBadge tag={tag} /> : null}
          {categoryLabel ? (
            <Badge label={categoryLabel} variant="secondary" />
          ) : null}
        </View>
      </View>
      <View style={styles.right}>
        <ThemedText type="bodySm" mono color={amountColor} style={{ fontWeight: "600" }}>
          {sign}${amount}
        </ThemedText>
        {transaction.currency !== "USD" ? (
          <ThemedText type="small" color={theme.textTertiary}>
            {parseFloat(transaction.amount).toFixed(2)} {transaction.currency}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  left: {
    flex: 1,
    marginRight: Spacing.md,
    gap: 4,
  },
  description: {
    fontWeight: "500",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  right: {
    alignItems: "flex-end",
    gap: 2,
  },
});

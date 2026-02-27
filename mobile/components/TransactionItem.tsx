import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";
import { TagBadge } from "./TagBadge";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { getDateLocale } from "../lib/date-locale";
import type { Transaction, Category, PersonalTag } from "../types";

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  category?: Category;
  tag?: Pick<PersonalTag, "icon" | "name" | "color"> | null;
}

export function TransactionItem({ transaction, onPress, category, tag }: TransactionItemProps) {
  const { theme } = useTheme();
  const { language } = useTranslation();
  const isIncome = transaction.type === "income";
  const amountColor = isIncome ? theme.income : theme.expense;
  const sign = isIncome ? "+" : "-";

  const formattedDate = new Date(transaction.date).toLocaleDateString(getDateLocale(language), {
    day: "numeric",
    month: "short",
    year: "numeric",
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
        <ThemedText type="small" color={theme.textSecondary}>
          {formattedDate}
        </ThemedText>
        <View style={styles.badges}>
          {tag ? <TagBadge tag={tag} /> : null}
          {category ? (
            <View style={[styles.catBadge, { backgroundColor: (category.color || "#6b7280") + "20" }]}>
              <ThemedText type="small" color={category.color || "#6b7280"} style={styles.catText}>
                {category.name}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.right}>
        <ThemedText type="bodySm" mono color={amountColor} style={styles.amount}>
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
    alignItems: "flex-start",
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
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
    minHeight: 22,
  },
  amount: {
    fontWeight: "600",
  },
  right: {
    alignItems: "flex-end",
    gap: 2,
  },
  catBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  catText: {
    fontWeight: "500",
  },
});

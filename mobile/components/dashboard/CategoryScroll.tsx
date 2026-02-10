import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import CircularProgress from "../CircularProgress";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { formatAmount, type CategoryBreakdownItem } from "../../hooks/useDashboardScreen";
import type { Budget } from "../../types";

interface CategoryScrollProps {
  topCategories: CategoryBreakdownItem[];
  budgetByCategoryId: Record<number, Budget>;
}

export function CategoryScroll({
  topCategories,
  budgetByCategoryId,
}: CategoryScrollProps) {
  const { theme } = useTheme();

  if (topCategories.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesScroll}
      style={styles.categoriesContainer}
    >
      {topCategories.map((cat) => {
        const iconDisplay =
          cat.icon && !cat.icon.match(/^[A-Z][a-zA-Z]*$/)
            ? cat.icon
            : "\uD83C\uDF54";

        const budget = budgetByCategoryId[cat.id];
        const limitAmount = budget ? parseFloat(budget.limitAmount) : 0;
        const maxCatAmount = Math.max(
          ...topCategories.map((c) => c.amount),
          1
        );
        const progress =
          budget && limitAmount > 0
            ? Math.min(cat.amount / limitAmount, 1)
            : cat.amount / maxCatAmount;
        const progressColor =
          budget && limitAmount > 0
            ? progress >= 1
              ? "#ef4444"
              : progress >= 0.8
                ? "#f59e0b"
                : cat.color || "#3b82f6"
            : cat.color || "#3b82f6";

        return (
          <View key={cat.id} style={styles.categoryItem}>
            <CircularProgress
              progress={progress}
              size={64}
              strokeWidth={4}
              color={progressColor}
              backgroundColor="rgba(0,0,0,0.1)"
            >
              <View
                style={[
                  styles.categoryCircleInner,
                  { backgroundColor: (cat.color || "#3b82f6") + "20" },
                ]}
              >
                <ThemedText style={styles.categoryEmoji}>
                  {iconDisplay}
                </ThemedText>
              </View>
            </CircularProgress>
            <ThemedText
              type="small"
              style={styles.categoryName}
              numberOfLines={1}
            >
              {cat.name}
            </ThemedText>
            <ThemedText type="small" color={theme.textSecondary}>
              {budget
                ? `${Math.round(cat.amount)}/${Math.round(limitAmount)}`
                : formatAmount(cat.amount)}
            </ThemedText>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  categoriesContainer: {
    marginBottom: Spacing.xl,
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  categoryItem: {
    alignItems: "center",
    minWidth: 80,
  },
  categoryCircleInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryName: {
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 2,
  },
});

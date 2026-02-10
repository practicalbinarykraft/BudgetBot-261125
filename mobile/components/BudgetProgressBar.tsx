import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";

interface BudgetProgressBarProps {
  spent: number;
  limit: number;
  percentage: number;
}

export function BudgetProgressBar({
  spent,
  limit,
  percentage,
}: BudgetProgressBarProps) {
  const { theme } = useTheme();

  const barColor =
    percentage > 100
      ? theme.destructive
      : percentage >= 75
        ? theme.warning
        : theme.success;

  const clampedWidth = Math.min(percentage, 100);

  return (
    <View>
      <View style={styles.labelRow}>
        <ThemedText type="small" color={theme.textSecondary}>
          {"$" + spent.toFixed(2) + " / $" + limit.toFixed(2)}
        </ThemedText>
        <ThemedText
          type="small"
          color={barColor}
          style={styles.percentText}
        >
          {Math.round(percentage) + "%"}
        </ThemedText>
      </View>
      <View style={[styles.trackBar, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.fillBar,
            {
              backgroundColor: barColor,
              width: `${clampedWidth}%` as any,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  percentText: {
    fontWeight: "600",
  },
  trackBar: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  fillBar: {
    height: 8,
    borderRadius: BorderRadius.full,
  },
});

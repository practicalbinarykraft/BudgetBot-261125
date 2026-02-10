import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { CHART_COLORS } from "../../hooks/useFinancialTrendChart";

export function ChartLegend() {
  const { theme } = useTheme();

  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View
          style={[styles.legendDot, { backgroundColor: CHART_COLORS.income }]}
        />
        <ThemedText type="small" color={theme.textSecondary}>
          {"Income"}
        </ThemedText>
      </View>
      <View style={styles.legendItem}>
        <View
          style={[styles.legendDot, { backgroundColor: CHART_COLORS.expense }]}
        />
        <ThemedText type="small" color={theme.textSecondary}>
          {"Expense"}
        </ThemedText>
      </View>
      <View style={styles.legendItem}>
        <View
          style={[styles.legendDot, { backgroundColor: CHART_COLORS.capital }]}
        />
        <ThemedText type="small" color={theme.textSecondary}>
          {"Capital"}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

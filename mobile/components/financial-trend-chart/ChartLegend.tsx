import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { CHART_COLORS } from "../../hooks/useFinancialTrendChart";

export function ChartLegend() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View
          style={[styles.legendDot, { backgroundColor: CHART_COLORS.income }]}
        />
        <ThemedText type="small" color={theme.textSecondary}>
          {t("dashboard.income")}
        </ThemedText>
      </View>
      <View style={styles.legendItem}>
        <View
          style={[styles.legendDot, { backgroundColor: CHART_COLORS.expense }]}
        />
        <ThemedText type="small" color={theme.textSecondary}>
          {t("dashboard.expenses")}
        </ThemedText>
      </View>
      <View style={styles.legendItem}>
        <View
          style={[styles.legendDot, { backgroundColor: CHART_COLORS.capital }]}
        />
        <ThemedText type="small" color={theme.textSecondary}>
          {t("dashboard.capital")}
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

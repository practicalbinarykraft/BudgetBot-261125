import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { formatCompact } from "../../hooks/useFinancialTrendChart";

interface ForecastSummaryProps {
  forecastSummary: {
    current: number;
    projected: number;
    percentChange: number;
  };
  showForecast: boolean;
}

export function ForecastSummaryBox({
  forecastSummary,
  showForecast,
}: ForecastSummaryProps) {
  const { theme } = useTheme();

  if (!showForecast) return null;

  return (
    <View
      style={[
        styles.forecastSummary,
        { backgroundColor: theme.muted, borderColor: theme.border },
      ]}
    >
      <Feather name="trending-up" size={16} color={theme.primary} />
      <View style={styles.forecastText}>
        <View style={styles.forecastValues}>
          <ThemedText type="small" style={styles.bold}>
            {"12-month forecast:"}
          </ThemedText>
          <ThemedText type="bodySm" color={theme.primary} style={styles.bold} mono>
            {formatCompact(forecastSummary.projected)}
          </ThemedText>
          <ThemedText
            type="small"
            color={
              forecastSummary.percentChange >= 0 ? "#22c55e" : "#dc2626"
            }
            style={styles.bold}
          >
            {(forecastSummary.percentChange >= 0 ? "+" : "") +
              forecastSummary.percentChange.toFixed(1) +
              "%"}
          </ThemedText>
        </View>
        <ThemedText type="small" color={theme.textSecondary}>
          {"Capital: " +
            formatCompact(forecastSummary.current) +
            " \u2192 " +
            formatCompact(forecastSummary.projected)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: "600" },
  forecastSummary: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  forecastText: { flex: 1, gap: 2 },
  forecastValues: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: Spacing.sm,
  },
});

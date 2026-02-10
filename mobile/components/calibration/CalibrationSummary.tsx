import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import { Card, CardContent } from "../Card";
import { Badge } from "../Badge";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import type { CalibrationSummaryData } from "../../hooks/useCalibrationScreen";

interface CalibrationSummaryProps {
  summary: CalibrationSummaryData;
}

export function CalibrationSummary({ summary }: CalibrationSummaryProps) {
  const { theme } = useTheme();

  return (
    <Card style={styles.summaryCard}>
      <CardContent>
        <View style={styles.summaryRow}>
          <ThemedText type="bodySm" color={theme.textSecondary}>
            {"Total impact on net worth:"}
          </ThemedText>
          <ThemedText
            type="bodySm"
            mono
            color={
              summary.totalDifferenceUSD < 0
                ? theme.destructive
                : "#16a34a"
            }
            style={styles.summaryValue}
          >
            {summary.totalDifferenceUSD < 0 ? "-" : "+"}$
            {Math.abs(summary.totalDifferenceUSD).toFixed(2)}
          </ThemedText>
        </View>
        {summary.transactionsCount > 0 ? (
          <View style={styles.summaryRow}>
            <ThemedText type="bodySm" color={theme.textSecondary}>
              {"Unaccounted expenses to create:"}
            </ThemedText>
            <Badge
              label={String(summary.transactionsCount)}
              variant="outline"
            />
          </View>
        ) : null}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    marginTop: Spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  summaryValue: {
    fontWeight: "700",
  },
});

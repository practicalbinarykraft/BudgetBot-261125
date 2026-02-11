import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Card, CardContent } from "../Card";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import type { AssetSummary } from "../../types";

interface AssetsSummaryCardProps {
  summary: AssetSummary;
}

export function AssetsSummaryCard({ summary }: AssetsSummaryCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Card
      style={[
        styles.summaryCard,
        { borderLeftWidth: 4, borderLeftColor: theme.primary },
      ]}
    >
      <CardContent style={styles.summaryContent}>
        <ThemedText type="small" color={theme.textSecondary}>
          {t("assets.net_worth")}
        </ThemedText>
        <ThemedText type="h2" mono>
          {"$"}
          {summary.netWorth.toFixed(2)}
        </ThemedText>
        {summary.changePercent !== 0 ? (
          <View style={styles.changeRow}>
            <Feather
              name={
                summary.changePercent >= 0
                  ? "trending-up"
                  : "trending-down"
              }
              size={14}
              color={
                summary.changePercent >= 0
                  ? "#10b981"
                  : theme.destructive
              }
            />
            <ThemedText
              type="small"
              color={
                summary.changePercent >= 0
                  ? "#10b981"
                  : theme.destructive
              }
            >
              {summary.changePercent >= 0 ? "+" : ""}
              {summary.changePercent.toFixed(1)}
              {"%"}
            </ThemedText>
          </View>
        ) : null}
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <ThemedText type="small" color={theme.textSecondary}>
              {t("assets.assets")}
            </ThemedText>
            <ThemedText type="bodySm" mono color="#10b981">
              {"$"}
              {summary.totalAssets.toFixed(2)}
            </ThemedText>
          </View>
          <View style={styles.summaryStat}>
            <ThemedText type="small" color={theme.textSecondary}>
              {t("assets.liabilities")}
            </ThemedText>
            <ThemedText type="bodySm" mono color={theme.destructive}>
              {"$"}
              {summary.totalLiabilities.toFixed(2)}
            </ThemedText>
          </View>
          <View style={styles.summaryStat}>
            <ThemedText type="small" color={theme.textSecondary}>
              {t("assets.cashflow")}
            </ThemedText>
            <ThemedText type="bodySm" mono>
              {"$"}
              {summary.monthlyCashflow.toFixed(2)}
              {t("common.per_month")}
            </ThemedText>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  summaryCard: { marginBottom: Spacing.lg },
  summaryContent: { gap: Spacing.sm },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  summaryStat: { gap: 2 },
  changeRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
});

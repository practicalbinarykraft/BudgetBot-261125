import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Card, CardHeader, CardContent } from "../Card";
import { Badge } from "../Badge";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import type { AdvancedHealthScore } from "../../types";

const RATING_COLORS: Record<string, string> = {
  excellent: "#10b981",
  good: "#3b82f6",
  fair: "#eab308",
  poor: "#ef4444",
};

interface HealthScoreCardProps {
  health: AdvancedHealthScore;
}

export function HealthScoreCard({ health }: HealthScoreCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <View style={styles.cardTitleRow}>
          <Feather name="target" size={18} color={theme.text} />
          <ThemedText type="h4" style={styles.bold}>
            {t("analytics.financial_health_score")}
          </ThemedText>
        </View>
        <ThemedText type="small" color={theme.textSecondary}>
          {t("analytics.health_score_subtitle")}
        </ThemedText>
      </CardHeader>
      <CardContent style={styles.healthContent}>
        {/* Score + Rating */}
        <View style={styles.scoreSection}>
          <ThemedText
            type="h1"
            mono
            color={RATING_COLORS[health.rating] || theme.text}
            style={styles.scoreText}
          >
            {health.score}
          </ThemedText>
          <ThemedText type="small" color={theme.textSecondary}>
            {t("analytics.out_of_100")}
          </ThemedText>
          <Badge
            label={health.rating.toUpperCase()}
            variant={health.rating === "poor" ? "destructive" : "default"}
          />
        </View>

        {/* Breakdown */}
        <View style={styles.metricsSection}>
          <ThemedText type="bodySm" style={styles.bold}>
            {t("common.breakdown")}
          </ThemedText>
          <View style={styles.metricRow}>
            <ThemedText type="small">{t("analytics.budget_adherence")}</ThemedText>
            <ThemedText type="small" mono>
              {health.breakdown.budgetAdherence}
              {"%"}
            </ThemedText>
          </View>
          <View style={styles.metricRow}>
            <ThemedText type="small">{t("analytics.savings_rate")}</ThemedText>
            <ThemedText type="small" mono>
              {health.breakdown.savingsRate.toFixed(1)}
              {"%"}
            </ThemedText>
          </View>
          <View style={styles.metricRow}>
            <ThemedText type="small">{t("analytics.spending_ratio")}</ThemedText>
            <ThemedText type="small" mono>
              {health.breakdown.spendingRatio}
              {"%"}
            </ThemedText>
          </View>
        </View>

        {/* Monthly Metrics */}
        <View style={styles.metricsSection}>
          <ThemedText type="bodySm" style={styles.bold}>
            {t("analytics.monthly_metrics")}
          </ThemedText>
          <View style={styles.metricRow}>
            <ThemedText type="small">{t("analytics.monthly_income")}</ThemedText>
            <ThemedText type="small" mono color="#10b981">
              {"$"}
              {health.metrics.monthlyIncome.toFixed(2)}
            </ThemedText>
          </View>
          <View style={styles.metricRow}>
            <ThemedText type="small">{t("analytics.monthly_expense")}</ThemedText>
            <ThemedText type="small" mono color="#ef4444">
              {"$"}
              {health.metrics.monthlyExpense.toFixed(2)}
            </ThemedText>
          </View>
          <View style={styles.metricRow}>
            <ThemedText type="small">{t("analytics.monthly_savings")}</ThemedText>
            <ThemedText
              type="small"
              mono
              color={
                health.metrics.monthlySavings >= 0 ? "#10b981" : "#ef4444"
              }
            >
              {"$"}
              {health.metrics.monthlySavings.toFixed(2)}
            </ThemedText>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: "600" },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  healthContent: { gap: Spacing.xl },
  scoreSection: { alignItems: "center", gap: Spacing.xs },
  scoreText: { fontSize: 56, lineHeight: 64 },
  metricsSection: { gap: Spacing.sm },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

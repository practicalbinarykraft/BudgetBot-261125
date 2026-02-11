import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Card, CardHeader, CardContent } from "../Card";
import { Badge } from "../Badge";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import type { SpendingForecast } from "../../types";

interface ForecastCardProps {
  forecast: SpendingForecast;
}

export function ForecastCard({ forecast }: ForecastCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <View style={styles.cardTitleRow}>
          <Feather
            name={
              forecast.trend === "increasing"
                ? "trending-up"
                : forecast.trend === "decreasing"
                  ? "trending-down"
                  : "bar-chart-2"
            }
            size={18}
            color={
              forecast.trend === "increasing"
                ? "#ef4444"
                : forecast.trend === "decreasing"
                  ? "#10b981"
                  : "#3b82f6"
            }
          />
          <ThemedText type="h4" style={styles.bold}>
            {t("analytics.spending_forecast")}
          </ThemedText>
        </View>
        <ThemedText type="small" color={theme.textSecondary}>
          {t("analytics.spending_forecast_subtitle")}
        </ThemedText>
      </CardHeader>
      <CardContent style={styles.forecastContent}>
        <View style={styles.forecastStats}>
          <View style={styles.forecastStat}>
            <ThemedText type="small" color={theme.textSecondary}>
              {t("analytics.next_month_forecast")}
            </ThemedText>
            <ThemedText type="h2" mono style={styles.bold}>
              {"$"}
              {forecast.forecast.toFixed(2)}
            </ThemedText>
          </View>
          <View style={styles.forecastStat}>
            <ThemedText type="small" color={theme.textSecondary}>
              {t("analytics.three_month_average")}
            </ThemedText>
            <ThemedText type="h3" mono style={styles.bold}>
              {"$"}
              {forecast.historicalAverage.toFixed(2)}
            </ThemedText>
          </View>
        </View>
        <View style={styles.forecastBadges}>
          <View style={styles.forecastBadgeCol}>
            <ThemedText type="small" color={theme.textSecondary}>
              {t("analytics.trend")}
            </ThemedText>
            <Badge label={forecast.trend} variant="outline" />
          </View>
          <View style={styles.forecastBadgeCol}>
            <ThemedText type="small" color={theme.textSecondary}>
              {t("analytics.confidence")}
            </ThemedText>
            <Badge label={forecast.confidence} variant="outline" />
          </View>
        </View>

        {/* Monthly Data */}
        {forecast.monthlyData.length > 0 ? (
          <View style={styles.monthlyDataSection}>
            <ThemedText type="bodySm" style={styles.bold}>
              {t("analytics.monthly_history")}
            </ThemedText>
            {forecast.monthlyData.map((m, i) => (
              <View
                key={i}
                style={[styles.monthRow, { borderColor: theme.border }]}
              >
                <ThemedText type="small">{m.month}</ThemedText>
                <ThemedText type="small" mono>
                  {"$"}
                  {m.amount.toFixed(2)}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : null}
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
  forecastContent: { gap: Spacing.lg },
  forecastStats: { gap: Spacing.md },
  forecastStat: { gap: Spacing.xs },
  forecastBadges: { flexDirection: "row", gap: Spacing.xl },
  forecastBadgeCol: { gap: Spacing.xs },
  monthlyDataSection: { gap: Spacing.sm },
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
});

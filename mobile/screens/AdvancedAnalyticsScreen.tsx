import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { ThemedText } from "../components/ThemedText";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { useAdvancedAnalytics } from "../hooks/useAdvancedAnalytics";
import { HealthScoreCard } from "../components/advanced-analytics/HealthScoreCard";
import { ForecastCard } from "../components/advanced-analytics/ForecastCard";
import { RecommendationsCard } from "../components/advanced-analytics/RecommendationsCard";
import { TrendsCard } from "../components/advanced-analytics/TrendsCard";

export default function AdvancedAnalyticsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { isLoading, health, forecast, recommendations, trends } =
    useAdvancedAnalytics();

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText type="bodySm" color={theme.textSecondary}>
          {t("common.loading")}
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <ThemedText type="h3" style={styles.bold}>
            {t("analytics.advanced")}
          </ThemedText>
          <ThemedText type="small" color={theme.textSecondary}>
            {"AI-powered insights, forecasts, and recommendations"}
          </ThemedText>
        </View>
      </View>

      {/* Health Score Card */}
      {health ? <HealthScoreCard health={health} /> : null}

      {/* Forecast Card */}
      {forecast ? <ForecastCard forecast={forecast} /> : null}

      {/* Recommendations Card */}
      {recommendations && recommendations.length > 0 ? (
        <RecommendationsCard recommendations={recommendations} />
      ) : null}

      {/* Trends Card */}
      {trends ? <TrendsCard trends={trends} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing["5xl"],
  },
  headerRow: { gap: Spacing.sm },
  bold: { fontWeight: "600" },
});

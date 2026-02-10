import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Card, CardHeader, CardContent } from "../Card";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import type { BudgetRecommendation } from "../../types";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  good: { bg: "#dcfce7", text: "#166534" },
  too_low: { bg: "#fecaca", text: "#991b1b" },
  too_high: { bg: "#dbeafe", text: "#1e40af" },
  no_budget: { bg: "#fef9c3", text: "#854d0e" },
};

interface RecommendationsCardProps {
  recommendations: BudgetRecommendation[];
}

export function RecommendationsCard({
  recommendations,
}: RecommendationsCardProps) {
  const { theme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <View style={styles.cardTitleRow}>
          <Feather name="check-circle" size={18} color={theme.text} />
          <ThemedText type="h4" style={styles.bold}>
            {"Budget Recommendations"}
          </ThemedText>
        </View>
        <ThemedText type="small" color={theme.textSecondary}>
          {"Suggested budget adjustments based on your spending"}
        </ThemedText>
      </CardHeader>
      <CardContent style={styles.recsList}>
        {recommendations.map((rec, idx) => {
          const statusStyle = STATUS_COLORS[rec.status] || {
            bg: theme.secondary,
            text: theme.text,
          };
          return (
            <View
              key={idx}
              style={[styles.recCard, { borderColor: theme.border }]}
            >
              <View style={styles.recCardHeader}>
                <ThemedText type="bodySm" style={styles.bold}>
                  {rec.categoryName}
                </ThemedText>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusStyle.bg },
                  ]}
                >
                  <ThemedText
                    type="small"
                    color={statusStyle.text}
                    style={styles.statusText}
                  >
                    {rec.status.replace("_", " ")}
                  </ThemedText>
                </View>
              </View>
              <ThemedText
                type="small"
                color={theme.textSecondary}
                style={styles.recMessage}
              >
                {rec.message}
              </ThemedText>
              <View style={styles.recStatsRow}>
                <View style={styles.recStatCol}>
                  <ThemedText type="small" color={theme.textSecondary}>
                    {"Current"}
                  </ThemedText>
                  <ThemedText type="small" mono>
                    {"$"}
                    {rec.currentBudget.toFixed(0)}
                  </ThemedText>
                </View>
                <View style={styles.recStatCol}>
                  <ThemedText type="small" color={theme.textSecondary}>
                    {"Avg Spend"}
                  </ThemedText>
                  <ThemedText type="small" mono>
                    {"$"}
                    {rec.monthlyAverage.toFixed(0)}
                  </ThemedText>
                </View>
                <View style={styles.recStatCol}>
                  <ThemedText type="small" color={theme.textSecondary}>
                    {"Recommended"}
                  </ThemedText>
                  <ThemedText type="small" mono style={styles.bold}>
                    {"$"}
                    {rec.recommendedBudget.toFixed(0)}
                  </ThemedText>
                </View>
              </View>
            </View>
          );
        })}
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
  recsList: { gap: Spacing.md },
  recCard: {
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  recCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: { fontWeight: "500", fontSize: 11 },
  recMessage: { lineHeight: 18 },
  recStatsRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  recStatCol: { gap: 2 },
});

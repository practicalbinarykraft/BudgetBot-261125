import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Card, CardHeader, CardContent } from "../Card";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import type { SpendingTrends } from "../../types";

const CATEGORY_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

interface TrendsCardProps {
  trends: SpendingTrends;
}

export function TrendsCard({ trends }: TrendsCardProps) {
  const { theme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <View style={styles.cardTitleRow}>
          <Feather name="bar-chart-2" size={18} color={theme.text} />
          <ThemedText type="h4" style={styles.bold}>
            {"Spending Trends"}
          </ThemedText>
        </View>
        <ThemedText type="small" color={theme.textSecondary}>
          {"6-month spending analysis and category breakdown"}
        </ThemedText>
      </CardHeader>
      <CardContent style={styles.trendsContent}>
        {/* Monthly Trend */}
        <ThemedText type="bodySm" style={styles.bold}>
          {"Monthly Spending Trend"}
        </ThemedText>
        {trends.monthlyTrend.map((m, i) => (
          <View
            key={i}
            style={[styles.trendRow, { borderColor: theme.border }]}
          >
            <ThemedText type="small">{m.month}</ThemedText>
            <View style={styles.trendRight}>
              <ThemedText type="small" mono>
                {"$"}
                {m.total.toFixed(2)}
              </ThemedText>
              <ThemedText type="small" color={theme.textTertiary}>
                {m.transactions}
                {" txns"}
              </ThemedText>
            </View>
          </View>
        ))}

        {/* Insights Grid */}
        <View style={styles.insightsGrid}>
          <View
            style={[styles.insightBox, { backgroundColor: theme.muted }]}
          >
            <ThemedText type="small" color={theme.textSecondary}>
              {"Average"}
            </ThemedText>
            <ThemedText type="bodySm" mono style={styles.bold}>
              {"$"}
              {trends.insights.averageMonthlySpending.toFixed(0)}
            </ThemedText>
          </View>
          <View
            style={[styles.insightBox, { backgroundColor: theme.muted }]}
          >
            <ThemedText type="small" color={theme.textSecondary}>
              {"Volatility"}
            </ThemedText>
            <ThemedText type="bodySm" mono style={styles.bold}>
              {trends.insights.volatility}
              {"%"}
            </ThemedText>
          </View>
          <View
            style={[styles.insightBox, { backgroundColor: theme.muted }]}
          >
            <ThemedText type="small" color={theme.textSecondary}>
              {"Highest"}
            </ThemedText>
            <ThemedText type="bodySm" mono style={styles.bold}>
              {"$"}
              {trends.insights.highestMonth.toFixed(0)}
            </ThemedText>
          </View>
          <View
            style={[styles.insightBox, { backgroundColor: theme.muted }]}
          >
            <ThemedText type="small" color={theme.textSecondary}>
              {"Lowest"}
            </ThemedText>
            <ThemedText type="bodySm" mono style={styles.bold}>
              {"$"}
              {trends.insights.lowestMonth.toFixed(0)}
            </ThemedText>
          </View>
        </View>

        {/* Category Breakdown */}
        {trends.categoryBreakdown.length > 0 ? (
          <>
            <ThemedText type="bodySm" style={styles.bold}>
              {"Top Categories (6 months)"}
            </ThemedText>
            {trends.categoryBreakdown.slice(0, 5).map((cat, idx) => (
              <View key={idx} style={styles.catRow}>
                <View style={styles.catLeft}>
                  <View
                    style={[
                      styles.catDot,
                      {
                        backgroundColor: CATEGORY_COLORS[idx % 5],
                      },
                    ]}
                  />
                  <ThemedText type="small">{cat.category}</ThemedText>
                </View>
                <View style={styles.catRight}>
                  <ThemedText type="small" mono>
                    {"$"}
                    {cat.total.toFixed(0)}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    color={theme.textSecondary}
                    style={styles.catPct}
                  >
                    {cat.percentage}
                    {"%"}
                  </ThemedText>
                </View>
              </View>
            ))}
          </>
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
  trendsContent: { gap: Spacing.md },
  trendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  trendRight: { flexDirection: "row", gap: Spacing.md, alignItems: "center" },
  insightsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  insightBox: {
    flex: 1,
    minWidth: "45%",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 2,
  },
  catRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  catLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  catDot: { width: 12, height: 12, borderRadius: 6 },
  catRight: { flexDirection: "row", gap: Spacing.md, alignItems: "center" },
  catPct: { width: 40, textAlign: "right" },
});

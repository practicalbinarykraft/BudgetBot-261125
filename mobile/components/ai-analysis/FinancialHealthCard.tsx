import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { UseQueryResult } from "@tanstack/react-query";
import { ThemedText } from "../ThemedText";
import { Card, CardHeader, CardContent } from "../Card";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import type { FinancialHealthScore } from "../../types";

interface FinancialHealthCardProps {
  healthQuery: UseQueryResult<FinancialHealthScore>;
  getScoreColor: (score: number) => string;
}

export function FinancialHealthCard({
  healthQuery,
  getScoreColor,
}: FinancialHealthCardProps) {
  const { theme } = useTheme();
  const healthScore = healthQuery.data;

  return (
    <Card>
      <CardHeader>
        <View style={styles.cardTitleRow}>
          <Feather name="trending-up" size={18} color="#10b981" />
          <ThemedText type="h4" style={styles.bold}>
            {"Financial Health"}
          </ThemedText>
        </View>
      </CardHeader>
      <CardContent>
        {healthQuery.isLoading ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : healthScore ? (
          <View style={styles.healthContent}>
            <ThemedText
              type="h1"
              mono
              color={getScoreColor(healthScore.score)}
            >
              {healthScore.score}
              {"/100"}
            </ThemedText>
            <ThemedText
              type="bodySm"
              color={theme.textSecondary}
              style={styles.healthStatus}
            >
              {healthScore.status}
            </ThemedText>
          </View>
        ) : (
          <ThemedText type="bodySm" color={theme.textSecondary}>
            {"No health data available"}
          </ThemedText>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: "600" },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  healthContent: { gap: Spacing.xs },
  healthStatus: { marginTop: Spacing.xs },
});

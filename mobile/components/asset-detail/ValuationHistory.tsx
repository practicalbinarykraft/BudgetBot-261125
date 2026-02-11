import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import { Card, CardHeader, CardContent } from "../Card";
import { Badge } from "../Badge";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import type { AssetValuation } from "../../types";

interface ValuationHistoryProps {
  valuations: AssetValuation[];
  formatDate: (dateStr: string) => string;
}

export function ValuationHistory({ valuations, formatDate }: ValuationHistoryProps) {
  const { theme } = useTheme();

  if (valuations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <ThemedText type="h4" style={styles.bold}>
          {"Valuation History"}
        </ThemedText>
      </CardHeader>
      <CardContent style={styles.valuationsContent}>
        {valuations.map((v) => (
          <View
            key={v.id}
            style={[styles.valuationRow, { borderColor: theme.border }]}
          >
            <View style={styles.valuationLeft}>
              <ThemedText type="bodySm" mono>
                {"$"}
                {v.value}
              </ThemedText>
              {v.source ? (
                <Badge label={v.source} variant="outline" />
              ) : null}
            </View>
            <ThemedText type="small" color={theme.textSecondary}>
              {formatDate(v.valuationDate)}
            </ThemedText>
          </View>
        ))}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: "600" },
  valuationsContent: { gap: 0 },
  valuationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  valuationLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
});

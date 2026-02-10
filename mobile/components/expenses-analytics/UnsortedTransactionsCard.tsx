import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Card, CardContent } from "../Card";
import { Badge } from "../Badge";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import type { UnsortedResponse } from "../../hooks/useExpensesAnalyticsScreen";

interface UnsortedTransactionsCardProps {
  data: UnsortedResponse | undefined;
  formatDate: (dateStr: string) => string;
}

export function UnsortedTransactionsCard({
  data,
  formatDate,
}: UnsortedTransactionsCardProps) {
  const { theme } = useTheme();
  const txns = data?.transactions ?? [];

  return (
    <Card>
      <CardContent style={styles.unsortedContent}>
        <View style={styles.unsortedHeader}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            {"Unsorted Transactions"}
          </ThemedText>
          <Badge label={String(data?.count ?? 0)} variant="secondary" />
        </View>
        <ThemedText type="small" color={theme.textSecondary}>
          {"Transactions without a financial type classification"}
        </ThemedText>
        {txns.length === 0 ? (
          <View style={styles.emptyUnsorted}>
            <Feather
              name="check-circle"
              size={32}
              color={theme.textTertiary}
            />
            <ThemedText type="bodySm" color={theme.textSecondary}>
              {"All transactions are sorted!"}
            </ThemedText>
          </View>
        ) : (
          txns.map((tx) => (
            <View
              key={tx.id}
              style={[
                styles.unsortedItem,
                { borderColor: theme.border },
              ]}
            >
              <View style={styles.unsortedLeft}>
                <ThemedText type="bodySm" style={styles.unsortedName}>
                  {tx.description}
                </ThemedText>
                <ThemedText type="small" color={theme.textSecondary}>
                  {formatDate(tx.date)}
                </ThemedText>
              </View>
              <ThemedText type="bodySm" mono color={theme.destructive}>
                {"-$"}
                {Number(tx.amountUsd).toFixed(2)}
              </ThemedText>
            </View>
          ))
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  unsortedContent: { gap: Spacing.md },
  unsortedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontWeight: "600" },
  emptyUnsorted: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing["3xl"],
  },
  unsortedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  unsortedLeft: { flex: 1, gap: 2 },
  unsortedName: { fontWeight: "500" },
});

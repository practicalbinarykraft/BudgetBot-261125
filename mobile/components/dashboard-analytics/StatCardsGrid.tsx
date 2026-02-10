import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Card, CardHeader, CardContent } from "../Card";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

interface StatCardsGridProps {
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  onViewDetails: () => void;
}

export function StatCardsGrid({
  totalIncome,
  totalExpense,
  totalBalance,
  onViewDetails,
}: StatCardsGridProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.statGrid}>
      {/* Row 1 */}
      <View style={styles.statRow}>
        {/* Total Income — border-l-4 green, TrendingUp */}
        <Card
          style={[
            styles.statCard,
            { borderLeftWidth: 4, borderLeftColor: "#22c55e" },
          ]}
        >
          <CardHeader style={styles.statCardHeader}>
            <ThemedText
              type="bodySm"
              color={theme.textSecondary}
              style={styles.statLabel}
            >
              {"Total Income"}
            </ThemedText>
            <Feather
              name="trending-up"
              size={16}
              color={theme.textSecondary}
            />
          </CardHeader>
          <CardContent>
            <ThemedText type="monoLg" mono>
              {"$" + totalIncome.toFixed(2)}
            </ThemedText>
          </CardContent>
        </Card>

        {/* Total Expense — border-l-4 red, TrendingDown */}
        <Card
          style={[
            styles.statCard,
            { borderLeftWidth: 4, borderLeftColor: "#dc2626" },
          ]}
        >
          <CardHeader style={styles.statCardHeader}>
            <ThemedText
              type="bodySm"
              color={theme.textSecondary}
              style={styles.statLabel}
            >
              {"Total Expense"}
            </ThemedText>
            <Feather
              name="trending-down"
              size={16}
              color={theme.textSecondary}
            />
          </CardHeader>
          <CardContent>
            <ThemedText type="monoLg" mono>
              {"$" + totalExpense.toFixed(2)}
            </ThemedText>
            <Pressable onPress={onViewDetails} style={styles.statAction}>
              <ThemedText type="bodySm" color={theme.primary}>
                {"View Details"}
              </ThemedText>
              <Feather name="arrow-right" size={12} color={theme.primary} />
            </Pressable>
          </CardContent>
        </Card>
      </View>

      {/* Row 2 */}
      <View style={styles.statRow}>
        {/* Total Capital — border-l-4 primary/blue, Wallet icon */}
        <Card
          style={[
            styles.statCard,
            { borderLeftWidth: 4, borderLeftColor: theme.primary },
          ]}
        >
          <CardHeader style={styles.statCardHeader}>
            <ThemedText
              type="bodySm"
              color={theme.textSecondary}
              style={styles.statLabel}
            >
              {"Total Capital"}
            </ThemedText>
            <Feather
              name="credit-card"
              size={16}
              color={theme.textSecondary}
            />
          </CardHeader>
          <CardContent>
            <ThemedText type="monoLg" mono>
              {"$" + totalBalance.toFixed(2)}
            </ThemedText>
            <ThemedText
              type="small"
              color={theme.textSecondary}
              style={styles.breakdown}
            >
              {"Wallets: $" + totalBalance.toFixed(0)}
            </ThemedText>
          </CardContent>
        </Card>

        {/* Net Worth — border-l-4 yellow, Wallet icon */}
        <Card
          style={[
            styles.statCard,
            { borderLeftWidth: 4, borderLeftColor: "#f59e0b" },
          ]}
        >
          <CardHeader style={styles.statCardHeader}>
            <ThemedText
              type="bodySm"
              color={theme.textSecondary}
              style={styles.statLabel}
            >
              {"Net Worth"}
            </ThemedText>
            <Feather
              name="credit-card"
              size={16}
              color={theme.textSecondary}
            />
          </CardHeader>
          <CardContent>
            <ThemedText type="monoLg" mono>
              {"$" + totalBalance.toFixed(0)}
            </ThemedText>
          </CardContent>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statGrid: {
    gap: Spacing.lg,
  },
  statRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  statCard: {
    flex: 1,
  },
  statCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: Spacing.sm,
  },
  statLabel: {
    fontWeight: "500",
  },
  statAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.md,
  },
  breakdown: {
    marginTop: Spacing.xs,
  },
});

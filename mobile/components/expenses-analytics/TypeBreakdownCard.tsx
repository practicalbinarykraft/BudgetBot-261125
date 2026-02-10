import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Card, CardContent } from "../Card";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import type { TypeItem } from "../../hooks/useExpensesAnalyticsScreen";

const TYPE_COLORS: Record<string, string> = {
  essential: "#dc2626",
  discretionary: "#eab308",
  asset: "#10b981",
  liability: "#3b82f6",
};

const TYPE_ICONS: Record<string, "dollar-sign" | "trending-down" | "trending-up" | "alert-circle"> = {
  essential: "dollar-sign",
  discretionary: "trending-down",
  asset: "trending-up",
  liability: "alert-circle",
};

interface TypeBreakdownCardProps {
  total: number;
  items: TypeItem[];
}

export function TypeBreakdownCard({ total, items }: TypeBreakdownCardProps) {
  const { theme } = useTheme();

  return (
    <Card>
      <CardContent style={styles.typeContent}>
        <View style={styles.typeHeader}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            {"Spending by Type"}
          </ThemedText>
          <ThemedText type="h4" mono style={styles.sectionTitle}>
            {"$"}
            {total.toFixed(2)}
          </ThemedText>
        </View>
        {items.length === 0 ? (
          <ThemedText type="bodySm" color={theme.textSecondary}>
            {"No data for this period"}
          </ThemedText>
        ) : (
          items.map((item) => {
            const color = TYPE_COLORS[item.type] || "#6b7280";
            const icon = TYPE_ICONS[item.type] || "help-circle";
            return (
              <View key={item.type} style={styles.typeItem}>
                <View style={styles.typeItemTop}>
                  <View style={styles.typeItemLeft}>
                    <View
                      style={[
                        styles.typeIconBg,
                        { backgroundColor: color + "20" },
                      ]}
                    >
                      <Feather name={icon} size={14} color={color} />
                    </View>
                    <ThemedText type="bodySm" style={styles.typeName}>
                      {item.name}
                    </ThemedText>
                  </View>
                  <View style={styles.typeItemRight}>
                    <ThemedText type="bodySm" mono>
                      {"$"}
                      {item.amount.toFixed(2)}
                    </ThemedText>
                    <ThemedText type="small" color={theme.textSecondary}>
                      {item.percentage.toFixed(1)}
                      {"%"}
                    </ThemedText>
                  </View>
                </View>
                <View
                  style={[
                    styles.progressBg,
                    { backgroundColor: theme.secondary },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: color,
                        width: `${Math.min(item.percentage, 100)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  typeContent: { gap: Spacing.lg },
  typeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontWeight: "600" },
  typeItem: { gap: Spacing.sm },
  typeItemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  typeIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  typeName: { fontWeight: "500" },
  typeItemRight: { alignItems: "flex-end", gap: 2 },
  progressBg: {
    height: 6,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: BorderRadius.sm,
  },
});

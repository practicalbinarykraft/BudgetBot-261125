import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";
import { Card, CardHeader, CardContent } from "./Card";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";

export interface BreakdownItem {
  id?: number;
  name: string;
  icon?: string;
  color?: string;
  amount: number;
  percentage: number;
}

interface BreakdownCardProps {
  title: string;
  total: number;
  items: BreakdownItem[];
}

export function BreakdownCard({ title, total, items }: BreakdownCardProps) {
  const { theme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <View style={styles.headerRow}>
          <ThemedText type="h4" style={styles.cardTitle}>
            {title}
          </ThemedText>
          <ThemedText type="h4" mono style={styles.cardTitle}>
            {"$"}
            {total.toFixed(2)}
          </ThemedText>
        </View>
      </CardHeader>
      <CardContent style={styles.content}>
        {items.length === 0 ? (
          <ThemedText type="bodySm" color={theme.textSecondary}>
            {"No data for this period"}
          </ThemedText>
        ) : (
          items.map((item, idx) => {
            const color = item.color || "#3b82f6";
            return (
              <View key={item.id ?? idx} style={styles.item}>
                <View style={styles.itemTop}>
                  <View style={styles.itemLeft}>
                    <View
                      style={[styles.dot, { backgroundColor: color }]}
                    />
                    <ThemedText type="bodySm" style={styles.itemName}>
                      {item.name}
                    </ThemedText>
                  </View>
                  <View style={styles.itemRight}>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontWeight: "600" },
  content: { gap: Spacing.lg },
  item: { gap: Spacing.sm },
  itemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  itemName: { fontWeight: "500" },
  itemRight: {
    alignItems: "flex-end",
    gap: 2,
  },
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

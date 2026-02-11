import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Button } from "../Button";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import type { SortingStats } from "../../hooks/useSwipeSortScreen";

interface SwipeSortHeaderProps {
  sessionPoints: number;
  stats: SortingStats | undefined;
  remainingCount: number;
  progressPercent: number;
  onFinish: () => void;
}

export function SwipeSortHeader({
  sessionPoints,
  stats,
  remainingCount,
  progressPercent,
  onFinish,
}: SwipeSortHeaderProps) {
  const { theme } = useTheme();

  return (
    <>
      <View style={styles.headerStats}>
        <Button title="Finish" variant="outline" size="sm" onPress={onFinish} />
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Feather name="zap" size={16} color="#f59e0b" />
            <ThemedText type="bodySm" style={styles.bold}>
              {"+" + sessionPoints}
            </ThemedText>
          </View>
          <View style={styles.statBadge}>
            <Feather name="activity" size={16} color="#f97316" />
            <ThemedText type="bodySm" style={styles.bold}>
              {String(stats?.currentStreak ?? 0)}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <ThemedText type="small" style={styles.bold}>
            {remainingCount + " remaining"}
          </ThemedText>
          <ThemedText type="small" color={theme.textSecondary}>
            {progressPercent + "%"}
          </ThemedText>
        </View>
        <View style={[styles.progressBar, { backgroundColor: theme.muted }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.primary,
                width: `${progressPercent}%` as any,
              },
            ]}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: "600" },
  headerStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  statsRow: { flexDirection: "row", gap: Spacing.md },
  statBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  progressSection: { marginBottom: Spacing.lg },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
});

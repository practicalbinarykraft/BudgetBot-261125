import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Badge } from "../Badge";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import type { FilterBadge } from "../../hooks/useTransactionsScreen";

interface ActiveFilterBadgesProps {
  badges: FilterBadge[];
  onClearAll: () => void;
}

export function ActiveFilterBadges({ badges, onClearAll }: ActiveFilterBadgesProps) {
  const { theme } = useTheme();

  if (badges.length === 0) return null;

  return (
    <View style={styles.badgesRow}>
      {badges.map((badge) => (
        <View key={badge.key} style={styles.badgeWithX}>
          <Badge label={badge.label} variant="secondary" />
          <Pressable onPress={badge.onRemove} hitSlop={8} style={styles.badgeX}>
            <Feather name="x" size={12} color={theme.textSecondary} />
          </Pressable>
        </View>
      ))}
      {badges.length > 1 ? (
        <Pressable onPress={onClearAll} style={styles.clearAllBtn}>
          <ThemedText type="small" color={theme.textSecondary}>
            {"Clear all"}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    alignItems: "center",
  },
  badgeWithX: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeX: {
    padding: 2,
  },
  clearAllBtn: {
    paddingHorizontal: Spacing.sm,
  },
});

import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Button } from "../Button";
import { Card, CardContent } from "../Card";
import { Badge } from "../Badge";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { getDateLocale } from "../../lib/date-locale";
import { WishlistPrediction } from "./WishlistPrediction";
import type { WishlistItem } from "../../types";

const PRIORITY_COLORS: Record<string, string> = {
  low: "#3b82f6",
  medium: "#eab308",
  high: "#ef4444",
};

interface WishlistCardProps {
  item: WishlistItem;
  onTogglePurchased: (item: WishlistItem) => void;
  onDelete: (item: WishlistItem) => void;
}

export function WishlistCard({ item, onTogglePurchased, onDelete }: WishlistCardProps) {
  const { theme } = useTheme();
  const { language, t } = useTranslation();
  const priorityColor = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.medium;

  return (
    <Card style={styles.card}>
      <CardContent style={styles.cardInner}>
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <ThemedText type="body" style={styles.itemName}>{item.name}</ThemedText>
            <ThemedText type="h3" mono style={styles.itemAmount}>
              ${item.amount}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => onTogglePurchased(item)}
            style={[
              styles.checkBtn,
              {
                backgroundColor: item.isPurchased ? "#16a34a" + "20" : theme.secondary,
                borderColor: item.isPurchased ? "#16a34a" : theme.border,
              },
            ]}
          >
            <Feather
              name="check"
              size={16}
              color={item.isPurchased ? "#16a34a" : theme.textTertiary}
            />
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
          <Badge label={item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} variant="secondary" />
          {item.targetDate ? (
            <ThemedText type="small" color={theme.textSecondary}>
              {t("wishlist.target_label") + ": " + new Date(item.targetDate + "T00:00:00").toLocaleDateString(getDateLocale(language), {
                month: "short", day: "numeric", year: "numeric",
              })}
            </ThemedText>
          ) : null}
        </View>

        {item.prediction ? (
          <WishlistPrediction prediction={item.prediction} itemAmount={item.amount} />
        ) : null}

        <View style={styles.actionsRow}>
          <Button
            title={t("wishlist.remove")}
            variant="outline"
            size="sm"
            onPress={() => onDelete(item)}
            icon={<Feather name="trash-2" size={14} color={theme.text} />}
            style={styles.actionBtn}
          />
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  cardInner: { gap: Spacing.md },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  topLeft: { flex: 1, gap: Spacing.xs },
  itemName: { fontWeight: "500" },
  itemAmount: { fontWeight: "700" },
  checkBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  actionsRow: { flexDirection: "row", gap: Spacing.sm },
  actionBtn: { flex: 1 },
});

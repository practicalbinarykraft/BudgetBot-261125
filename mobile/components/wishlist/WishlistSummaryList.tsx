import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { Spacing, BorderRadius } from "../../constants/theme";
import type { WishlistItem, TrendDataPoint } from "../../types";

interface Props {
  items: WishlistItem[];
  sampledTrendData: TrendDataPoint[];
}

function PredictionText({ item, lastTrendDate }: { item: WishlistItem; lastTrendDate: string }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const p = item.prediction;

  if (!p) return null;

  if (p.canAfford) {
    return <ThemedText type="small" color="#22c55e" style={s.bold}>{t("wishlist.available_now")}</ThemedText>;
  }

  if (p.monthsToAfford != null) {
    const beyondHorizon = p.affordableDate && p.affordableDate > lastTrendDate;
    return (
      <View style={s.predRow}>
        <ThemedText type="small" color={theme.primary} style={s.bold}>
          {t("wishlist.available_in_months").replace("{count}", String(p.monthsToAfford))}
        </ThemedText>
        {beyondHorizon ? (
          <ThemedText type="small" color={theme.textTertiary}>
            {t("wishlist.beyond_horizon")}
          </ThemedText>
        ) : null}
      </View>
    );
  }

  return <ThemedText type="small" color="#dc2626" style={s.bold}>{t("wishlist.not_affordable")}</ThemedText>;
}

export function WishlistSummaryList({ items, sampledTrendData }: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  // Top-3 unpurchased by sortOrder (fallback to id)
  const top3 = items
    .filter((i) => !i.isPurchased)
    .sort((a, b) => (a.sortOrder || a.id) - (b.sortOrder || b.id))
    .slice(0, 3);

  if (top3.length === 0) return null;

  const lastTrendDate = sampledTrendData.length > 0
    ? sampledTrendData[sampledTrendData.length - 1].date
    : "";

  return (
    <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={s.header}>
        <View style={s.titleRow}>
          <Feather name="target" size={16} color={theme.primary} />
          <ThemedText type="h4" style={s.bold}>{t("wishlist.summary_title")}</ThemedText>
        </View>
        <Pressable onPress={() => navigation.navigate("Wishlist")} hitSlop={8}>
          <ThemedText type="small" color={theme.primary} style={s.bold}>
            {t("wishlist.all_goals")} →
          </ThemedText>
        </Pressable>
      </View>

      {top3.map((item) => (
        <View key={item.id} style={[s.row, { borderColor: theme.border }]}>
          <View style={s.rowInfo}>
            <ThemedText type="bodySm" style={s.bold}>{item.name}</ThemedText>
            <ThemedText type="small" color={theme.textSecondary}>
              ${parseFloat(item.amount).toLocaleString()}
            </ThemedText>
          </View>
          <PredictionText item={item} lastTrendDate={lastTrendDate} />
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  rowInfo: { flex: 1 },
  predRow: { alignItems: "flex-end", gap: 2 },
  bold: { fontWeight: "600" },
});

import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Card, CardContent } from "../Card";
import { Badge } from "../Badge";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import type { Asset } from "../../types";

interface AssetCardProps {
  item: Asset;
  onPress: () => void;
  onDelete: (item: Asset) => void;
}

export function AssetCard({ item, onPress, onDelete }: AssetCardProps) {
  const { theme } = useTheme();
  const isAsset = item.type === "asset";
  const value = parseFloat(item.currentValue);
  const purchasePrice = item.purchasePrice
    ? parseFloat(item.purchasePrice)
    : null;
  const changePercent =
    purchasePrice && purchasePrice > 0
      ? ((value - purchasePrice) / purchasePrice) * 100
      : null;

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <CardContent style={styles.cardInner}>
          <View style={styles.cardTop}>
            <View style={styles.cardInfo}>
              <ThemedText type="bodySm" style={styles.assetName}>
                {item.name}
              </ThemedText>
              <Badge
                label={isAsset ? "Asset" : "Liability"}
                variant={isAsset ? "default" : "destructive"}
              />
            </View>
            <Pressable
              onPress={() => onDelete(item)}
              style={[
                styles.deleteBtn,
                { backgroundColor: theme.destructive + "15" },
              ]}
            >
              <Feather
                name="trash-2"
                size={14}
                color={theme.destructive}
              />
            </Pressable>
          </View>

          <ThemedText
            type="h3"
            mono
            color={isAsset ? "#10b981" : theme.destructive}
          >
            {"$"}
            {value.toFixed(2)}
          </ThemedText>

          {changePercent !== null ? (
            <View style={styles.changeRow}>
              <Feather
                name={changePercent >= 0 ? "trending-up" : "trending-down"}
                size={12}
                color={changePercent >= 0 ? "#10b981" : theme.destructive}
              />
              <ThemedText
                type="small"
                color={changePercent >= 0 ? "#10b981" : theme.destructive}
              >
                {changePercent >= 0 ? "+" : ""}
                {changePercent.toFixed(1)}
                {"%"}
              </ThemedText>
            </View>
          ) : null}

          {item.location ? (
            <View style={styles.metaRow}>
              <Feather
                name="map-pin"
                size={12}
                color={theme.textSecondary}
              />
              <ThemedText type="small" color={theme.textSecondary}>
                {item.location}
              </ThemedText>
            </View>
          ) : null}

          {item.category ? (
            <Badge label={item.category.name} variant="outline" />
          ) : null}
        </CardContent>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  cardInner: { gap: Spacing.sm },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardInfo: { flex: 1, gap: Spacing.xs },
  assetName: { fontWeight: "500" },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  changeRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  metaRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
});

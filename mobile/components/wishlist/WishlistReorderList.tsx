import React from "react";
import { View, StyleSheet } from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { Spacing, BorderRadius } from "../../constants/theme";
import type { WishlistItem } from "../../types";

interface Props {
  items: WishlistItem[];
  onDragEnd: (data: WishlistItem[]) => void;
}

export function WishlistReorderList({ items, onDragEnd }: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<WishlistItem>) => {
    const index = getIndex() ?? 0;
    return (
      <ScaleDecorator>
        <View
          style={[
            styles.row,
            {
              backgroundColor: isActive ? theme.muted : theme.card,
              borderColor: isActive ? theme.primary : theme.cardBorder,
            },
          ]}
        >
          <View style={[styles.rank, { backgroundColor: theme.primary + "20" }]}>
            <ThemedText type="bodySm" color={theme.primary} style={styles.bold}>
              #{index + 1}
            </ThemedText>
          </View>

          <View style={styles.info}>
            <ThemedText type="body" style={styles.bold}>{item.name}</ThemedText>
            <ThemedText type="small" color={theme.textSecondary}>
              ${parseFloat(item.amount).toLocaleString()}
            </ThemedText>
          </View>

          <View
            onTouchStart={drag}
            style={styles.grip}
          >
            <Feather name="menu" size={20} color={theme.textTertiary} />
          </View>
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <View style={styles.container}>
      <ThemedText type="small" color={theme.textSecondary} style={styles.hint}>
        {t("wishlist.drag_hint")}
      </ThemedText>
      <DraggableFlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        onDragEnd={({ data }) => onDragEnd(data)}
        containerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hint: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, fontStyle: "italic" },
  list: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  rank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, gap: 2 },
  grip: { padding: Spacing.sm },
  bold: { fontWeight: "600" },
});

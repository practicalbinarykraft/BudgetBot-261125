import React from "react";
import { View, Modal, Pressable, ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Button } from "../Button";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { Spacing, BorderRadius } from "../../constants/theme";
import type { WishlistItem } from "../../types";

interface Props {
  visible: boolean;
  onClose: () => void;
  items: WishlistItem[];
  date: string;
}

function PredictionBadge({ item }: { item: WishlistItem }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const p = item.prediction;

  if (!p) {
    return <ThemedText type="small" color={theme.textTertiary}>—</ThemedText>;
  }
  if (p.canAfford) {
    return <ThemedText type="small" color="#22c55e" style={s.bold}>{t("wishlist.available_now")}</ThemedText>;
  }
  if (p.monthsToAfford != null) {
    return (
      <ThemedText type="small" color={theme.primary} style={s.bold}>
        {t("wishlist.available_in_months").replace("{count}", String(p.monthsToAfford))}
      </ThemedText>
    );
  }
  return <ThemedText type="small" color="#dc2626" style={s.bold}>{t("wishlist.not_affordable")}</ThemedText>;
}

export function WishlistMarkerSheet({ visible, onClose, items, date }: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[s.sheet, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={s.header}>
            <ThemedText type="h4">{date}</ThemedText>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={20} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <View key={item.id} style={[s.row, { borderColor: theme.border }]}>
                <View style={s.rowInfo}>
                  <ThemedText type="body" style={s.bold}>{item.name}</ThemedText>
                  <ThemedText type="small" color={theme.textSecondary}>
                    ${parseFloat(item.amount).toLocaleString()}
                  </ThemedText>
                  <PredictionBadge item={item} />
                </View>
                <Pressable
                  onPress={() => {
                    onClose();
                    navigation.navigate("AddWishlist", { wishlistItem: item });
                  }}
                  hitSlop={8}
                >
                  <Feather name="edit-2" size={16} color={theme.primary} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    maxHeight: "60%",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  rowInfo: { flex: 1, gap: 2 },
  bold: { fontWeight: "600" },
});

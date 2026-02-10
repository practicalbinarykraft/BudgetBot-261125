import React from "react";
import { View, ScrollView, StyleSheet, Pressable, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Button } from "../Button";
import { Input } from "../Input";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { FilterListItem } from "./FilterListItem";
import type { TransactionFilters } from "../../hooks/useTransactionsScreen";
import type { Category, PersonalTag } from "../../types";
import { useTranslation } from "../../i18n";

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: TransactionFilters;
  categories: Category[];
  tags: PersonalTag[];
  hasActiveFilters: boolean;
  toggleTypeFilter: (type: "income" | "expense") => void;
  toggleCategoryFilter: (id: number) => void;
  toggleTagFilter: (id: number) => void;
  setDateFrom: (text: string) => void;
  setDateTo: (text: string) => void;
  clearAllFilters: () => void;
}

export function FilterSheet({
  visible, onClose, filters, categories, tags, hasActiveFilters,
  toggleTypeFilter, toggleCategoryFilter, toggleTagFilter,
  setDateFrom, setDateTo, clearAllFilters,
}: FilterSheetProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">{t("transactions.filters")}</ThemedText>
              <Pressable onPress={onClose} hitSlop={12}>
                <Feather name="x" size={20} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.filterSection}>
              <ThemedText type="small" color={theme.textSecondary} style={styles.filterLabel}>
                {t("common.type")}
              </ThemedText>
              <View style={styles.filterOptions}>
                <Button
                  title={t("transactions.type.income")}
                  variant={filters.types.includes("income") ? "default" : "outline"}
                  size="sm"
                  onPress={() => toggleTypeFilter("income")}
                />
                <Button
                  title={t("transactions.type.expense")}
                  variant={filters.types.includes("expense") ? "default" : "outline"}
                  size="sm"
                  onPress={() => toggleTypeFilter("expense")}
                />
              </View>
            </View>

            <View style={styles.filterSection}>
              <ThemedText type="small" color={theme.textSecondary} style={styles.filterLabel}>
                {t("transactions.category_optional")}
              </ThemedText>
              <View style={styles.filterList}>
                {categories.map((cat) => (
                  <FilterListItem
                    key={cat.id}
                    name={cat.name}
                    color={cat.color || undefined}
                    isSelected={filters.categoryIds.includes(cat.id)}
                    onPress={() => toggleCategoryFilter(cat.id)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <ThemedText type="small" color={theme.textSecondary} style={styles.filterLabel}>
                {t("transactions.tag_optional")}
              </ThemedText>
              <View style={styles.filterList}>
                {tags.map((tag) => (
                  <FilterListItem
                    key={tag.id}
                    name={tag.name}
                    color={tag.color || "#3b82f6"}
                    isSelected={filters.personalTagIds.includes(tag.id)}
                    accentColor={tag.color || undefined}
                    onPress={() => toggleTagFilter(tag.id)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Input
                label={t("transactions.date")}
                value={filters.from}
                onChangeText={setDateFrom}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <View style={styles.filterSection}>
              <Input
                label={t("common.date")}
                value={filters.to}
                onChangeText={setDateTo}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
              />
            </View>

            {hasActiveFilters ? (
              <Button
                title={t("transactions.clear_filters")}
                variant="outline"
                onPress={() => { clearAllFilters(); onClose(); }}
                style={styles.clearAllFilterBtn}
              />
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: {
    maxHeight: "80%",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1, borderBottomWidth: 0, padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: Spacing.lg,
  },
  filterSection: { marginBottom: Spacing.lg },
  filterLabel: { fontWeight: "500", marginBottom: Spacing.sm },
  filterOptions: { flexDirection: "row", gap: Spacing.sm },
  filterList: { gap: Spacing.xs },
  clearAllFilterBtn: { marginTop: Spacing.sm, marginBottom: Spacing.lg },
});

import React from "react";
import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import type { Category } from "../../types";
import { useTranslation } from "../../i18n";

interface CategoryChipsProps {
  allCategories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (name: string | null) => void;
  onCreateNew: () => void;
}

export function CategoryChips({
  allCategories,
  selectedCategory,
  onSelectCategory,
  onCreateNew,
}: CategoryChipsProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.field}>
      <ThemedText
        type="small"
        color={theme.textSecondary}
        style={styles.label}
      >
        {t("transactions.category_optional")}
      </ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        <Pressable
          onPress={() => onSelectCategory(null)}
          style={[
            styles.chip,
            {
              backgroundColor: !selectedCategory
                ? theme.primary + "30"
                : theme.secondary,
              borderColor: !selectedCategory
                ? theme.primary
                : theme.border,
            },
          ]}
        >
          <ThemedText type="small">{t("transactions.select_category")}</ThemedText>
        </Pressable>
        {allCategories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <Pressable
              key={cat.id}
              onPress={() => onSelectCategory(cat.name)}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? (cat.color || theme.primary) + "30"
                    : theme.secondary,
                  borderColor: isSelected
                    ? cat.color || theme.primary
                    : theme.border,
                },
              ]}
            >
              <ThemedText type="small">
                {(cat.icon && cat.icon !== "Tag" ? cat.icon + " " : "") +
                  cat.name}
              </ThemedText>
            </Pressable>
          );
        })}
        <Pressable
          onPress={onCreateNew}
          style={[
            styles.chip,
            {
              backgroundColor: "transparent",
              borderColor: theme.primary,
              borderStyle: "dashed",
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            },
          ]}
        >
          <Feather name="plus" size={12} color={theme.primary} />
          <ThemedText type="small" color={theme.primary}>
            {t("transactions.create_new_category")}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
  },
  chipsRow: {
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
});

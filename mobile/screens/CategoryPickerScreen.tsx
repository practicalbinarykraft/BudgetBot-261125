import React from "react";
import { View, FlatList, Pressable, StyleSheet } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { api } from "../lib/api-client";
import { normalizePaginatedData, categoriesQueryKey } from "../lib/query-client";
import { Spacing, BorderRadius } from "../constants/theme";
import type { Category, PaginatedResponse } from "../types";

type RouteParams = { CategoryPicker: { type: "expense" | "income" } };

export default function CategoryPickerScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, "CategoryPicker">>();
  const categoryType = route.params.type;

  const categoriesQuery = useQuery({
    queryKey: categoriesQueryKey(),
    queryFn: () => api.get<PaginatedResponse<Category>>("/api/categories?limit=100"),
  });

  const categories = normalizePaginatedData<Category>(categoriesQuery.data).filter(
    (c) => c.type === categoryType,
  );

  const selectCategory = (catId: number) => {
    navigation.navigate({
      name: "AddTransaction",
      params: { selectedCategoryId: catId },
      merge: true,
    });
  };

  const renderItem = ({ item }: { item: Category }) => (
    <Pressable
      onPress={() => selectCategory(item.id)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.muted : theme.card,
          borderColor: theme.cardBorder,
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: item.color + "20" }]}>
        <ThemedText type="h3">{item.icon}</ThemedText>
      </View>
      <ThemedText type="body" style={styles.rowName}>{item.name}</ThemedText>
      <Feather name="chevron-right" size={18} color={theme.textTertiary} />
    </Pressable>
  );

  return (
    <FlatList
      data={categories}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Feather name="folder" size={48} color={theme.textTertiary} />
          <ThemedText type="bodySm" color={theme.textSecondary}>
            {t("category_picker.empty")}
          </ThemedText>
        </View>
      }
      ListFooterComponent={
        <Button
          title={t("category_picker.create_new")}
          variant="outline"
          onPress={() => navigation.navigate("AddEditCategory", { type: categoryType })}
          icon={<Feather name="plus" size={16} color={theme.text} />}
          style={styles.createBtn}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing["5xl"] },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  rowName: { flex: 1, fontWeight: "500" },
  empty: {
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing["3xl"],
  },
  createBtn: { marginTop: Spacing.lg },
});

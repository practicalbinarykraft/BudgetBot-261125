import React from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Card, CardContent } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { useTheme } from "../hooks/useTheme";
import { useCategoriesScreen } from "../hooks/useCategoriesScreen";
import { styles } from "./styles/categoriesStyles";
import type { Category } from "../types";

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const {
    navigation, isLoading, isRefetching, refetch,
    incomeCategories, expenseCategories, handleDelete, handlePress,
  } = useCategoriesScreen();

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const renderCategoryCard = (category: Category) => {
    const iconDisplay =
      category.icon && category.icon !== "Tag" ? category.icon : "\uD83D\uDCC1";
    return (
      <Pressable key={category.id} onPress={() => handlePress(category)}>
        <Card style={styles.categoryCard}>
          <CardContent style={styles.categoryCardContent}>
            <View style={styles.categoryLeft}>
              <View style={[styles.iconSquare, { backgroundColor: category.color || "#3b82f6" }]}>
                <ThemedText style={styles.iconEmoji}>{iconDisplay}</ThemedText>
              </View>
              <View>
                <ThemedText type="bodySm" style={styles.categoryName}>{category.name}</ThemedText>
                <Badge label={category.type === "income" ? "Income" : "Expense"} variant="secondary" />
              </View>
            </View>
            <Pressable onPress={() => handleDelete(category)} hitSlop={8} style={styles.deleteBtn}>
              <Feather name="trash-2" size={16} color={theme.textSecondary} />
            </Pressable>
          </CardContent>
        </Card>
      </Pressable>
    );
  };

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={styles.headerRow}>
        <View>
          <ThemedText type="h3" style={styles.headerTitle}>{"Categories"}</ThemedText>
          <ThemedText type="small" color={theme.textSecondary}>{"Organize your spending"}</ThemedText>
        </View>
        <Button
          title="Add Category"
          size="sm"
          onPress={() => navigation.navigate("AddEditCategory", {})}
          icon={<Feather name="plus" size={14} color={theme.primaryForeground} />}
        />
      </View>
      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionHeading}>{"Income Categories"}</ThemedText>
        {incomeCategories.length > 0 ? (
          <View style={styles.categoryList}>{incomeCategories.map(renderCategoryCard)}</View>
        ) : (
          <Card>
            <CardContent style={styles.emptySection}>
              <ThemedText type="body" color={theme.textSecondary}>{"No income categories"}</ThemedText>
            </CardContent>
          </Card>
        )}
      </View>
      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionHeading}>{"Expense Categories"}</ThemedText>
        {expenseCategories.length > 0 ? (
          <View style={styles.categoryList}>{expenseCategories.map(renderCategoryCard)}</View>
        ) : (
          <Card>
            <CardContent style={styles.emptySection}>
              <ThemedText type="body" color={theme.textSecondary}>{"No expense categories"}</ThemedText>
            </CardContent>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

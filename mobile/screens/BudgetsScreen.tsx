import React from "react";
import { View, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { useTheme } from "../hooks/useTheme";
import { useBudgetsScreen } from "../hooks/useBudgetsScreen";
import { BudgetExceededAlert } from "../components/budgets/BudgetExceededAlert";
import { BudgetProgressSection } from "../components/budgets/BudgetProgressSection";
import { BudgetCardItem } from "../components/budgets/BudgetCardItem";
import { BudgetEmptyState } from "../components/budgets/BudgetEmptyState";
import { budgetsStyles as styles } from "../components/budgets/budgetsStyles";
import { useTranslation } from "../i18n";

export default function BudgetsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const {
    limits,
    exceededBudgets,
    isLoading,
    isRefetching,
    refetch,
    handleDelete,
    handleEdit,
    navigateToAddBudget,
  } = useBudgetsScreen();

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      <View style={styles.headerRow}>
        <View>
          <ThemedText type="h3" style={styles.headerTitle}>
            {t("budgets.title")}
          </ThemedText>
          <ThemedText type="small" color={theme.textSecondary}>
            {t("budgets.manage")}
          </ThemedText>
        </View>
        <Button
          title={t("budgets.add_budget")}
          size="sm"
          onPress={navigateToAddBudget}
          icon={
            <Feather name="plus" size={14} color={theme.primaryForeground} />
          }
        />
      </View>

      <BudgetExceededAlert count={exceededBudgets.length} />

      <BudgetProgressSection limits={limits} />

      {limits.length === 0 ? (
        <BudgetEmptyState onAddBudget={navigateToAddBudget} />
      ) : (
        <View style={styles.budgetCards}>
          {limits.map((item) => (
            <BudgetCardItem
              key={item.budgetId}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

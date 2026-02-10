import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/Card";
import { Button } from "../components/Button";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useTransactionsScreen } from "../hooks/useTransactionsScreen";
import { FilterSheet } from "../components/transactions/FilterSheet";
import { TransactionGroup } from "../components/transactions/TransactionGroup";
import { ActiveFilterBadges } from "../components/transactions/ActiveFilterBadges";
import { useTranslation } from "../i18n";

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const {
    filters,
    showFilters,
    setShowFilters,
    categories,
    tags,
    transactions,
    categoryMap,
    tagMap,
    groupedTransactions,
    hasActiveFilters,
    activeFilterCount,
    activeFilterBadges,
    clearAllFilters,
    toggleTypeFilter,
    toggleCategoryFilter,
    toggleTagFilter,
    setDateFrom,
    setDateTo,
    isLoading,
    isRefreshing,
    handleRefresh,
  } = useTransactionsScreen();

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Block 1: Header — web: flex-col gap-3 sm:flex-row sm:justify-between */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <ThemedText type="h3" style={styles.headerTitle}>
              {t("transactions.title")}
            </ThemedText>
            <ThemedText type="small" color={theme.textSecondary}>
              {t("transactions.manage")}
            </ThemedText>
            {hasActiveFilters ? (
              <ActiveFilterBadges
                badges={activeFilterBadges}
                onClearAll={clearAllFilters}
              />
            ) : null}
          </View>

          {/* Right buttons — web: flex gap-2 */}
          <View style={styles.headerButtons}>
            <Button
              title={
                activeFilterCount > 0
                  ? `${t("common.filter")} (${activeFilterCount})`
                  : t("common.filter")
              }
              variant="outline"
              size="sm"
              onPress={() => setShowFilters(true)}
              icon={<Feather name="filter" size={14} color={theme.text} />}
            />
            <Button
              title={t("transactions.add_transaction")}
              size="sm"
              onPress={() => navigation.navigate("AddTransaction")}
              icon={
                <Feather
                  name="plus"
                  size={14}
                  color={theme.primaryForeground}
                />
              }
            />
          </View>
        </View>

        {/* Block 2: TransactionList in Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("transactions.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <View style={styles.emptyTransactions}>
                <ThemedText type="body" color={theme.textSecondary}>
                  {t("transactions.no_transactions")}
                </ThemedText>
                <ThemedText
                  type="small"
                  color={theme.textSecondary}
                  style={styles.emptyHint}
                >
                  {t("transactions.clear_filters")}
                </ThemedText>
              </View>
            ) : (
              <View style={styles.transactionGroups}>
                {Array.from(groupedTransactions.entries()).map(
                  ([dateKey, dateTxns]) => (
                    <TransactionGroup
                      key={dateKey}
                      dateKey={dateKey}
                      transactions={dateTxns}
                      categoryMap={categoryMap}
                      tagMap={tagMap}
                      onTransactionPress={(t) =>
                        navigation.navigate("EditTransaction", { transaction: t })
                      }
                    />
                  )
                )}
              </View>
            )}
          </CardContent>
        </Card>
      </ScrollView>

      <FilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        categories={categories}
        tags={tags}
        hasActiveFilters={hasActiveFilters}
        toggleTypeFilter={toggleTypeFilter}
        toggleCategoryFilter={toggleCategoryFilter}
        toggleTagFilter={toggleTagFilter}
        setDateFrom={setDateFrom}
        setDateTo={setDateTo}
        clearAllFilters={clearAllFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing["5xl"] },
  headerRow: { gap: Spacing.md },
  headerLeft: { gap: 4 },
  headerTitle: { fontWeight: "700" },
  headerButtons: { flexDirection: "row", gap: Spacing.sm },
  emptyTransactions: { alignItems: "center", paddingVertical: Spacing["3xl"] },
  emptyHint: { marginTop: 4 },
  transactionGroups: { gap: Spacing.lg },
});

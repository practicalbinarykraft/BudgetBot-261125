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
import { Button } from "../components/Button";
import FinancialTrendChart from "../components/FinancialTrendChart";
import { WishlistSummaryList } from "../components/wishlist/WishlistSummaryList";
import { StatCardsGrid } from "../components/dashboard-analytics/StatCardsGrid";
import { BudgetAlerts } from "../components/dashboard-analytics/BudgetAlerts";
import { RecentTransactions } from "../components/dashboard-analytics/RecentTransactions";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { useDashboardAnalytics } from "../hooks/useDashboardAnalytics";
import { useWishlistChart } from "../hooks/useWishlistChart";
import { useFinancialTrendChart } from "../hooks/useFinancialTrendChart";
import type { DateFilterValue } from "../utils/date-helpers";

const dateFilterKeys: { value: DateFilterValue; labelKey: string }[] = [
  { value: "week", labelKey: "dashboard.filter_week" },
  { value: "month", labelKey: "dashboard.filter_month" },
  { value: "year", labelKey: "dashboard.filter_year" },
  { value: "all", labelKey: "dashboard.filter_all" },
];

export default function DashboardAnalyticsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const {
    dateFilter,
    setDateFilter,
    totalBalance,
    totalIncome,
    totalExpense,
    categoryMap,
    tagMap,
    recentTransactions,
    groupedTransactions,
    exceededBudgets,
    warningBudgets,
    isLoading,
    isRefreshing,
    handleRefresh,
  } = useDashboardAnalytics();

  const { sampledTrendData } = useFinancialTrendChart();
  const { markers, wishlistItems } = useWishlistChart(sampledTrendData);

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
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Block 1: Header row */}
      <View style={styles.headerRow}>
        <View>
          <ThemedText type="h3" style={styles.headerTitle}>
            {t("analytics.title")}
          </ThemedText>
          <ThemedText type="small" color={theme.textSecondary}>
            {t("dashboard.subtitle")}
          </ThemedText>
        </View>
        <View style={styles.headerButtons}>
          <Button
            title={t("dashboard.calibrate")}
            variant="outline"
            size="sm"
            onPress={() => navigation.navigate("Calibration")}
            icon={<Feather name="settings" size={14} color={theme.text} />}
          />
          <Button
            title={t("dashboard.add_transaction")}
            size="sm"
            onPress={() => navigation.navigate("AddTransaction")}
            icon={
              <Feather name="plus" size={14} color={theme.primaryForeground} />
            }
          />
        </View>
      </View>

      {/* Block 2: DateFilter */}
      <View style={styles.dateFilterRow}>
        {dateFilterKeys.map((f) => (
          <Button
            key={f.value}
            title={t(f.labelKey)}
            variant={dateFilter === f.value ? "default" : "outline"}
            size="sm"
            onPress={() => setDateFilter(f.value)}
          />
        ))}
      </View>

      {/* Block 3: BudgetAlerts */}
      <BudgetAlerts
        exceededBudgets={exceededBudgets}
        warningBudgets={warningBudgets}
      />

      {/* Block 4: StatCards */}
      <StatCardsGrid
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        totalBalance={totalBalance}
        onViewDetails={() => navigation.navigate("Transactions")}
      />

      {/* Block 5: FinancialTrendChart with wishlist markers */}
      <FinancialTrendChart
        wishlistMarkers={markers}
        onFullscreen={(params) => navigation.navigate("FullscreenChart", params)}
      />

      {/* Block 5.5: Wishlist Goals Summary */}
      <WishlistSummaryList items={wishlistItems} sampledTrendData={sampledTrendData} />

      {/* Block 6: Recent Transactions */}
      <RecentTransactions
        recentTransactions={recentTransactions}
        groupedTransactions={groupedTransactions}
        categoryMap={categoryMap}
        tagMap={tagMap}
        onTransactionPress={(t) =>
          navigation.navigate("EditTransaction", { transaction: t })
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing["5xl"],
  },
  headerRow: {
    gap: Spacing.md,
  },
  headerTitle: {
    fontWeight: "700",
  },
  headerButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  dateFilterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
});

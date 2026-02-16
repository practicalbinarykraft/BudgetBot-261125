import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "../components/ThemedText";
import NotificationsBell from "../components/NotificationsBell";
import CreditsWidget from "../components/CreditsWidget";
import FloatingActionPanel from "../components/FloatingActionPanel";
import MobileMenuSheet from "../components/MobileMenuSheet";
import { CategoryScroll } from "../components/dashboard/CategoryScroll";
import { RecentTransactionsSection } from "../components/dashboard/RecentTransactionsSection";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { getDateLocale } from "../lib/date-locale";
import {
  useDashboardScreen,
  formatMonthYear,
  formatAmount,
} from "../hooks/useDashboardScreen";
import { completeTutorialStep } from "../lib/tutorial-step";
import { useTutorialProgress } from "../hooks/useTutorialProgress";
import { openTutorial } from "../lib/tutorial-ref";

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { language } = useTranslation();
  const tutorial = useTutorialProgress();
  const showHelp = tutorial.completedSteps < tutorial.totalSteps;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [menuVisible, setMenuVisible] = useState(false);
  const {
    selectedMonth, goToPrevMonth, goToNextMonth,
    totalBalanceUsd, totalIncome, totalExpense, balance,
    topCategories, budgetByCategoryId,
    recentTransactions, categoryMap, tagMap,
    isLoading, isRefreshing, handleRefresh,
  } = useDashboardScreen();

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={[styles.headerRow, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={() => navigation.navigate("Wallets")}
            style={styles.headerLeft}
          >
            <Feather name="credit-card" size={20} color={theme.textSecondary} />
            <ThemedText type="bodySm" style={styles.headerBalance}>
              {formatAmount(totalBalanceUsd)}
            </ThemedText>
          </Pressable>
          <View style={styles.headerRight}>
            {showHelp && (
              <Pressable onPress={() => openTutorial()} style={styles.headerIconButton}>
                <Feather name="help-circle" size={20} color={theme.primary} />
              </Pressable>
            )}
            <CreditsWidget />
            <NotificationsBell />
            <Pressable
              onPress={() => navigation.navigate("DashboardAnalytics")}
              style={styles.headerIconButton}
            >
              <Feather name="bar-chart-2" size={20} color={theme.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => setMenuVisible(true)}
              style={styles.headerIconButton}
            >
              <Feather name="menu" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <Pressable onPress={goToPrevMonth} style={[styles.monthBtn, { backgroundColor: theme.muted }]}>
            <Feather name="chevron-left" size={20} color={theme.text} />
          </Pressable>
          <ThemedText type="h4" style={styles.monthLabel}>
            {formatMonthYear(selectedMonth, getDateLocale(language))}
          </ThemedText>
          <Pressable onPress={goToNextMonth} style={[styles.monthBtn, { backgroundColor: theme.muted }]}>
            <Feather name="chevron-right" size={20} color={theme.text} />
          </Pressable>
        </View>

        {/* Large Balance */}
        <View style={styles.balanceContainer}>
          <ThemedText type="mono4xl" style={styles.balanceText}>
            {formatAmount(balance)}
          </ThemedText>
        </View>

        {/* Income/Expense Buttons */}
        <View style={styles.incomeExpenseRow}>
          <Pressable
            onPress={() => navigation.navigate("Transactions")}
            style={[styles.statButton, { backgroundColor: "#22c55e20", borderColor: "#22c55e30" }]}
          >
            <Feather name="arrow-up" size={16} color="#16a34a" />
            <ThemedText type="bodySm" color="#16a34a" style={styles.statBtnText}>
              {formatAmount(totalIncome)}
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("Transactions")}
            style={[styles.statButton, { backgroundColor: "#ef444420", borderColor: "#ef444430" }]}
          >
            <Feather name="arrow-down" size={16} color="#dc2626" />
            <ThemedText type="bodySm" color="#dc2626" style={styles.statBtnText}>
              {formatAmount(totalExpense)}
            </ThemedText>
          </Pressable>
        </View>

        {/* Categories */}
        <CategoryScroll
          topCategories={topCategories}
          budgetByCategoryId={budgetByCategoryId}
        />

        {/* Recent Transactions */}
        <RecentTransactionsSection
          recentTransactions={recentTransactions}
          categoryMap={categoryMap}
          tagMap={tagMap}
          onViewAll={() => {
            completeTutorialStep("view_transactions");
            navigation.navigate("Transactions");
          }}
          onTransactionPress={(t) =>
            navigation.navigate("EditTransaction", { transaction: t })
          }
        />
      </ScrollView>
      <FloatingActionPanel />
      <MobileMenuSheet visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { paddingBottom: Spacing["5xl"] },
  headerRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  headerBalance: { fontWeight: "500" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  headerIconButton: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  monthNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: Spacing.lg, paddingVertical: Spacing.lg, marginBottom: Spacing.xl,
  },
  monthBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  monthLabel: { fontWeight: "600" },
  balanceContainer: { alignItems: "center", marginBottom: Spacing.xl },
  balanceText: { fontWeight: "700" },
  incomeExpenseRow: {
    flexDirection: "row", gap: Spacing.md,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl,
  },
  statButton: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: Spacing.sm, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md, borderWidth: 1,
  },
  statBtnText: { fontWeight: "500" },
});

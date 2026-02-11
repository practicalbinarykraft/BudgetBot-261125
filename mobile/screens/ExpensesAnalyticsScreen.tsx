import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { BreakdownCard } from "../components/BreakdownCard";
import { TypeBreakdownCard } from "../components/expenses-analytics/TypeBreakdownCard";
import { UnsortedTransactionsCard } from "../components/expenses-analytics/UnsortedTransactionsCard";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import {
  useExpensesAnalyticsScreen,
  periods,
  tabs,
} from "../hooks/useExpensesAnalyticsScreen";

export default function ExpensesAnalyticsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const {
    period,
    setPeriod,
    activeTab,
    setActiveTab,
    categoryQuery,
    personQuery,
    typeQuery,
    unsortedQuery,
    migrateMutation,
    formatDate,
  } = useExpensesAnalyticsScreen();

  const renderContent = () => {
    if (activeTab === "category") {
      if (categoryQuery.isLoading)
        return <ActivityIndicator size="large" color={theme.primary} />;
      const data = categoryQuery.data;
      return (
        <BreakdownCard
          title="Spending by Category"
          total={data?.total ?? 0}
          items={data?.items ?? []}
        />
      );
    }

    if (activeTab === "person") {
      if (personQuery.isLoading)
        return <ActivityIndicator size="large" color={theme.primary} />;
      const data = personQuery.data;
      return (
        <BreakdownCard
          title="Spending by Person"
          total={data?.total ?? 0}
          items={data?.items ?? []}
        />
      );
    }

    if (activeTab === "type") {
      if (typeQuery.isLoading)
        return <ActivityIndicator size="large" color={theme.primary} />;
      const data = typeQuery.data;
      return (
        <TypeBreakdownCard
          total={data?.total ?? 0}
          items={data?.items ?? []}
        />
      );
    }

    if (unsortedQuery.isLoading)
      return <ActivityIndicator size="large" color={theme.primary} />;
    return (
      <UnsortedTransactionsCard
        data={unsortedQuery.data}
        formatDate={formatDate}
      />
    );
  };

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText type="h2">{t("analytics.expenses")}</ThemedText>
          <ThemedText type="bodySm" color={theme.textSecondary}>
            {"Analyze your spending across categories, people, and types"}
          </ThemedText>
        </View>
      </View>

      <View style={styles.actionBar}>
        <Button
          title={migrateMutation.isPending ? "Fixing..." : "Fix Unsorted"}
          variant="outline"
          size="sm"
          onPress={() => migrateMutation.mutate()}
          disabled={migrateMutation.isPending}
          loading={migrateMutation.isPending}
        />
        <View style={styles.periodRow}>
          {periods.map((p) => {
            const isActive = period === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => setPeriod(p.key)}
                style={[
                  styles.periodBtn,
                  {
                    backgroundColor: isActive
                      ? theme.primary
                      : theme.secondary,
                    borderColor: isActive ? theme.primary : theme.border,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  color={isActive ? "#ffffff" : theme.text}
                >
                  {p.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.tabsRow}>
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: isActive
                    ? theme.primary
                    : theme.secondary,
                  borderColor: isActive ? theme.primary : theme.border,
                },
              ]}
            >
              <ThemedText
                type="small"
                color={isActive ? "#ffffff" : theme.text}
              >
                {t.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {renderContent()}
    </ScrollView>
  );
}

const S = Spacing;
const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: S.lg, paddingBottom: S["5xl"] },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: S.md, marginBottom: S.md },
  headerLeft: { flex: 1, gap: S.xs },
  actionBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: S.sm, marginBottom: S.md },
  periodRow: { flexDirection: "row", gap: S.sm },
  periodBtn: { paddingHorizontal: S.md, paddingVertical: S.sm, borderRadius: BorderRadius.sm, borderWidth: 1 },
  tabsRow: { flexDirection: "row", gap: S.sm, marginBottom: S.lg },
  tabBtn: { flex: 1, paddingVertical: S.sm, borderRadius: BorderRadius.sm, borderWidth: 1, alignItems: "center" },
});

import React from "react";
import {
  View,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { Card, CardContent } from "../components/Card";
import { TagBadge } from "../components/TagBadge";
import { TransactionItem } from "../components/TransactionItem";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { useTagDetailScreen } from "../hooks/useTagDetailScreen";

function StatCard({ title, value, color, theme }: {
  title: string; value: string; color: string; theme: any;
}) {
  return (
    <Card style={styles.statCard}>
      <CardContent style={styles.statContent}>
        <ThemedText type="small" color={theme.textSecondary}>{title}</ThemedText>
        <ThemedText type="h3" color={color} style={styles.statValue}>{value}</ThemedText>
      </CardContent>
    </Card>
  );
}

export default function TagDetailScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const h = useTagDetailScreen();

  if (h.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!h.currentTag) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemedText type="h3">Tag Not Found</ThemedText>
        <ThemedText type="bodySm" color={theme.textSecondary}>
          {"The requested tag does not exist"}
        </ThemedText>
        <Button title="Go Back" variant="outline" onPress={() => h.navigation.goBack()} style={styles.goBackBtn} />
      </View>
    );
  }

  return (
    <SectionList
      sections={h.sections}
      keyExtractor={(item) => String(item.id)}
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      stickySectionHeadersEnabled={false}
      refreshControl={
        <RefreshControl
          refreshing={h.isRefreshing}
          onRefresh={() => {
            h.tagsQuery.refetch();
            h.statsQuery.refetch();
            h.transactionsQuery.refetch();
          }}
        />
      }
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TagBadge tag={h.currentTag} />
              <ThemedText type="bodySm" color={theme.textSecondary}>{h.typeSubtitle}</ThemedText>
            </View>
            <Button
              title="Add Transaction"
              size="sm"
              onPress={() => h.navigation.navigate("AddTransaction")}
              icon={<Feather name="plus" size={14} color={theme.primaryForeground} />}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard title="Total Transactions" value={String(h.stats.transactionCount)} color={theme.text} theme={theme} />
            <StatCard title="Total Spent" value={`$${h.stats.totalSpent.toFixed(2)}`} color={theme.destructive} theme={theme} />
            <StatCard title="Total Income" value={`$${h.stats.totalIncome.toFixed(2)}`} color="#16a34a" theme={theme} />
          </View>
          <ThemedText type="h3" style={styles.sectionTitle}>{"Transactions"}</ThemedText>
        </View>
      }
      renderSectionHeader={({ section: { title } }) => (
        <ThemedText type="small" color={theme.textSecondary} style={styles.dateHeader}>{title}</ThemedText>
      )}
      renderItem={({ item: tx }) => (
        <TransactionItem
          transaction={tx}
          onPress={() => h.navigation.navigate("EditTransaction", { transaction: tx })}
        />
      )}
      ListEmptyComponent={
        h.isTransactionsLoading ? (
          <ActivityIndicator size="small" color={theme.primary} style={styles.loader} />
        ) : (
          <View style={styles.empty}>
            <ThemedText type="body" color={theme.textSecondary}>{"No transactions found for this tag"}</ThemedText>
            <ThemedText type="small" color={theme.textTertiary}>{"Start by adding a new transaction above"}</ThemedText>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.md },
  content: { padding: Spacing.lg, paddingBottom: Spacing["5xl"] },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", gap: Spacing.md, marginBottom: Spacing.lg,
  },
  headerLeft: { flex: 1, gap: Spacing.xs },
  statsRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.xl },
  statCard: { flex: 1 },
  statContent: { gap: Spacing.xs },
  statValue: { fontWeight: "700" },
  sectionTitle: { marginBottom: Spacing.md },
  dateHeader: { marginTop: Spacing.md, marginBottom: Spacing.xs, fontWeight: "600" },
  empty: { paddingVertical: Spacing["4xl"], alignItems: "center", gap: Spacing.sm },
  loader: { marginTop: Spacing.xl },
  goBackBtn: { marginTop: Spacing.md },
});

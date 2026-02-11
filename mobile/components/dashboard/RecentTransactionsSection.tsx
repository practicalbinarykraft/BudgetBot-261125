import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import { TransactionItem } from "../TransactionItem";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import type { Transaction, Category } from "../../types";

interface RecentTransactionsSectionProps {
  recentTransactions: Transaction[];
  categoryMap: Record<number, Category>;
  onViewAll: () => void;
  onTransactionPress: (t: Transaction) => void;
}

export function RecentTransactionsSection({
  recentTransactions,
  categoryMap,
  onViewAll,
  onTransactionPress,
}: RecentTransactionsSectionProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.recentSection}>
      <View style={styles.recentHeader}>
        <ThemedText type="h4" style={styles.recentTitle}>
          {t("dashboard.recent_transactions")}
        </ThemedText>
        <Pressable onPress={onViewAll}>
          <ThemedText type="bodySm" color={theme.primary}>
            {t("common.view_all")}
          </ThemedText>
        </Pressable>
      </View>

      {recentTransactions.length === 0 ? (
        <View style={styles.emptyTransactions}>
          <ThemedText type="body" color={theme.textSecondary}>
            {t("dashboard.no_transactions")}
          </ThemedText>
        </View>
      ) : (
        <View style={styles.transactionList}>
          {recentTransactions.map((t) => {
            const cat = t.categoryId
              ? categoryMap[t.categoryId]
              : undefined;
            return (
              <TransactionItem
                key={t.id}
                transaction={t}
                categoryLabel={cat?.name}
                onPress={() => onTransactionPress(t)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  recentSection: {
    paddingHorizontal: Spacing.lg,
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  recentTitle: {
    fontWeight: "600",
  },
  emptyTransactions: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  transactionList: {
    gap: Spacing.xs,
  },
});

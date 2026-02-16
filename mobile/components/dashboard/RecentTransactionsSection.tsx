import React, { useRef } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import { TransactionItem } from "../TransactionItem";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { setViewAllRect } from "../../lib/view-all-ref";
import type { Transaction, Category, PersonalTag } from "../../types";

interface RecentTransactionsSectionProps {
  recentTransactions: Transaction[];
  categoryMap: Record<number, Category>;
  tagMap: Record<number, PersonalTag>;
  onViewAll: () => void;
  onTransactionPress: (t: Transaction) => void;
}

export function RecentTransactionsSection({
  recentTransactions,
  categoryMap,
  tagMap,
  onViewAll,
  onTransactionPress,
}: RecentTransactionsSectionProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const viewAllRef = useRef<View>(null);

  return (
    <View style={styles.recentSection}>
      <View style={styles.recentHeader}>
        <ThemedText type="h4" style={styles.recentTitle}>
          {t("dashboard.recent_transactions")}
        </ThemedText>
        <Pressable
          ref={viewAllRef}
          onPress={onViewAll}
          onLayout={() => {
            viewAllRef.current?.measureInWindow((x, y, width, height) => {
              setViewAllRect({ x, y, width, height });
            });
          }}
        >
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
            const txTag = t.personalTagId
              ? tagMap[t.personalTagId]
              : undefined;
            return (
              <TransactionItem
                key={t.id}
                transaction={t}
                category={cat}
                tag={txTag}
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

import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import { TransactionItem } from "../TransactionItem";
import { Card, CardHeader, CardTitle, CardContent } from "../Card";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { getDateLocale } from "../../lib/date-locale";
import { getDateHeader } from "../../utils/date-helpers";
import type { Transaction, Category } from "../../types";

interface RecentTransactionsProps {
  recentTransactions: Transaction[];
  groupedTransactions: Map<string, Transaction[]>;
  categoryMap: Record<number, Category>;
  onTransactionPress: (transaction: Transaction) => void;
}

export function RecentTransactions({
  recentTransactions,
  groupedTransactions,
  categoryMap,
  onTransactionPress,
}: RecentTransactionsProps) {
  const { theme } = useTheme();
  const { language, t } = useTranslation();
  const dateLabels = { today: t("common.today"), yesterday: t("common.yesterday") };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{"Recent Transactions"}</CardTitle>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <View style={styles.emptyTransactions}>
            <ThemedText type="body" color={theme.textSecondary}>
              {"No transactions yet"}
            </ThemedText>
            <ThemedText
              type="small"
              color={theme.textSecondary}
              style={styles.emptyHint}
            >
              {"Add your first transaction to get started"}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.transactionGroups}>
            {Array.from(groupedTransactions.entries()).map(
              ([dateKey, dateTxns]) => (
                <View key={dateKey} style={styles.dateGroup}>
                  <ThemedText
                    type="bodySm"
                    color={theme.textSecondary}
                    style={styles.dateHeader}
                  >
                    {getDateHeader(dateKey, getDateLocale(language), dateLabels)}
                  </ThemedText>
                  {dateTxns.map((t) => {
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
              )
            )}
          </View>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  emptyTransactions: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyHint: {
    marginTop: 4,
  },
  transactionGroups: {
    gap: Spacing.lg,
  },
  dateGroup: {
    gap: Spacing.sm,
  },
  dateHeader: {
    fontWeight: "600",
    paddingHorizontal: Spacing.sm,
  },
});

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
import type { Transaction, Category, PersonalTag } from "../../types";

interface RecentTransactionsProps {
  recentTransactions: Transaction[];
  groupedTransactions: Map<string, Transaction[]>;
  categoryMap: Record<number, Category>;
  tagMap: Record<number, PersonalTag>;
  onTransactionPress: (transaction: Transaction) => void;
}

export function RecentTransactions({
  recentTransactions,
  groupedTransactions,
  categoryMap,
  tagMap,
  onTransactionPress,
}: RecentTransactionsProps) {
  const { theme } = useTheme();
  const { language, t } = useTranslation();
  const dateLabels = { today: t("common.today"), yesterday: t("common.yesterday") };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.recent_transactions")}</CardTitle>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <View style={styles.emptyTransactions}>
            <ThemedText type="body" color={theme.textSecondary}>
              {t("dashboard.no_transactions")}
            </ThemedText>
            <ThemedText
              type="small"
              color={theme.textSecondary}
              style={styles.emptyHint}
            >
              {t("dashboard.add_first_transaction")}
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

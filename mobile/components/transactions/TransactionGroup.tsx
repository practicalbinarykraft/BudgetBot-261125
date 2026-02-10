import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import { TransactionItem } from "../TransactionItem";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { getDateHeader } from "../../hooks/useTransactionsScreen";
import type { Transaction, Category, PersonalTag } from "../../types";

interface TransactionGroupProps {
  dateKey: string;
  transactions: Transaction[];
  categoryMap: Record<number, Category>;
  tagMap: Record<number, PersonalTag>;
  onTransactionPress: (transaction: Transaction) => void;
}

export function TransactionGroup({
  dateKey,
  transactions,
  categoryMap,
  tagMap,
  onTransactionPress,
}: TransactionGroupProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.dateGroup}>
      <ThemedText
        type="bodySm"
        color={theme.textSecondary}
        style={styles.dateHeader}
      >
        {getDateHeader(dateKey)}
      </ThemedText>
      {transactions.map((t) => {
        const cat = t.categoryId ? categoryMap[t.categoryId] : undefined;
        const txTag = t.personalTagId ? tagMap[t.personalTagId] : undefined;
        return (
          <TransactionItem
            key={t.id}
            transaction={t}
            categoryLabel={cat?.name}
            tag={txTag}
            onPress={() => onTransactionPress(t)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dateGroup: {
    gap: Spacing.sm,
  },
  dateHeader: {
    fontWeight: "600",
    paddingHorizontal: Spacing.sm,
  },
});

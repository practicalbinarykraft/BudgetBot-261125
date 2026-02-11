import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import { Card, CardHeader, CardContent } from "../Card";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";

interface CashflowCardProps {
  monthlyIncome: number;
  monthlyExpense: number;
}

export function CashflowCard({ monthlyIncome, monthlyExpense }: CashflowCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <ThemedText type="h4" style={styles.bold}>
          {t("assets.monthly_cashflow")}
        </ThemedText>
      </CardHeader>
      <CardContent style={styles.cashflowContent}>
        {monthlyIncome > 0 ? (
          <View style={styles.cashflowRow}>
            <ThemedText type="bodySm" color={theme.textSecondary}>
              {t("common.income")}
            </ThemedText>
            <ThemedText type="bodySm" mono color="#10b981">
              {"+$"}
              {monthlyIncome.toFixed(2)}
            </ThemedText>
          </View>
        ) : null}
        {monthlyExpense > 0 ? (
          <View style={styles.cashflowRow}>
            <ThemedText type="bodySm" color={theme.textSecondary}>
              {t("common.expense")}
            </ThemedText>
            <ThemedText type="bodySm" mono color={theme.destructive}>
              {"-$"}
              {monthlyExpense.toFixed(2)}
            </ThemedText>
          </View>
        ) : null}
        <View
          style={[
            styles.cashflowRow,
            { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: Spacing.sm },
          ]}
        >
          <ThemedText type="bodySm" style={styles.bold}>
            {t("common.net")}
          </ThemedText>
          <ThemedText type="bodySm" mono style={styles.bold}>
            {"$"}
            {(monthlyIncome - monthlyExpense).toFixed(2)}
          </ThemedText>
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: "600" },
  cashflowContent: { gap: Spacing.sm },
  cashflowRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

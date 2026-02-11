import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import type { LimitProgress } from "../../types";

interface BudgetAlertsProps {
  exceededBudgets: LimitProgress[];
  warningBudgets: LimitProgress[];
}

export function BudgetAlerts({
  exceededBudgets,
  warningBudgets,
}: BudgetAlertsProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      {exceededBudgets.length > 0 ? (
        <View
          style={[
            styles.alert,
            {
              backgroundColor: theme.destructive + "15",
              borderColor: theme.destructive + "40",
            },
          ]}
        >
          <View style={styles.alertHeader}>
            <Feather name="alert-circle" size={16} color={theme.destructive} />
            <ThemedText
              type="bodySm"
              color={theme.destructive}
              style={styles.alertTitle}
            >
              {t("dashboard.budget_exceeded")}
            </ThemedText>
          </View>
          <ThemedText type="small" color={theme.destructive}>
            {t("dashboard.budget_exceeded_count").replace("{count}", String(exceededBudgets.length))}
          </ThemedText>
          {exceededBudgets.map((b) => (
            <ThemedText key={b.budgetId} type="small" color={theme.destructive}>
              {"\u2022 "}
              {b.categoryName}: ${b.spent.toFixed(2)} / $
              {parseFloat(b.limitAmount).toFixed(2)} ({b.percentage.toFixed(0)}
              %)
            </ThemedText>
          ))}
        </View>
      ) : null}

      {warningBudgets.length > 0 ? (
        <View
          style={[
            styles.alert,
            {
              backgroundColor: theme.warning + "15",
              borderColor: theme.warning + "40",
            },
          ]}
        >
          <View style={styles.alertHeader}>
            <Feather name="alert-circle" size={16} color={theme.warning} />
            <ThemedText
              type="bodySm"
              color={theme.warning}
              style={styles.alertTitle}
            >
              {t("dashboard.budget_warning")}
            </ThemedText>
          </View>
          <ThemedText type="small" color={theme.warning}>
            {t("dashboard.budget_warning_count").replace("{count}", String(warningBudgets.length))}
          </ThemedText>
          {warningBudgets.map((b) => (
            <ThemedText key={b.budgetId} type="small" color={theme.warning}>
              {"\u2022 "}
              {b.categoryName}: ${b.spent.toFixed(2)} / $
              {parseFloat(b.limitAmount).toFixed(2)} ({b.percentage.toFixed(0)}
              %)
            </ThemedText>
          ))}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  alert: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  alertTitle: {
    fontWeight: "600",
  },
});

import React from "react";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Card, CardContent } from "../Card";
import { Button } from "../Button";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { budgetsStyles as styles } from "./budgetsStyles";

interface BudgetEmptyStateProps {
  onAddBudget: () => void;
}

export function BudgetEmptyState({ onAddBudget }: BudgetEmptyStateProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent style={styles.emptyState}>
        <Feather name="trending-down" size={48} color={theme.textTertiary} />
        <ThemedText type="h4" style={styles.emptyTitle}>
          {t("budgets.no_budgets")}
        </ThemedText>
        <ThemedText
          type="body"
          color={theme.textSecondary}
          style={styles.emptyDescription}
        >
          {t("budgets.manage")}
        </ThemedText>
        <Button
          title={t("budgets.add_budget")}
          onPress={onAddBudget}
          icon={
            <Feather name="plus" size={14} color={theme.primaryForeground} />
          }
        />
      </CardContent>
    </Card>
  );
}

import React from "react";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Card, CardContent } from "../Card";
import { Button } from "../Button";
import { useTheme } from "../../hooks/useTheme";
import { budgetsStyles as styles } from "./budgetsStyles";

interface BudgetEmptyStateProps {
  onAddBudget: () => void;
}

export function BudgetEmptyState({ onAddBudget }: BudgetEmptyStateProps) {
  const { theme } = useTheme();

  return (
    <Card>
      <CardContent style={styles.emptyState}>
        <Feather name="trending-down" size={48} color={theme.textTertiary} />
        <ThemedText type="h4" style={styles.emptyTitle}>
          {"No budgets yet"}
        </ThemedText>
        <ThemedText
          type="body"
          color={theme.textSecondary}
          style={styles.emptyDescription}
        >
          {"Set spending limits for your categories"}
        </ThemedText>
        <Button
          title="Add Budget"
          onPress={onAddBudget}
          icon={
            <Feather name="plus" size={14} color={theme.primaryForeground} />
          }
        />
      </CardContent>
    </Card>
  );
}

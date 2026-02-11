import React from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { useTheme } from "../../hooks/useTheme";
import { budgetsStyles as styles } from "./budgetsStyles";

interface BudgetExceededAlertProps {
  count: number;
}

export function BudgetExceededAlert({ count }: BudgetExceededAlertProps) {
  const { theme } = useTheme();

  if (count === 0) return null;

  return (
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
        <ThemedText type="bodySm" color={theme.destructive}>
          {count === 1
            ? "You have 1 budget that has been exceeded"
            : `You have ${count} budgets that have been exceeded`}
        </ThemedText>
      </View>
    </View>
  );
}

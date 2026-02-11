import React from "react";
import { View } from "react-native";
import { ThemedText } from "../ThemedText";
import { BudgetProgressBar } from "../BudgetProgressBar";
import { useTheme } from "../../hooks/useTheme";
import { budgetsStyles as styles } from "./budgetsStyles";
import type { LimitProgress } from "../../types";

interface BudgetProgressSectionProps {
  limits: LimitProgress[];
}

export function BudgetProgressSection({ limits }: BudgetProgressSectionProps) {
  const { theme } = useTheme();

  if (limits.length === 0) return null;

  return (
    <View style={styles.progressSection}>
      <ThemedText type="h4" style={styles.sectionHeading}>
        {"Budget Progress"}
      </ThemedText>
      <View style={styles.progressList}>
        {limits.map((item) => {
          const limit = parseFloat(item.limitAmount);
          return (
            <View key={item.budgetId} style={styles.progressItem}>
              <View style={styles.progressLabel}>
                <View
                  style={[
                    styles.colorDot,
                    {
                      backgroundColor:
                        item.categoryColor || theme.textSecondary,
                    },
                  ]}
                />
                <ThemedText
                  type="bodySm"
                  numberOfLines={1}
                  style={styles.progressName}
                >
                  {item.categoryName}
                </ThemedText>
              </View>
              <BudgetProgressBar
                spent={item.spent}
                limit={limit}
                percentage={item.percentage}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

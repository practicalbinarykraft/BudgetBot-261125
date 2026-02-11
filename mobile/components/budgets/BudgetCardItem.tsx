import React from "react";
import { View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Card, CardHeader, CardContent } from "../Card";
import { useTheme } from "../../hooks/useTheme";
import {
  getStatusColor,
  getStatusLabel,
  getPeriodLabel,
} from "../../hooks/useBudgetsScreen";
import { budgetsStyles as styles } from "./budgetsStyles";
import type { LimitProgress } from "../../types";

interface BudgetCardItemProps {
  item: LimitProgress;
  onEdit: (item: LimitProgress) => void;
  onDelete: (item: LimitProgress) => void;
}

export function BudgetCardItem({
  item,
  onEdit,
  onDelete,
}: BudgetCardItemProps) {
  const { theme } = useTheme();
  const limit = parseFloat(item.limitAmount);
  const remaining = Math.max(0, limit - item.spent);
  const statusColor = getStatusColor(item.percentage, theme);
  const statusLabel = getStatusLabel(item.percentage);

  return (
    <Card>
      <CardHeader style={styles.budgetCardHeader}>
        <View style={styles.budgetNameRow}>
          <View
            style={[
              styles.colorDot,
              {
                backgroundColor: item.categoryColor || theme.textSecondary,
              },
            ]}
          />
          <ThemedText
            type="bodySm"
            style={styles.budgetName}
            numberOfLines={1}
          >
            {item.categoryName}
          </ThemedText>
        </View>
        <View style={styles.budgetActions}>
          <Pressable
            onPress={() => onEdit(item)}
            hitSlop={8}
            style={styles.actionBtn}
          >
            <Feather name="edit-2" size={16} color={theme.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => onDelete(item)}
            hitSlop={8}
            style={styles.actionBtn}
          >
            <Feather name="trash-2" size={16} color={theme.textSecondary} />
          </Pressable>
        </View>
      </CardHeader>

      <CardContent style={styles.budgetCardContent}>
        <View style={styles.infoRow}>
          <ThemedText type="small" color={theme.textSecondary}>
            {getPeriodLabel(item.period)}
          </ThemedText>
          <ThemedText type="bodySm" mono style={styles.monoBold}>
            {"$" + limit.toFixed(2)}
          </ThemedText>
        </View>

        <View style={styles.infoRow}>
          <ThemedText type="small" color={theme.textSecondary}>
            {"Spent"}
          </ThemedText>
          <ThemedText
            type="bodySm"
            mono
            color={item.percentage > 100 ? theme.destructive : undefined}
            style={styles.monoBold}
          >
            {"$" + item.spent.toFixed(2)}
          </ThemedText>
        </View>

        <View style={[styles.trackBar, { backgroundColor: theme.border }]}>
          <View
            style={[
              styles.fillBar,
              {
                backgroundColor: statusColor,
                width: `${Math.min(item.percentage, 100)}%` as any,
              },
            ]}
          />
        </View>

        <View style={styles.infoRow}>
          <ThemedText
            type="small"
            color={
              item.percentage > 100 ? theme.destructive : theme.textSecondary
            }
            style={item.percentage > 100 ? styles.boldText : undefined}
          >
            {Math.round(item.percentage) + "% used"}
          </ThemedText>
          <ThemedText type="small" color={theme.textSecondary}>
            {"$" + remaining.toFixed(2) + " remaining"}
          </ThemedText>
        </View>

        {statusLabel ? (
          <View style={styles.statusRow}>
            <Feather name="alert-circle" size={12} color={statusColor} />
            <ThemedText type="small" color={statusColor}>
              {statusLabel}
            </ThemedText>
          </View>
        ) : null}
      </CardContent>
    </Card>
  );
}

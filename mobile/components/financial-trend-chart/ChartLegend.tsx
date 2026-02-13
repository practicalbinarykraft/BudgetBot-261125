import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { CHART_COLORS } from "../../hooks/useFinancialTrendChart";

interface ChartLegendProps {
  hiddenLines?: Set<string>;
  onToggle?: (key: string) => void;
}

const LEGEND_ITEMS: { key: string; color: string; labelKey: string }[] = [
  { key: "income", color: CHART_COLORS.income, labelKey: "dashboard.income" },
  { key: "expense", color: CHART_COLORS.expense, labelKey: "dashboard.expenses" },
  { key: "capital", color: CHART_COLORS.capital, labelKey: "dashboard.capital" },
];

export function ChartLegend({ hiddenLines, onToggle }: ChartLegendProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.legend}>
      {LEGEND_ITEMS.map((item) => {
        const isHidden = hiddenLines?.has(item.key) ?? false;
        const Wrapper = onToggle ? Pressable : View;
        const wrapperProps = onToggle
          ? { onPress: () => onToggle(item.key), hitSlop: 8 }
          : {};

        return (
          <Wrapper key={item.key} {...(wrapperProps as any)} style={[styles.legendItem, isHidden && styles.legendItemHidden]}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: isHidden ? theme.textTertiary : item.color },
              ]}
            />
            <ThemedText
              type="small"
              color={isHidden ? theme.textTertiary : theme.textSecondary}
              style={isHidden ? styles.strikethrough : undefined}
            >
              {t(item.labelKey)}
            </ThemedText>
          </Wrapper>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendItemHidden: {
    opacity: 0.5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  strikethrough: {
    textDecorationLine: "line-through",
  },
});

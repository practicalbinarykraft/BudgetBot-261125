import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import type { FinancialType } from "../../hooks/useEditTransactionScreen";

interface FinancialTypeSelectorProps {
  financialType: FinancialType;
  onFinancialTypeChange: (type: FinancialType) => void;
}

const FINANCIAL_TYPE_KEYS: { key: FinancialType; labelKey: string }[] = [
  { key: "essential", labelKey: "transactions.ft_essential" },
  { key: "discretionary", labelKey: "transactions.ft_discretionary" },
  { key: "asset", labelKey: "transactions.ft_asset" },
  { key: "liability", labelKey: "transactions.ft_liability" },
];

export function FinancialTypeSelector({
  financialType,
  onFinancialTypeChange,
}: FinancialTypeSelectorProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.field}>
      <ThemedText
        type="small"
        color={theme.textSecondary}
        style={styles.label}
      >
        {t("transactions.financial_type")}
      </ThemedText>
      <View style={styles.financialTypeRow}>
        {FINANCIAL_TYPE_KEYS.map((ft) => {
          const isActive = financialType === ft.key;
          return (
            <Pressable
              key={ft.key}
              onPress={() => onFinancialTypeChange(ft.key)}
              style={[
                styles.financialTypeBtn,
                {
                  backgroundColor: isActive
                    ? theme.primary
                    : theme.secondary,
                  borderColor: isActive ? theme.primary : theme.border,
                },
              ]}
            >
              <ThemedText
                type="small"
                color={isActive ? "#ffffff" : theme.text}
              >
                {t(ft.labelKey)}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
  },
  financialTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  financialTypeBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
  },
});

import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { financialTypes, type FinancialType } from "../../hooks/useEditTransactionScreen";

interface FinancialTypeSelectorProps {
  financialType: FinancialType;
  onFinancialTypeChange: (type: FinancialType) => void;
}

export function FinancialTypeSelector({
  financialType,
  onFinancialTypeChange,
}: FinancialTypeSelectorProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.field}>
      <ThemedText
        type="small"
        color={theme.textSecondary}
        style={styles.label}
      >
        {"Financial Type"}
      </ThemedText>
      <View style={styles.financialTypeRow}>
        {financialTypes.map((ft) => {
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
                {ft.label}
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

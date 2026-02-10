import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

interface TypeToggleProps {
  type: "income" | "expense";
  onTypeChange: (type: "income" | "expense") => void;
}

export function TypeToggle({ type, onTypeChange }: TypeToggleProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.field}>
      <ThemedText
        type="small"
        color={theme.textSecondary}
        style={styles.label}
      >
        {"Type"}
      </ThemedText>
      <View style={styles.toggleRow}>
        <Pressable
          onPress={() => onTypeChange("expense")}
          style={[
            styles.toggleBtn,
            {
              backgroundColor:
                type === "expense" ? theme.expense : theme.secondary,
              borderColor:
                type === "expense" ? theme.expense : theme.border,
            },
          ]}
        >
          <ThemedText
            type="bodySm"
            color={type === "expense" ? "#ffffff" : theme.textSecondary}
          >
            {"Expense"}
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => onTypeChange("income")}
          style={[
            styles.toggleBtn,
            {
              backgroundColor:
                type === "income" ? theme.income : theme.secondary,
              borderColor:
                type === "income" ? theme.income : theme.border,
            },
          ]}
        >
          <ThemedText
            type="bodySm"
            color={type === "income" ? "#ffffff" : theme.textSecondary}
          >
            {"Income"}
          </ThemedText>
        </Pressable>
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
  toggleRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  toggleBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});

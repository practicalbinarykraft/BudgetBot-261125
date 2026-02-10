import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import { Input } from "../Input";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { currencies } from "../../hooks/useEditTransactionScreen";

interface CurrencySelectorProps {
  amount: string;
  onAmountChange: (text: string) => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
}

export function CurrencySelector({
  amount,
  onAmountChange,
  currency,
  onCurrencyChange,
}: CurrencySelectorProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.rowHalf}>
        <Input
          label="Amount"
          value={amount}
          onChangeText={onAmountChange}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
      </View>
      <View style={styles.rowHalf}>
        <ThemedText
          type="small"
          color={theme.textSecondary}
          style={styles.label}
        >
          {"Currency"}
        </ThemedText>
        <View style={styles.currencyRow}>
          {currencies.map((c) => {
            const isActive = currency === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => onCurrencyChange(c.key)}
                style={[
                  styles.currencyBtn,
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
                  {c.key}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  rowHalf: {
    flex: 1,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
  },
  currencyRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  currencyBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});

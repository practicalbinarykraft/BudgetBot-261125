import React from "react";
import { View, Pressable } from "react-native";
import { ThemedText } from "../components/ThemedText";
import { useTheme } from "../hooks/useTheme";
import { styles } from "./AddEditAssetScreen.styles";

const currencyOptions = ["USD", "RUB", "IDR", "EUR", "KRW", "CNY"];

interface CurrencySelectorProps {
  currency: string;
  onSelect: (currency: string) => void;
}

export function CurrencySelector({ currency, onSelect }: CurrencySelectorProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.field}>
      <ThemedText type="bodySm" style={styles.label}>
        {"Currency"}
      </ThemedText>
      <View style={styles.currencyRow}>
        {currencyOptions.map((c) => {
          const isActive = currency === c;
          return (
            <Pressable
              key={c}
              onPress={() => onSelect(c)}
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
                {c}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

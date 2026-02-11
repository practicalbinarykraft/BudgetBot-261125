import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { Card, CardHeader, CardContent } from "./Card";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import type { Wallet } from "../types";

interface WalletCardProps {
  wallet: Wallet;
}

// Web uses: CreditCard / Coins / Bitcoin (lucide-react)
// Feather closest: credit-card / disc / hash
const walletIcons: Record<string, keyof typeof Feather.glyphMap> = {
  card: "credit-card",
  cash: "disc",
  crypto: "hash",
};

const currencySymbols: Record<string, string> = {
  USD: "$",
  RUB: "\u20BD",
  EUR: "\u20AC",
  IDR: "Rp",
  KRW: "\u20A9",
  CNY: "\u00A5",
};

export function WalletCard({ wallet }: WalletCardProps) {
  const { theme } = useTheme();
  const icon = walletIcons[wallet.type] || "credit-card";
  const balance = parseFloat(wallet.balance).toFixed(2);
  const balanceUsd = parseFloat(wallet.balanceUsd || "0").toFixed(2);
  const symbol = currencySymbols[wallet.currency] || wallet.currency;
  const isUsd = wallet.currency === "USD";

  return (
    <Card>
      <CardHeader style={styles.header}>
        <ThemedText type="bodySm" numberOfLines={1} style={{ flex: 1 }}>
          {wallet.name}
        </ThemedText>
        <Feather name={icon} size={16} color={theme.textSecondary} />
      </CardHeader>
      <CardContent>
        <ThemedText type="monoLg" mono>
          {symbol}{balance}
        </ThemedText>
        {!isUsd ? (
          <ThemedText type="small" color={theme.textSecondary} style={styles.usdEquiv}>
            {"\u2248 $"}{balanceUsd}
          </ThemedText>
        ) : null}
        <ThemedText type="small" color={theme.textTertiary} style={styles.meta}>
          {wallet.type} {"\u00B7"} {wallet.currency}
        </ThemedText>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingBottom: 0,
  },
  usdEquiv: {
    marginTop: 4,
  },
  meta: {
    marginTop: Spacing.sm,
    textTransform: "capitalize",
  },
});

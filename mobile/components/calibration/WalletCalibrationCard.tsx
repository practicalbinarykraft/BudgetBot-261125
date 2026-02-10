import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Input } from "../Input";
import { Card, CardContent } from "../Card";
import { Badge } from "../Badge";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { type WalletPreviewItem, currencySymbols } from "../../hooks/useCalibrationScreen";

interface WalletCalibrationCardProps {
  preview: WalletPreviewItem;
  balanceValue: string;
  onBalanceChange: (text: string) => void;
}

export function WalletCalibrationCard({
  preview,
  balanceValue,
  onBalanceChange,
}: WalletCalibrationCardProps) {
  const { theme } = useTheme();
  const symbol = currencySymbols[preview.wallet.currency || "USD"] || preview.wallet.currency || "$";

  return (
    <Card>
      <CardContent style={styles.walletCard}>
        <View style={styles.walletHeaderRow}>
          <View style={styles.walletNameRow}>
            <Feather
              name={
                preview.wallet.type === "crypto"
                  ? "dollar-sign"
                  : preview.wallet.type === "cash"
                    ? "dollar-sign"
                    : "credit-card"
              }
              size={16}
              color={theme.textSecondary}
            />
            <ThemedText type="bodySm" style={styles.walletName}>
              {preview.wallet.name}
            </ThemedText>
            {preview.wallet.currency ? (
              <Badge
                label={preview.wallet.currency}
                variant="outline"
              />
            ) : null}
          </View>

          {!preview.hasChanged ? (
            <Badge label="Matches" variant="outline" />
          ) : preview.status === "critical" ? (
            <Badge
              label={`${preview.percentChange.toFixed(1)}%`}
              variant="destructive"
            />
          ) : preview.status === "warning" ? (
            <Badge
              label={`${preview.percentChange.toFixed(1)}%`}
              variant="outline"
            />
          ) : null}
        </View>

        <View style={styles.balanceRow}>
          <View style={styles.balanceCol}>
            <ThemedText type="small" color={theme.textSecondary}>
              {"Current Balance"}
            </ThemedText>
            <ThemedText type="monoLg" mono style={styles.currentBalance}>
              {symbol}
              {preview.currentBalance.toFixed(2)}
            </ThemedText>
          </View>
          <View style={styles.balanceCol}>
            <Input
              label="Actual Balance"
              value={balanceValue}
              onChangeText={onBalanceChange}
              placeholder={preview.currentBalance.toFixed(2)}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {preview.hasChanged ? (
          <View
            style={[
              styles.diffRow,
              {
                backgroundColor:
                  preview.status === "critical"
                    ? theme.destructive + "15"
                    : preview.status === "warning"
                      ? "#f59e0b15"
                      : theme.muted,
              },
            ]}
          >
            <ThemedText
              type="small"
              color={
                preview.status === "critical"
                  ? theme.destructive
                  : preview.status === "warning"
                    ? "#f59e0b"
                    : theme.textSecondary
              }
              style={styles.diffText}
            >
              {"Difference: "}
              {symbol}
              {Math.abs(preview.difference).toFixed(2)}
              {" ("}
              {preview.difference < 0 ? "-" : "+"}
              {preview.percentChange.toFixed(1)}
              {"%)"}
            </ThemedText>
            {preview.willCreateTransaction ? (
              <Badge
                label="Expense will be created"
                variant="outline"
              />
            ) : null}
          </View>
        ) : null}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  walletCard: {
    gap: Spacing.md,
  },
  walletHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  walletNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  walletName: {
    fontWeight: "600",
  },
  balanceRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  balanceCol: {
    flex: 1,
  },
  currentBalance: {
    marginTop: Spacing.xs,
  },
  diffRow: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  diffText: {
    fontWeight: "500",
  },
});

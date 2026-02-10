import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Input } from "../Input";
import { Button } from "../Button";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

const WALLET_TYPES: Array<{ value: "card" | "cash" | "crypto"; label: string }> = [
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "crypto", label: "Crypto" },
];

interface WalletStepProps {
  walletName: string;
  onWalletNameChange: (text: string) => void;
  walletType: "card" | "cash" | "crypto";
  onWalletTypeChange: (type: "card" | "cash" | "crypto") => void;
  initialBalance: string;
  onInitialBalanceChange: (text: string) => void;
  onCreateWallet: () => void;
  isPending: boolean;
  onSkip: () => void;
}

export function WalletStep({
  walletName, onWalletNameChange,
  walletType, onWalletTypeChange,
  initialBalance, onInitialBalanceChange,
  onCreateWallet, isPending, onSkip,
}: WalletStepProps) {
  const { theme } = useTheme();

  return (
    <>
      <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" }]}>
        <Feather name="credit-card" size={32} color={theme.primary} />
      </View>
      <ThemedText type="h3" style={styles.stepTitle}>
        {"Create Your First Wallet"}
      </ThemedText>
      <ThemedText type="bodySm" color={theme.textSecondary} style={styles.stepDescription}>
        {"Add your first wallet to start tracking your finances."}
      </ThemedText>

      <Input
        label="Wallet Name"
        value={walletName}
        onChangeText={onWalletNameChange}
        placeholder="e.g., Main Card"
        containerStyle={styles.field}
      />

      <View style={styles.typeRow}>
        {WALLET_TYPES.map((wt) => (
          <Pressable
            key={wt.value}
            onPress={() => onWalletTypeChange(wt.value)}
            style={[
              styles.typeChip,
              {
                backgroundColor:
                  walletType === wt.value ? theme.primary : theme.muted,
                borderColor:
                  walletType === wt.value ? theme.primary : theme.border,
              },
            ]}
          >
            <ThemedText
              type="small"
              color={walletType === wt.value ? theme.primaryForeground : theme.text}
            >
              {wt.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <Input
        label="Initial Balance (optional)"
        value={initialBalance}
        onChangeText={onInitialBalanceChange}
        placeholder="0"
        keyboardType="numeric"
        containerStyle={styles.field}
      />

      <Button
        title={isPending ? "Creating..." : "Create Wallet"}
        onPress={onCreateWallet}
        disabled={!walletName.trim() || isPending}
        loading={isPending}
        style={styles.primaryBtn}
      />
      <Pressable onPress={onSkip} style={styles.skipRow}>
        <ThemedText type="bodySm" color={theme.textSecondary}>
          {"Skip for now"}
        </ThemedText>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  stepTitle: { fontWeight: "700", textAlign: "center" },
  stepDescription: { textAlign: "center", lineHeight: 20 },
  field: { width: "100%", marginBottom: 0 },
  typeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    width: "100%",
    marginBottom: Spacing.sm,
  },
  typeChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  primaryBtn: { width: "100%", marginTop: Spacing.sm },
  skipRow: { paddingVertical: Spacing.sm },
});

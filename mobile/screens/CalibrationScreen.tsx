import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useCalibrationScreen } from "../hooks/useCalibrationScreen";
import { WalletCalibrationCard } from "../components/calibration/WalletCalibrationCard";
import { CalibrationSummary } from "../components/calibration/CalibrationSummary";

export default function CalibrationScreen() {
  const { theme } = useTheme();
  const {
    navigation,
    walletsQuery,
    wallets,
    balances,
    setBalances,
    walletPreview,
    summary,
    isCalibrating,
    handleCalibrateAll,
  } = useCalibrationScreen();

  if (walletsQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <View style={styles.headerTitleRow}>
            <Feather name="settings" size={20} color={theme.text} />
            <ThemedText type="h3" style={styles.headerTitle}>
              {"Wallet Calibration"}
            </ThemedText>
          </View>
          <ThemedText type="bodySm" color={theme.textSecondary}>
            {"Update wallet balances to match your real bank/wallet apps"}
          </ThemedText>
        </View>

        {wallets.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText type="body" color={theme.textSecondary}>
              {"No wallets found"}
            </ThemedText>
            <Button
              title="Add Wallet"
              onPress={() => navigation.navigate("AddWallet")}
              icon={
                <Feather
                  name="plus"
                  size={14}
                  color={theme.primaryForeground}
                />
              }
              style={styles.emptyBtn}
            />
          </View>
        ) : (
          <View style={styles.walletList}>
            {walletPreview.map((preview) => (
              <WalletCalibrationCard
                key={preview.wallet.id}
                preview={preview}
                balanceValue={balances[preview.wallet.id] || ""}
                onBalanceChange={(text) =>
                  setBalances((prev) => ({
                    ...prev,
                    [preview.wallet.id]: text,
                  }))
                }
              />
            ))}
          </View>
        )}

        {wallets.length > 0 && summary.changedWallets > 0 ? (
          <CalibrationSummary summary={summary} />
        ) : null}

        {wallets.length > 0 ? (
          <View style={styles.footerRow}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => navigation.goBack()}
              style={styles.footerBtn}
            />
            <Button
              title={
                isCalibrating
                  ? "Calibrating..."
                  : summary.changedWallets > 0
                    ? `Calibrate (${summary.changedWallets})`
                    : "Calibrate"
              }
              onPress={handleCalibrateAll}
              loading={isCalibrating}
              disabled={isCalibrating || summary.changedWallets === 0}
              style={styles.footerBtn}
            />
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing["5xl"],
  },
  headerSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerTitle: {
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
    gap: Spacing.lg,
  },
  emptyBtn: {
    minWidth: 160,
  },
  walletList: {
    gap: Spacing.md,
  },
  footerRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  footerBtn: {
    flex: 1,
  },
});

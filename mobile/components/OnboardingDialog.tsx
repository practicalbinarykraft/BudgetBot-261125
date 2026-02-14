import React, { useEffect } from "react";
import { View, Modal, StyleSheet } from "react-native";
import { Card, CardContent } from "./Card";
import { Spacing } from "../constants/theme";
import { useOnboarding } from "../hooks/useOnboarding";
import { registerOnboardingOpen, unregisterOnboardingOpen } from "../lib/onboarding-ref";
import { WelcomeStep } from "./onboarding/WelcomeStep";
import { WalletStep } from "./onboarding/WalletStep";
import { SuccessStep } from "./onboarding/SuccessStep";

interface OnboardingDialogProps {
  userId: number | undefined;
}

export default function OnboardingDialog({ userId }: OnboardingDialogProps) {
  const h = useOnboarding(userId);

  useEffect(() => {
    registerOnboardingOpen(h.open);
    return () => unregisterOnboardingOpen();
  }, [h.open]);

  return (
    <Modal
      visible={h.visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <Card style={styles.dialog}>
          <CardContent style={styles.dialogContent}>
            {h.step === "welcome" && (
              <WelcomeStep
                onGetStarted={() => h.setStep("wallet")}
                onSkip={h.skip}
              />
            )}

            {h.step === "wallet" && (
              <WalletStep
                walletName={h.walletName}
                onWalletNameChange={h.setWalletName}
                walletType={h.walletType}
                onWalletTypeChange={h.setWalletType}
                initialBalance={h.initialBalance}
                onInitialBalanceChange={h.setInitialBalance}
                onCreateWallet={() => h.walletMutation.mutate()}
                isPending={h.walletMutation.isPending}
                onSkip={h.skip}
              />
            )}

            {h.step === "success" && (
              <SuccessStep onComplete={h.complete} />
            )}
          </CardContent>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["2xl"],
  },
  dialog: { width: "100%", maxWidth: 400 },
  dialogContent: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
    gap: Spacing.md,
  },
});

import React, { useState, useEffect, useCallback } from "react";
import { Modal, View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardContent } from "./Card";
import { Button } from "./Button";
import { ThemedText } from "./ThemedText";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { openTutorial } from "../lib/tutorial-ref";
import {
  registerRewardModal,
  unregisterRewardModal,
  type RewardData,
} from "../lib/reward-modal-ref";

export default function RewardModal() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<RewardData | null>(null);

  const show = useCallback((d: RewardData) => {
    setData(d);
    setVisible(true);
  }, []);

  useEffect(() => {
    registerRewardModal(show);
    return () => unregisterRewardModal();
  }, [show]);

  const handleNextStep = () => {
    setVisible(false);
    setTimeout(() => openTutorial(), 200);
  };

  const handleDismiss = () => setVisible(false);

  if (!data) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.overlay}>
        <Card style={styles.dialog}>
          <CardContent style={styles.content}>
            <View style={[styles.iconCircle, { backgroundColor: "#f59e0b20" }]}>
              <Feather name="award" size={32} color="#f59e0b" />
            </View>
            <ThemedText type="h3" style={styles.title}>
              {t("reward.title")}
            </ThemedText>
            <ThemedText type="monoLg" color="#f59e0b" style={styles.credits}>
              +{data.creditsAwarded}
            </ThemedText>
            <ThemedText type="bodySm" color={theme.textSecondary} style={styles.balanceText}>
              {t("reward.balance_change")
                .replace("{before}", String(data.balanceBefore))
                .replace("{after}", String(data.balanceAfter))}
            </ThemedText>
            <Button
              title={t("reward.next_step")}
              onPress={handleNextStep}
              style={styles.btn}
            />
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
  dialog: { width: "100%", maxWidth: 320 },
  content: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  title: { fontWeight: "700", textAlign: "center" },
  credits: { fontWeight: "700", textAlign: "center" },
  balanceText: { textAlign: "center" },
  btn: { width: "100%", marginTop: Spacing.md },
});

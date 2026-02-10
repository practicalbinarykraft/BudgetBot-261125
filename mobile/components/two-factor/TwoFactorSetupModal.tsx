import React from "react";
import { View, StyleSheet, Modal, Image, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { ThemedText } from "../ThemedText";
import { Button } from "../Button";
import { Input } from "../Input";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import type { TwoFactorSetup } from "../../types";

interface TwoFactorSetupModalProps {
  visible: boolean;
  onClose: () => void;
  setupData: TwoFactorSetup | null;
  code: string;
  onCodeChange: (text: string) => void;
  onEnable: () => void;
  isPending: boolean;
}

export function TwoFactorSetupModal({
  visible, onClose, setupData, code, onCodeChange, onEnable, isPending,
}: TwoFactorSetupModalProps) {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modal, { backgroundColor: theme.background }]}>
        <View style={styles.modalHeader}>
          <ThemedText type="h3">{"Set Up 2FA"}</ThemedText>
          <Pressable onPress={onClose}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>

        <ThemedText type="bodySm" color={theme.textSecondary} style={styles.modalDesc}>
          {"Scan the QR code with your authenticator app"}
        </ThemedText>

        {setupData?.qrCode ? (
          <View style={styles.qrContainer}>
            <Image
              source={{ uri: setupData.qrCode }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>
        ) : null}

        {setupData?.secret ? (
          <View style={styles.secretSection}>
            <ThemedText type="small" color={theme.textSecondary}>
              {"Or enter this code manually:"}
            </ThemedText>
            <Pressable
              onPress={() =>
                Clipboard.setStringAsync(setupData.secret).then(() =>
                  Alert.alert("Copied", "Secret key copied to clipboard")
                )
              }
              style={[
                styles.secretBox,
                { backgroundColor: theme.secondary, borderColor: theme.border },
              ]}
            >
              <ThemedText type="bodySm" mono style={styles.secretText}>
                {setupData.secret}
              </ThemedText>
              <Feather name="copy" size={14} color={theme.textSecondary} />
            </Pressable>
          </View>
        ) : null}

        <Input
          label="Verification Code"
          value={code}
          onChangeText={onCodeChange}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          containerStyle={styles.codeInput}
        />

        <View style={styles.modalFooter}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={onClose}
            style={styles.footerBtn}
          />
          <Button
            title={isPending ? "Verifying..." : "Verify & Enable"}
            onPress={onEnable}
            disabled={code.length !== 6 || isPending}
            loading={isPending}
            style={styles.footerBtn}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, padding: Spacing.lg },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingTop: Spacing.md,
  },
  modalDesc: { marginBottom: Spacing.lg },
  qrContainer: { alignItems: "center", marginBottom: Spacing.lg },
  qrImage: { width: 200, height: 200 },
  secretSection: { gap: Spacing.sm, marginBottom: Spacing.lg },
  secretBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  secretText: { textAlign: "center" },
  codeInput: { marginBottom: Spacing.lg },
  modalFooter: { flexDirection: "row", gap: Spacing.md },
  footerBtn: { flex: 1 },
});

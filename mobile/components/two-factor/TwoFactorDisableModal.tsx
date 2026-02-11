import React from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Button } from "../Button";
import { Input } from "../Input";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";

interface TwoFactorDisableModalProps {
  visible: boolean;
  onClose: () => void;
  code: string;
  onCodeChange: (text: string) => void;
  onDisable: () => void;
  isPending: boolean;
}

export function TwoFactorDisableModal({
  visible, onClose, code, onCodeChange, onDisable, isPending,
}: TwoFactorDisableModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modal, { backgroundColor: theme.background }]}>
        <View style={styles.modalHeader}>
          <ThemedText type="h3">{t("settings.disable_2fa_title")}</ThemedText>
          <Pressable onPress={onClose}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>

        <ThemedText type="bodySm" color={theme.textSecondary} style={styles.modalDesc}>
          {t("settings.disable_2fa_hint")}
        </ThemedText>

        <Input
          label={t("settings.verification_code")}
          value={code}
          onChangeText={onCodeChange}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          containerStyle={styles.codeInput}
        />

        <View style={styles.modalFooter}>
          <Button
            title={t("common.cancel")}
            variant="outline"
            onPress={onClose}
            style={styles.footerBtn}
          />
          <Button
            title={isPending ? t("settings.disabling") : t("settings.disable")}
            variant="destructive"
            onPress={onDisable}
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
  codeInput: { marginBottom: Spacing.lg },
  modalFooter: { flexDirection: "row", gap: Spacing.md },
  footerBtn: { flex: 1 },
});

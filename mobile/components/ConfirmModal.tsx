import React from "react";
import { Modal, View, Pressable, StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { BorderRadius, Spacing } from "../constants/theme";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmModalProps) {
  const { theme } = useTheme();

  if (!visible) return null;

  const confirmBg = destructive ? theme.destructive : theme.primary;
  const confirmText = destructive
    ? theme.destructiveForeground
    : theme.primaryForeground;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <ThemedText type="h4" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText type="bodySm" color={theme.textSecondary} style={styles.message}>
            {message}
          </ThemedText>
          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
              onPress={onCancel}
            >
              <ThemedText type="bodySm" style={styles.btnText}>
                {cancelLabel}
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.btn, { backgroundColor: confirmBg, borderColor: confirmBg }]}
              onPress={onConfirm}
            >
              <ThemedText type="bodySm" color={confirmText} style={styles.btnText}>
                {confirmLabel}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["2xl"],
  },
  card: {
    width: "100%",
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing["2xl"],
  },
  title: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  message: {
    marginBottom: Spacing.xl,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  btn: {
    flex: 1,
    height: 36,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontWeight: "500",
  },
});

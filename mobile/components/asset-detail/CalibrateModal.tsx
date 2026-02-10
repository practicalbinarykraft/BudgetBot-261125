import React from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Button } from "../Button";
import { Input } from "../Input";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

interface CalibrateModalProps {
  visible: boolean;
  onClose: () => void;
  calibrateValue: string;
  onChangeValue: (text: string) => void;
  calibrateNotes: string;
  onChangeNotes: (text: string) => void;
  isPending: boolean;
  onSubmit: () => void;
}

export function CalibrateModal({
  visible,
  onClose,
  calibrateValue,
  onChangeValue,
  calibrateNotes,
  onChangeNotes,
  isPending,
  onSubmit,
}: CalibrateModalProps) {
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
          <ThemedText type="h3">{"Calibrate Value"}</ThemedText>
          <Pressable onPress={onClose}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>
        <Input
          label="New Value (USD)"
          value={calibrateValue}
          onChangeText={onChangeValue}
          placeholder="0.00"
          keyboardType="decimal-pad"
          containerStyle={styles.modalField}
        />
        <Input
          label="Notes (optional)"
          value={calibrateNotes}
          onChangeText={onChangeNotes}
          placeholder="Source or reason for update"
          containerStyle={styles.modalField}
        />
        <View style={styles.modalFooter}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={onClose}
            style={styles.footerBtn}
          />
          <Button
            title={isPending ? "Saving..." : "Update"}
            onPress={onSubmit}
            disabled={isPending}
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
    marginBottom: Spacing.lg,
    paddingTop: Spacing.md,
  },
  modalField: { marginBottom: Spacing.xl },
  modalFooter: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.lg },
  footerBtn: { flex: 1 },
});

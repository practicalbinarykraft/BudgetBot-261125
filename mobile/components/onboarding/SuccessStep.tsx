import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Button } from "../Button";
import { Spacing } from "../../constants/theme";

interface SuccessStepProps {
  onComplete: () => void;
}

export function SuccessStep({ onComplete }: SuccessStepProps) {
  return (
    <>
      <View style={[styles.iconCircle, { backgroundColor: "#22c55e20" }]}>
        <Feather name="check-circle" size={32} color="#22c55e" />
      </View>
      <ThemedText type="h3" style={styles.stepTitle}>
        {"You're All Set!"}
      </ThemedText>
      <ThemedText
        type="bodySm"
        color="#6b7280"
        style={styles.stepDescription}
      >
        {"Your wallet has been created. Start tracking your expenses now!"}
      </ThemedText>
      <Button
        title="Go to Dashboard"
        onPress={onComplete}
        style={styles.primaryBtn}
      />
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
  primaryBtn: { width: "100%", marginTop: Spacing.sm },
});

import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Button } from "../Button";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

interface WelcomeStepProps {
  onGetStarted: () => void;
  onSkip: () => void;
}

export function WelcomeStep({ onGetStarted, onSkip }: WelcomeStepProps) {
  const { theme } = useTheme();

  return (
    <>
      <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" }]}>
        <Feather name="star" size={32} color={theme.primary} />
      </View>
      <ThemedText type="h3" style={styles.stepTitle}>
        {"Welcome to BudgetBot!"}
      </ThemedText>
      <ThemedText
        type="bodySm"
        color={theme.textSecondary}
        style={styles.stepDescription}
      >
        {"Your personal finance assistant is ready to help you track expenses and achieve your goals."}
      </ThemedText>
      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <Feather name="credit-card" size={16} color={theme.primary} />
          <ThemedText type="bodySm">
            {"Track multiple wallets and accounts"}
          </ThemedText>
        </View>
        <View style={styles.featureItem}>
          <Feather name="cpu" size={16} color={theme.primary} />
          <ThemedText type="bodySm">
            {"AI-powered spending insights"}
          </ThemedText>
        </View>
      </View>
      <Button
        title="Get Started"
        onPress={onGetStarted}
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
  featureList: { gap: Spacing.sm, width: "100%", paddingVertical: Spacing.sm },
  featureItem: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  primaryBtn: { width: "100%", marginTop: Spacing.sm },
  skipRow: { paddingVertical: Spacing.sm },
});

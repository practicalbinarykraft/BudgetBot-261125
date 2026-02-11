import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

interface Props {
  currentStep: number;
}

export function StepIndicator({ currentStep }: Props) {
  const { theme } = useTheme();

  return (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((n, i) => (
        <React.Fragment key={n}>
          {i > 0 && (
            <View
              style={[styles.stepLine, { backgroundColor: theme.muted }]}
            />
          )}
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                {
                  backgroundColor:
                    currentStep === n ? theme.primary : theme.muted,
                },
              ]}
            >
              <ThemedText
                type="small"
                color={
                  currentStep === n ? "#ffffff" : theme.textSecondary
                }
                style={styles.stepNumber}
              >
                {String(n)}
              </ThemedText>
            </View>
            <ThemedText
              type="small"
              color={
                currentStep === n ? theme.primary : theme.textSecondary
              }
              style={currentStep === n ? styles.stepLabelActive : undefined}
            >
              {n === 1 ? "Request" : n === 2 ? "Verify" : "Reset"}
            </ThemedText>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  stepItem: {
    alignItems: "center",
    gap: 4,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumber: {
    fontWeight: "600",
  },
  stepLine: {
    width: 32,
    height: 1,
    marginBottom: 18,
  },
  stepLabelActive: {
    fontWeight: "600",
  },
});

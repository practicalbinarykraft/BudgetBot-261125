import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Button } from "../Button";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

interface AllSortedViewProps {
  onGoBack: () => void;
}

export function AllSortedView({ onGoBack }: AllSortedViewProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.inner}>
        <Feather name="award" size={64} color="#22c55e" />
        <ThemedText type="h3" style={styles.bold}>
          {"All Sorted!"}
        </ThemedText>
        <ThemedText type="bodySm" color={theme.textSecondary}>
          {"No unsorted transactions remaining. Great job!"}
        </ThemedText>
        <Button title="Back to Transactions" onPress={onGoBack} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.lg },
  bold: { fontWeight: "600" },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
});

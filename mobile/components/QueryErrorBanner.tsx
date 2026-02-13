import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { Button } from "./Button";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius } from "../constants/theme";

interface Props {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}

export function QueryErrorBanner({ message, onRetry, retryLabel = "Retry" }: Props) {
  const { theme } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.destructive + "10", borderColor: theme.destructive + "30" }]}
      testID="query-error-banner"
    >
      <Feather name="alert-circle" size={20} color={theme.destructive} />
      <ThemedText type="bodySm" style={styles.text} color={theme.destructive}>
        {message}
      </ThemedText>
      <Button
        title={retryLabel}
        size="sm"
        variant="outline"
        onPress={onRetry}
        testID="query-error-retry"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  text: {
    flex: 1,
  },
});

import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  description?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  error,
  description,
  containerStyle,
  style,
  ...rest
}: InputProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <ThemedText type="bodySm" style={styles.label}>
          {label}
        </ThemedText>
      ) : null}
      <TextInput
        placeholderTextColor={theme.textTertiary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          {
            backgroundColor: theme.background,
            color: theme.text,
            borderColor: error
              ? theme.destructive
              : focused
                ? theme.primary
                : theme.input,
          },
          style,
        ]}
        {...rest}
      />
      {description && !error ? (
        <ThemedText type="small" color={theme.textSecondary} style={styles.message}>
          {description}
        </ThemedText>
      ) : null}
      {error ? (
        <ThemedText type="small" color={theme.destructive} style={[styles.message, { fontWeight: "500" }]}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  label: {
    fontWeight: "500",
  },
  input: {
    height: 36,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  message: {
    marginTop: -4,
  },
});

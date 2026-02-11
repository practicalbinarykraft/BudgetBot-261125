import React from "react";
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  View,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";

type ButtonVariant = "default" | "secondary" | "destructive" | "outline" | "ghost";
type ButtonSize = "sm" | "default" | "lg" | "icon";

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: { height: 32, paddingHorizontal: 12 },
  default: { height: 36, paddingHorizontal: 16 },
  lg: { height: 40, paddingHorizontal: 32 },
  icon: { height: 36, width: 36, paddingHorizontal: 0 },
};

export function Button({
  title,
  onPress,
  variant = "default",
  size = "default",
  loading = false,
  disabled = false,
  icon,
  style,
  children,
}: ButtonProps) {
  const { theme } = useTheme();

  const getColors = () => {
    switch (variant) {
      case "default":
        return { bg: theme.primary, text: theme.primaryForeground, border: theme.primary };
      case "secondary":
        return { bg: theme.secondary, text: theme.text, border: theme.cardBorder };
      case "destructive":
        return { bg: theme.destructive, text: theme.destructiveForeground, border: theme.destructive };
      case "outline":
        return { bg: "transparent", text: theme.text, border: theme.border };
      case "ghost":
        return { bg: "transparent", text: theme.text, border: "transparent" };
    }
  };

  const colors = getColors();
  const sizeStyle = sizeStyles[size];
  const textType = size === "sm" ? "small" as const : "bodySm" as const;

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        sizeStyle,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          opacity: disabled || loading ? 0.5 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} size="small" />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={title ? styles.iconWithText : undefined}>{icon}</View> : null}
          {title ? (
            <ThemedText type={textType} color={colors.text} style={styles.text}>
              {title}
            </ThemedText>
          ) : null}
          {children}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWithText: {
    marginRight: 8,
  },
  text: {
    fontWeight: "500",
  },
});

import React from "react";
import {
  View,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { BorderRadius, Spacing } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { ThemedText } from "./ThemedText";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, style }: CardProps) {
  return <View style={[styles.header, style]}>{children}</View>;
}

interface CardTitleProps {
  children: React.ReactNode;
  style?: any;
}

export function CardTitle({ children, style }: CardTitleProps) {
  return (
    <ThemedText type="h2" style={[{ fontWeight: "600" }, style]}>
      {children}
    </ThemedText>
  );
}

export function CardDescription({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <ThemedText type="bodySm" color={theme.textSecondary}>
      {children}
    </ThemedText>
  );
}

export function CardContent({ children, style }: CardProps) {
  return <View style={[styles.content, style]}>{children}</View>;
}

export function CardFooter({ children, style }: CardProps) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  header: {
    padding: Spacing.lg,
    gap: 6,
  },
  content: {
    padding: Spacing.lg,
  },
  footer: {
    padding: Spacing.lg,
    flexDirection: "row",
  },
});

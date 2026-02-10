import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { ThemedText } from "./ThemedText";
import { BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  onPress?: () => void;
  icon?: React.ReactNode;
}

export function Badge({ label, variant = "default", onPress, icon }: BadgeProps) {
  const { theme } = useTheme();

  const getColors = () => {
    switch (variant) {
      case "default":
        return { bg: theme.primary, text: theme.primaryForeground, border: "transparent" };
      case "secondary":
        return { bg: theme.secondary, text: theme.text, border: "transparent" };
      case "destructive":
        return { bg: theme.destructive, text: theme.destructiveForeground, border: "transparent" };
      case "outline":
        return { bg: "transparent", text: theme.text, border: theme.border };
    }
  };

  const colors = getColors();
  const content = (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <ThemedText type="small" color={colors.text} style={styles.text}>
        {label}
      </ThemedText>
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: "600",
  },
});

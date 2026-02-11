import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

interface FilterListItemProps {
  name: string;
  color?: string;
  isSelected: boolean;
  accentColor?: string;
  onPress: () => void;
}

export function FilterListItem({ name, color, isSelected, accentColor, onPress }: FilterListItemProps) {
  const { theme } = useTheme();
  const accent = accentColor || theme.primary;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.item,
        {
          backgroundColor: isSelected ? accent + "15" : "transparent",
          borderColor: isSelected ? accent : theme.border,
        },
      ]}
    >
      <View style={styles.left}>
        {color ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
        <ThemedText type="bodySm">{name}</ThemedText>
      </View>
      {isSelected ? <Feather name="check" size={16} color={accent} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

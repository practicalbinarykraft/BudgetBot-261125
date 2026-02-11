import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { Spacing, BorderRadius } from "../constants/theme";
import type { PersonalTag } from "../types";

// Web icon names → Feather equivalents
const ICON_MAP: Record<string, keyof typeof Feather.glyphMap> = {
  User: "user",
  Heart: "heart",
  Home: "home",
  Users: "users",
  Baby: "smile",
  UserPlus: "user-plus",
  Briefcase: "briefcase",
  Gift: "gift",
  Dog: "gitlab",
  Cat: "star",
};

interface TagBadgeProps {
  tag: Pick<PersonalTag, "icon" | "name" | "color">;
}

export function TagBadge({ tag }: TagBadgeProps) {
  const iconName = ICON_MAP[tag.icon] || "tag";
  const color = tag.color || "#3b82f6";

  return (
    <View style={[styles.badge, { backgroundColor: color + "20" }]}>
      <Feather name={iconName} size={12} color={color} />
      <ThemedText type="small" color={color} numberOfLines={1} style={styles.name}>
        {tag.name}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  name: {
    fontWeight: "500",
    maxWidth: 120,
  },
});

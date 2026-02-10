import React from "react";
import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import type { PersonalTag } from "../../types";

interface TagChipsProps {
  tags: PersonalTag[];
  personalTagId: number | null;
  onSelectTag: (id: number | null) => void;
}

export function TagChips({ tags, personalTagId, onSelectTag }: TagChipsProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.field}>
      <ThemedText
        type="small"
        color={theme.textSecondary}
        style={styles.label}
      >
        {"Tag (optional)"}
      </ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        <Pressable
          onPress={() => onSelectTag(null)}
          style={[
            styles.chip,
            {
              backgroundColor: personalTagId === null
                ? theme.primary + "30"
                : theme.secondary,
              borderColor: personalTagId === null
                ? theme.primary
                : theme.border,
            },
          ]}
        >
          <ThemedText type="small">{"No tag"}</ThemedText>
        </Pressable>
        {tags.map((tag) => {
          const isSelected = personalTagId === tag.id;
          return (
            <Pressable
              key={tag.id}
              onPress={() => onSelectTag(tag.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? (tag.color || theme.primary) + "30"
                    : theme.secondary,
                  borderColor: isSelected
                    ? tag.color || theme.primary
                    : theme.border,
                },
              ]}
            >
              <ThemedText type="small">
                {tag.name}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
  },
  chipsRow: {
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
});

import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";

interface SpeechBubbleProps {
  text: string;
  visible: boolean;
}

/**
 * Comic-style speech bubble with a small triangle pointer at the bottom.
 * Shows above the mic button during recording.
 */
export function SpeechBubble({ text, visible }: SpeechBubbleProps) {
  const { theme } = useTheme();
  if (!visible) return null;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.bubble, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <ThemedText type="bodySm" color={theme.text}>{text}</ThemedText>
      </View>
      {/* Triangle pointer */}
      <View style={styles.arrowWrap}>
        <View style={[styles.arrowOuter, { borderTopColor: theme.border }]} />
        <View style={[styles.arrowInner, { borderTopColor: theme.card }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", marginBottom: Spacing.xs },
  bubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    maxWidth: 260,
  },
  arrowWrap: { alignItems: "center" },
  arrowOuter: {
    width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 8,
    borderLeftColor: "transparent", borderRightColor: "transparent",
  },
  arrowInner: {
    width: 0, height: 0,
    borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 7,
    borderLeftColor: "transparent", borderRightColor: "transparent",
    marginTop: -9,
  },
});

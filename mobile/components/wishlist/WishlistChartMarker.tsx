import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { ThemedText } from "../ThemedText";
import { useTheme } from "../../hooks/useTheme";
import type { WishlistChartMarker as MarkerType } from "../../hooks/useWishlistChart";

interface Props {
  marker: MarkerType;
  onPress: (marker: MarkerType) => void;
}

export function WishlistChartMarkerDot({ marker, onPress }: Props) {
  const { theme } = useTheme();
  const count = marker.items.length;

  return (
    <Pressable onPress={() => onPress(marker)} hitSlop={8}>
      <View style={[styles.dot, { backgroundColor: theme.primary, borderColor: "#ffffff" }]}>
        {count > 1 ? (
          <View style={[styles.badge, { backgroundColor: theme.expense }]}>
            <ThemedText type="small" color="#ffffff" style={styles.badgeText}>
              {`+${count}`}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    marginTop: -7,
  },
  badge: {
    position: "absolute",
    top: -10,
    right: -10,
    minWidth: 18,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: "700",
    lineHeight: 12,
  },
});

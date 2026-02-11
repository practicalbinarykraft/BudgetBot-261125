import React from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import type { PanResponderInstance } from "react-native";
import { ThemedText } from "../ThemedText";
import { Card, CardContent } from "../Card";
import { Badge } from "../Badge";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { getDateLocale } from "../../lib/date-locale";
import type { Transaction } from "../../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 120;

interface SwipeCardProps {
  transaction: Transaction;
  catLabel: string | null;
  pan: Animated.ValueXY;
  panResponder: PanResponderInstance;
}

export function SwipeCard({ transaction, catLabel, pan, panResponder }: SwipeCardProps) {
  const { theme } = useTheme();
  const { language } = useTranslation();

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-15deg", "0deg", "15deg"],
  });

  const cardStyle = {
    transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }],
  };

  const leftOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const rightOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const upOpacity = pan.y.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const downOpacity = pan.y.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[styles.card, cardStyle]}
      {...panResponder.panHandlers}
    >
      <Card style={styles.swipeCard}>
        <CardContent style={styles.swipeCardContent}>
          <Animated.View
            style={[styles.dirOverlay, styles.dirLeft, { opacity: leftOpacity }]}
          >
            <ThemedText type="h4" color="#22c55e" style={styles.bold}>
              {"Essential"}
            </ThemedText>
          </Animated.View>
          <Animated.View
            style={[styles.dirOverlay, styles.dirRight, { opacity: rightOpacity }]}
          >
            <ThemedText type="h4" color="#f59e0b" style={styles.bold}>
              {"Discretionary"}
            </ThemedText>
          </Animated.View>
          <Animated.View
            style={[styles.dirOverlay, styles.dirUp, { opacity: upOpacity }]}
          >
            <ThemedText type="h4" color={theme.primary} style={styles.bold}>
              {"Asset"}
            </ThemedText>
          </Animated.View>
          <Animated.View
            style={[styles.dirOverlay, styles.dirDown, { opacity: downOpacity }]}
          >
            <ThemedText type="h4" color="#dc2626" style={styles.bold}>
              {"Liability"}
            </ThemedText>
          </Animated.View>

          <ThemedText type="h4" style={styles.txDescription} numberOfLines={2}>
            {transaction.description || "No description"}
          </ThemedText>
          <ThemedText
            type="monoLg"
            mono
            color={transaction.type === "income" ? "#22c55e" : "#dc2626"}
          >
            {(transaction.type === "income" ? "+" : "-") +
              "$" +
              parseFloat(transaction.amountUsd).toFixed(2)}
          </ThemedText>
          <View style={styles.txMeta}>
            <Badge
              label={transaction.type}
              variant={transaction.type === "income" ? "default" : "destructive"}
            />
            {catLabel ? (
              <Badge label={catLabel} variant="secondary" />
            ) : null}
          </View>
          <ThemedText type="small" color={theme.textTertiary}>
            {new Date(transaction.date).toLocaleDateString(getDateLocale(language), {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </ThemedText>
        </CardContent>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: "600" },
  card: {
    width: SCREEN_WIDTH - Spacing.lg * 4,
  },
  swipeCard: {
    minHeight: 250,
  },
  swipeCardContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingVertical: Spacing["3xl"],
    position: "relative",
  },
  dirOverlay: {
    position: "absolute",
    zIndex: 10,
  },
  dirLeft: { left: Spacing.md, top: Spacing.md },
  dirRight: { right: Spacing.md, top: Spacing.md },
  dirUp: { top: Spacing.md, alignSelf: "center" },
  dirDown: { bottom: Spacing.md, alignSelf: "center" },
  txDescription: { textAlign: "center", fontWeight: "600" },
  txMeta: { flexDirection: "row", gap: Spacing.sm },
});

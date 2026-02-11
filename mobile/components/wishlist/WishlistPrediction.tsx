import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Badge } from "../Badge";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { getDateLocale } from "../../lib/date-locale";
import type { GoalPrediction } from "../../types";

interface WishlistPredictionProps {
  prediction: GoalPrediction;
  itemAmount: string;
}

export function WishlistPrediction({ prediction, itemAmount }: WishlistPredictionProps) {
  const { theme } = useTheme();
  const { language, t } = useTranslation();

  return (
    <View
      style={[
        styles.predictionBox,
        {
          backgroundColor: prediction.canAfford
            ? "#16a34a" + "15"
            : prediction.monthsToAfford != null
              ? theme.primary + "15"
              : theme.destructive + "15",
          borderColor: prediction.canAfford
            ? "#16a34a" + "30"
            : prediction.monthsToAfford != null
              ? theme.primary + "30"
              : theme.destructive + "30",
        },
      ]}
    >
      {prediction.canAfford ? (
        <>
          <View style={styles.predRow}>
            <Feather name="trending-up" size={14} color="#16a34a" />
            <Badge label={t("wishlist.prediction.can_afford_now")} variant="outline" />
          </View>
          <ThemedText type="small" color={theme.textSecondary}>
            {t("wishlist.prediction.free_capital") + ": $" + prediction.freeCapital.toFixed(2)}
          </ThemedText>
        </>
      ) : prediction.monthsToAfford != null && prediction.affordableDate ? (
        <>
          <View style={styles.predRow}>
            <Feather name="calendar" size={14} color={theme.primary} />
            <Badge label={t("wishlist.prediction.affordable_soon")} variant="outline" />
          </View>
          <ThemedText type="small" color={theme.textSecondary}>
            {"~" + prediction.monthsToAfford + " " + t(prediction.monthsToAfford === 1 ? "wishlist.prediction.month" : "wishlist.prediction.months") + " \u2014 " + t("wishlist.prediction.by") + " " +
              new Date(prediction.affordableDate).toLocaleDateString(getDateLocale(language), {
                month: "short", day: "numeric", year: "numeric",
              })}
          </ThemedText>
        </>
      ) : (
        <>
          <View style={styles.predRow}>
            <Feather name="trending-down" size={14} color={theme.destructive} />
            <Badge label={t("wishlist.prediction.not_affordable")} variant="destructive" />
          </View>
          <ThemedText type="small" color={theme.textSecondary}>
            {t("wishlist.prediction.shortage") + ": $" + (parseFloat(itemAmount) - prediction.freeCapital).toFixed(2)}
          </ThemedText>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  predictionBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  predRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
});

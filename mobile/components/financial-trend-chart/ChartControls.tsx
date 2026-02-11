import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { ThemedText } from "../ThemedText";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import type { HistoryDays } from "../../hooks/useFinancialTrendChart";
import { HISTORY_OPTIONS } from "../../hooks/useFinancialTrendChart";

interface ChartControlsProps {
  historyDays: HistoryDays;
  setHistoryDays: (days: HistoryDays) => void;
  showForecast: boolean;
  setShowForecast: (fn: (v: boolean) => boolean) => void;
}

export function ChartControls({
  historyDays,
  setHistoryDays,
  showForecast,
  setShowForecast,
}: ChartControlsProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.controlsRow}>
      <View style={styles.historyToggles}>
        {HISTORY_OPTIONS.map((opt) => {
          const isActive = historyDays === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setHistoryDays(opt.value)}
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: isActive ? theme.primary : theme.secondary,
                  borderColor: isActive ? theme.primary : theme.border,
                },
              ]}
            >
              <ThemedText
                type="small"
                color={isActive ? "#ffffff" : theme.text}
              >
                {opt.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        onPress={() => setShowForecast((v) => !v)}
        style={[
          styles.toggleBtn,
          {
            backgroundColor: showForecast ? theme.primary : theme.secondary,
            borderColor: showForecast ? theme.primary : theme.border,
          },
        ]}
      >
        <ThemedText
          type="small"
          color={showForecast ? "#ffffff" : theme.text}
        >
          {t("dashboard.forecast")}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyToggles: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  toggleBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
});

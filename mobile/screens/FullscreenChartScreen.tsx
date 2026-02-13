import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LineChart } from "react-native-gifted-charts";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { ChartControls } from "../components/financial-trend-chart/ChartControls";
import { ChartLegend } from "../components/financial-trend-chart/ChartLegend";
import { ForecastSummaryBox } from "../components/financial-trend-chart/ForecastSummary";
import { WishlistChartMarkerDot } from "../components/wishlist/WishlistChartMarker";
import { WishlistMarkerSheet } from "../components/wishlist/WishlistMarkerSheet";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import {
  useFinancialTrendChart,
  CHART_COLORS,
  formatCompact,
  type HistoryDays,
} from "../hooks/useFinancialTrendChart";
import { useWishlistChart, type WishlistChartMarker } from "../hooks/useWishlistChart";
import { useFullscreenChart } from "../hooks/useFullscreenChart";

const HINT_ROTATE_KEY = "budgetbot_hint_rotate_shown";
const HINT_SWIPE_KEY = "budgetbot_hint_swipe_shown";

export default function FullscreenChartScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { historyDays?: HistoryDays; showForecast?: boolean } | undefined;
  const [selectedMarker, setSelectedMarker] = useState<WishlistChartMarker | null>(null);

  // Hidden lines state for clickable legend
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());
  const toggleLine = useCallback((key: string) => {
    setHiddenLines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  useFullscreenChart();

  const {
    historyDays,
    setHistoryDays,
    showForecast,
    setShowForecast,
    sampledTrendData,
    incomeData,
    expenseData,
    capitalData,
    forecastSummary,
    isLoading,
    hasData,
  } = useFinancialTrendChart({
    maxPointsOverride: 150,
    initialHistoryDays: params?.historyDays,
    initialShowForecast: params?.showForecast,
  });

  const { markers } = useWishlistChart(sampledTrendData);

  // Dynamic dimensions (updates on rotation)
  const { width, height } = useWindowDimensions();
  const chartWidth = width - Spacing.lg * 2 - 60;
  const chartHeight = Math.max(200, height - 260);

  // --- Wishlist marker overlay ---
  const markerMap = useMemo(() => {
    const map = new Map<number, WishlistChartMarker>();
    for (const m of markers) map.set(m.index, m);
    return map;
  }, [markers]);

  const capitalDataWithMarkers = useMemo(() => {
    if (markerMap.size === 0) return capitalData;
    return capitalData.map((point, i) => {
      const marker = markerMap.get(i);
      if (!marker) return point;
      return {
        ...point,
        showDataPoint: true,
        dataPointRadius: 0,
        customDataPoint: () => (
          <WishlistChartMarkerDot marker={marker} onPress={setSelectedMarker} />
        ),
      };
    });
  }, [capitalData, markerMap]);

  const getMarkerLabel = (index: number): string | null => {
    const marker = markerMap.get(index);
    if (!marker) return null;
    if (marker.items.length === 1) {
      return t("chart.goal_available").replace("{name}", marker.items[0].name);
    }
    return t("chart.goals_on_date").replace("{count}", String(marker.items.length));
  };

  // --- UX Hints ---
  const rotateOpacity = useRef(new Animated.Value(0)).current;
  const swipeOpacity = useRef(new Animated.Value(0)).current;
  const [showRotateHint, setShowRotateHint] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [rotateShown, swipeShown] = await Promise.all([
        AsyncStorage.getItem(HINT_ROTATE_KEY),
        AsyncStorage.getItem(HINT_SWIPE_KEY),
      ]);

      if (cancelled) return;

      // Rotate hint
      if (!rotateShown) {
        setShowRotateHint(true);
        Animated.timing(rotateOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        setTimeout(() => {
          if (cancelled) return;
          Animated.timing(rotateOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
            if (!cancelled) setShowRotateHint(false);
          });
          AsyncStorage.setItem(HINT_ROTATE_KEY, "true");
        }, 4000);
      }

      // Swipe hint (delayed)
      if (!swipeShown) {
        setTimeout(() => {
          if (cancelled) return;
          setShowSwipeHint(true);
          Animated.timing(swipeOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
          setTimeout(() => {
            if (cancelled) return;
            Animated.timing(swipeOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
              if (!cancelled) setShowSwipeHint(false);
            });
            AsyncStorage.setItem(HINT_SWIPE_KEY, "true");
          }, 5000);
        }, 2000);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const dismissRotateHint = useCallback(() => {
    Animated.timing(rotateOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setShowRotateHint(false));
    AsyncStorage.setItem(HINT_ROTATE_KEY, "true");
  }, []);

  const dismissSwipeHint = useCallback(() => {
    Animated.timing(swipeOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setShowSwipeHint(false));
    AsyncStorage.setItem(HINT_SWIPE_KEY, "true");
  }, []);

  // --- Y-axis scale: must account for ALL visible datasets ---
  // react-native-gifted-charts auto-scales to data1 only; without this,
  // capital ($3.4M) goes off-screen when income ($272K) is data1.
  const maxValue = useMemo(() => {
    let max = 0;
    if (!hiddenLines.has("income")) {
      for (const p of incomeData) max = Math.max(max, p.value);
    }
    if (!hiddenLines.has("expense")) {
      for (const p of expenseData) max = Math.max(max, p.value);
    }
    if (!hiddenLines.has("capital")) {
      for (const p of capitalData) max = Math.max(max, p.value);
    }
    return max > 0 ? Math.ceil(max * 1.05) : undefined;
  }, [incomeData, expenseData, capitalData, hiddenLines]);

  // --- Apply hidden lines ---
  const visibleColor1 = hiddenLines.has("income") ? "transparent" : CHART_COLORS.income;
  const visibleColor2 = hiddenLines.has("expense") ? "transparent" : CHART_COLORS.expense;
  const visibleColor3 = hiddenLines.has("capital") ? "transparent" : CHART_COLORS.capital;

  const fill1Start = hiddenLines.has("income") ? "transparent" : CHART_COLORS.income + "20";
  const fill1End = hiddenLines.has("income") ? "transparent" : CHART_COLORS.income + "05";
  const fill2Start = hiddenLines.has("expense") ? "transparent" : CHART_COLORS.expense + "10";
  const fill2End = hiddenLines.has("expense") ? "transparent" : CHART_COLORS.expense + "00";
  const fill3Start = hiddenLines.has("capital") ? "transparent" : CHART_COLORS.capital + "25";
  const fill3End = hiddenLines.has("capital") ? "transparent" : CHART_COLORS.capital + "05";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <ChartControls
          historyDays={historyDays}
          setHistoryDays={setHistoryDays}
          showForecast={showForecast}
          setShowForecast={setShowForecast}
        />
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.closeBtn}>
          <Feather name="x" size={22} color={theme.text} />
        </Pressable>
      </View>

      {/* ForecastSummary */}
      {forecastSummary ? (
        <ForecastSummaryBox forecastSummary={forecastSummary} showForecast={showForecast} />
      ) : null}

      {/* UX Hints */}
      {showRotateHint && (
        <Animated.View style={[styles.hintBanner, { backgroundColor: theme.muted, borderColor: theme.border, opacity: rotateOpacity }]}>
          <Feather name="rotate-cw" size={16} color={theme.textSecondary} />
          <ThemedText type="small" color={theme.textSecondary} style={{ flex: 1 }}>
            {t("chart.hint_rotate")}
          </ThemedText>
          <Pressable onPress={dismissRotateHint} hitSlop={8}>
            <Feather name="x" size={14} color={theme.textTertiary} />
          </Pressable>
        </Animated.View>
      )}
      {showSwipeHint && (
        <Animated.View style={[styles.hintBanner, { backgroundColor: theme.muted, borderColor: theme.border, opacity: swipeOpacity }]}>
          <Feather name="move" size={16} color={theme.textSecondary} />
          <ThemedText type="small" color={theme.textSecondary} style={{ flex: 1 }}>
            {t("chart.hint_swipe")}
          </ThemedText>
          <Pressable onPress={dismissSwipeHint} hitSlop={8}>
            <Feather name="x" size={14} color={theme.textTertiary} />
          </Pressable>
        </Animated.View>
      )}

      {/* Chart */}
      {isLoading || !hasData ? (
        <View style={styles.loadingChart}>
          <Feather name="bar-chart-2" size={32} color={theme.textTertiary} />
          <ThemedText type="body" color={theme.textSecondary}>
            {isLoading ? t("dashboard.chart_loading") : t("dashboard.chart_no_data")}
          </ThemedText>
        </View>
      ) : (
        <View style={styles.chartWrap}>
          <LineChart
            data={incomeData}
            data2={expenseData}
            data3={capitalDataWithMarkers}
            width={chartWidth}
            height={chartHeight}
            color1={visibleColor1}
            color2={visibleColor2}
            color3={visibleColor3}
            thickness={2}
            hideDataPoints
            areaChart
            startFillColor1={fill1Start}
            endFillColor1={fill1End}
            startFillColor2={fill2Start}
            endFillColor2={fill2End}
            startFillColor3={fill3Start}
            endFillColor3={fill3End}
            startOpacity={0.2}
            endOpacity={0.05}
            yAxisTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 9, width: 70 }}
            yAxisColor={theme.border}
            xAxisColor={theme.border}
            rulesColor={theme.border + "60"}
            formatYLabel={(val: string) => formatCompact(Number(val))}
            noOfSections={5}
            initialSpacing={10}
            endSpacing={10}
            maxValue={maxValue}
            adjustToWidth
            disableScroll
            pointerConfig={{
              pointerStripHeight: Math.max(160, chartHeight - 40),
              pointerStripColor: theme.textTertiary,
              pointerStripWidth: 1,
              pointerColor: theme.primary,
              radius: 5,
              pointerLabelWidth: 180,
              pointerLabelHeight: 120,
              activatePointersOnLongPress: false,
              autoAdjustPointerLabelPosition: true,
              persistPointer: false,
              pointerLabelComponent: (items: Array<{ value: number; date?: string; isForecast?: boolean }>, _secondaryDataItem: any, pointerIndex: number) => {
                const date = items[0]?.date ?? "";
                const forecast = items[0]?.isForecast;
                const goalLabel = getMarkerLabel(pointerIndex);
                return (
                  <View style={[styles.tooltip, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <ThemedText type="small" style={styles.tooltipDate}>
                      {date + (forecast ? ` (${t("chart.forecast_label")})` : "")}
                    </ThemedText>
                    <ThemedText type="small" color={CHART_COLORS.income}>
                      {t("chart.income_short") + ": " + formatCompact(items[0]?.value ?? 0)}
                    </ThemedText>
                    <ThemedText type="small" color={CHART_COLORS.expense}>
                      {t("chart.expense_short") + ": " + formatCompact(items[1]?.value ?? 0)}
                    </ThemedText>
                    <ThemedText type="small" color={CHART_COLORS.capital}>
                      {t("chart.capital_short") + ": " + formatCompact(items[2]?.value ?? 0)}
                    </ThemedText>
                    {goalLabel ? (
                      <ThemedText type="small" color={theme.primary} style={styles.bold}>
                        {goalLabel}
                      </ThemedText>
                    ) : null}
                  </View>
                );
              },
            }}
          />
        </View>
      )}

      {/* Clickable Legend */}
      <ChartLegend hiddenLines={hiddenLines} onToggle={toggleLine} />

      <WishlistMarkerSheet
        visible={!!selectedMarker}
        onClose={() => setSelectedMarker(null)}
        items={selectedMarker?.items || []}
        date={selectedMarker?.date || ""}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.lg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  closeBtn: { padding: Spacing.xs },
  loadingChart: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  chartWrap: { flex: 1 },
  hintBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  tooltip: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 2,
    minWidth: 140,
  },
  tooltipDate: {
    fontWeight: "600",
    marginBottom: 2,
  },
  bold: { fontWeight: "600" },
});

import React, { useState, useMemo, useRef, useCallback } from "react";
import { View, StyleSheet, Pressable, LayoutRectangle } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { Card, CardHeader, CardContent } from "./Card";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import {
  useFinancialTrendChart,
  CHART_COLORS,
  formatCompact,
} from "../hooks/useFinancialTrendChart";
import { ChartControls } from "./financial-trend-chart/ChartControls";
import { ForecastSummaryBox } from "./financial-trend-chart/ForecastSummary";
import { ChartLegend } from "./financial-trend-chart/ChartLegend";
import { WishlistChartMarkerDot } from "./wishlist/WishlistChartMarker";
import { WishlistMarkerSheet } from "./wishlist/WishlistMarkerSheet";
import { useTranslation } from "../i18n";
import { computeTooltipPosition } from "./financial-trend-chart/tooltipPosition";
import type { WishlistChartMarker } from "../hooks/useWishlistChart";

/* ── Constants ─────────────────────────────────────────── */

const CHART_HEIGHT = 200;
const TOOLTIP_W = 150;
const TOOLTIP_H = 90;
const TAIL_SIZE = 8;
const Y_AXIS_WIDTH = 48; // approximate y-axis label width

/* ── Types ─────────────────────────────────────────────── */

interface Props {
  wishlistMarkers?: WishlistChartMarker[];
  onFullscreen?: (params: { historyDays: number; showForecast: boolean }) => void;
}

interface PointerState {
  index: number;
  items: Array<{ value: number; date?: string; isForecast?: boolean }>;
}

/* ── Component ─────────────────────────────────────────── */

export default function FinancialTrendChart({ wishlistMarkers, onFullscreen }: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [selectedMarker, setSelectedMarker] = useState<WishlistChartMarker | null>(null);
  const {
    historyDays,
    setHistoryDays,
    showForecast,
    setShowForecast,
    screenWidth,
    sampledTrendData,
    incomeData,
    expenseData,
    capitalData,
    forecastSummary,
    isLoading,
    hasData,
  } = useFinancialTrendChart();

  /* ── Pointer / tooltip overlay state ─────────────────── */
  const [activePointer, setActivePointer] = useState<PointerState | null>(null);
  const [chartLayout, setChartLayout] = useState<LayoutRectangle | null>(null);
  const pointerIndexRef = useRef(-1);
  const vanishTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleChartLayout = useCallback(
    (e: { nativeEvent: { layout: LayoutRectangle } }) => {
      setChartLayout(e.nativeEvent.layout);
    },
    [],
  );

  const clearPointer = useCallback(() => {
    setActivePointer(null);
    pointerIndexRef.current = -1;
  }, []);

  /* ── Wishlist markers ────────────────────────────────── */
  const markerMap = useMemo(() => {
    const map = new Map<number, WishlistChartMarker>();
    if (wishlistMarkers) {
      for (const m of wishlistMarkers) map.set(m.index, m);
    }
    return map;
  }, [wishlistMarkers]);

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

  const maxValue = useMemo(() => {
    let max = 0;
    for (const p of incomeData) max = Math.max(max, p.value);
    for (const p of expenseData) max = Math.max(max, p.value);
    for (const p of capitalData) max = Math.max(max, p.value);
    return max > 0 ? Math.ceil(max * 1.05) : undefined;
  }, [incomeData, expenseData, capitalData]);

  const getMarkerLabel = (index: number): string | null => {
    const marker = markerMap.get(index);
    if (!marker) return null;
    if (marker.items.length === 1) {
      return t("chart.goal_available").replace("{name}", marker.items[0].name);
    }
    return t("chart.goals_on_date").replace("{count}", String(marker.items.length));
  };

  /* ── Tooltip position (absolute in chart area) ───────── */
  const chartDataWidth = screenWidth - 40;

  const tooltipPos = useMemo(() => {
    if (!activePointer) return null;
    return computeTooltipPosition({
      pointerIndex: activePointer.index,
      pointsCount: incomeData.length,
      chartWidth: chartDataWidth,
      chartHeight: CHART_HEIGHT,
      tooltipWidth: TOOLTIP_W,
      tooltipHeight: TOOLTIP_H,
    });
  }, [activePointer, incomeData.length, chartDataWidth]);

  /* ── Render ──────────────────────────────────────────── */
  return (
    <Card>
      <CardHeader>
        <View style={styles.titleRow}>
          <ThemedText type="h4" style={styles.bold}>
            {t("dashboard.financial_forecast")}
          </ThemedText>
          <View style={styles.titleActions}>
            {onFullscreen ? (
              <Pressable onPress={() => onFullscreen?.({ historyDays, showForecast })} hitSlop={8}>
                <Feather name="maximize-2" size={16} color={theme.primary} />
              </Pressable>
            ) : null}
            <Feather name="trending-up" size={18} color={theme.primary} />
          </View>
        </View>
        <ThemedText type="small" color={theme.textSecondary}>
          {t("dashboard.financial_trend_subtitle")}
        </ThemedText>
      </CardHeader>

      <CardContent style={styles.cardContent}>
        <ChartControls
          historyDays={historyDays}
          setHistoryDays={setHistoryDays}
          showForecast={showForecast}
          setShowForecast={setShowForecast}
        />

        {forecastSummary ? (
          <ForecastSummaryBox
            forecastSummary={forecastSummary}
            showForecast={showForecast}
          />
        ) : null}

        {isLoading ? (
          <View style={styles.loadingChart}>
            <Feather name="loader" size={24} color={theme.primary} />
            <ThemedText type="bodySm" color={theme.textSecondary}>
              {t("dashboard.chart_loading")}
            </ThemedText>
          </View>
        ) : !hasData ? (
          <View style={styles.loadingChart}>
            <Feather name="bar-chart-2" size={24} color={theme.textTertiary} />
            <ThemedText type="bodySm" color={theme.textSecondary}>
              {t("dashboard.chart_no_data")}
            </ThemedText>
          </View>
        ) : (
          <View
            style={styles.chartContainer}
            onLayout={handleChartLayout}
            onTouchEnd={() => {
              clearTimeout(vanishTimerRef.current);
              vanishTimerRef.current = setTimeout(clearPointer, 250);
            }}
          >
            <LineChart
              data={incomeData}
              data2={expenseData}
              data3={capitalDataWithMarkers}
              width={chartDataWidth}
              height={CHART_HEIGHT}
              color1={CHART_COLORS.income}
              color2={CHART_COLORS.expense}
              color3={CHART_COLORS.capital}
              thickness={2}
              hideDataPoints
              areaChart
              startFillColor1={CHART_COLORS.income + "20"}
              endFillColor1={CHART_COLORS.income + "05"}
              startFillColor2={CHART_COLORS.expense + "10"}
              endFillColor2={CHART_COLORS.expense + "00"}
              startFillColor3={CHART_COLORS.capital + "25"}
              endFillColor3={CHART_COLORS.capital + "05"}
              startOpacity={0.2}
              endOpacity={0.05}
              yAxisTextStyle={{ color: theme.textSecondary, fontSize: 9 }}
              xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 8, width: 70 }}
              yAxisColor={theme.border}
              xAxisColor={theme.border}
              rulesColor={theme.border + "60"}
              formatYLabel={(val: string) => formatCompact(Number(val))}
              maxValue={maxValue}
              noOfSections={4}
              initialSpacing={10}
              endSpacing={10}
              adjustToWidth
              pointerConfig={{
                pointerStripHeight: 180,
                pointerStripColor: theme.textTertiary,
                pointerStripWidth: 1,
                pointerColor: theme.primary,
                radius: 4,
                pointerLabelWidth: 1,
                pointerLabelHeight: 1,
                autoAdjustPointerLabelPosition: true,
                pointerLabelComponent: (
                  items: Array<{ value: number; date?: string; isForecast?: boolean }>,
                  _secondaryDataItem: unknown,
                  pointerIndex: number,
                ) => {
                  // Capture pointer state for our overlay tooltip
                  if (pointerIndexRef.current !== pointerIndex) {
                    pointerIndexRef.current = pointerIndex;
                    // Schedule state update outside of render cycle
                    requestAnimationFrame(() =>
                      setActivePointer({ index: pointerIndex, items }),
                    );
                  }
                  // Reset vanish timer while pointer is active
                  clearTimeout(vanishTimerRef.current);
                  vanishTimerRef.current = setTimeout(clearPointer, 400);
                  // Return invisible placeholder (library requires a return value)
                  return <View />;
                },
              }}
            />

            {/* ── Comic-bubble tooltip overlay ─────────── */}
            {activePointer && tooltipPos && (
              <View
                pointerEvents="none"
                style={[
                  styles.tooltipOverlay,
                  {
                    left: Y_AXIS_WIDTH + tooltipPos.left,
                    top: tooltipPos.top,
                  },
                ]}
              >
                {/* Tail pointing toward the pointer line */}
                <View
                  style={
                    tooltipPos.side === "right"
                      ? [styles.tailLeft, { borderRightColor: theme.card }]
                      : [styles.tailRight, { borderLeftColor: theme.card }]
                  }
                />
                {/* Tooltip body */}
                <View
                  style={[
                    styles.tooltipBody,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <ThemedText type="small" style={styles.tooltipDate}>
                    {(activePointer.items[0]?.date ?? "") +
                      (activePointer.items[0]?.isForecast
                        ? ` (${t("chart.forecast_label")})`
                        : "")}
                  </ThemedText>
                  <ThemedText type="small" color={CHART_COLORS.income}>
                    {t("chart.income_short") +
                      ": " +
                      formatCompact(activePointer.items[0]?.value ?? 0)}
                  </ThemedText>
                  <ThemedText type="small" color={CHART_COLORS.expense}>
                    {t("chart.expense_short") +
                      ": " +
                      formatCompact(activePointer.items[1]?.value ?? 0)}
                  </ThemedText>
                  <ThemedText type="small" color={CHART_COLORS.capital}>
                    {t("chart.capital_short") +
                      ": " +
                      formatCompact(activePointer.items[2]?.value ?? 0)}
                  </ThemedText>
                  {getMarkerLabel(activePointer.index) ? (
                    <ThemedText type="small" color={theme.primary} style={styles.bold}>
                      {getMarkerLabel(activePointer.index)}
                    </ThemedText>
                  ) : null}
                </View>
              </View>
            )}
          </View>
        )}

        <ChartLegend />
      </CardContent>

      <WishlistMarkerSheet
        visible={!!selectedMarker}
        onClose={() => setSelectedMarker(null)}
        items={selectedMarker?.items || []}
        date={selectedMarker?.date || ""}
      />
    </Card>
  );
}

/* ── Styles ─────────────────────────────────────────────── */

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleActions: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  bold: { fontWeight: "600" },
  cardContent: { gap: Spacing.md },
  loadingChart: {
    alignItems: "center",
    justifyContent: "center",
    height: 200,
    gap: Spacing.md,
  },
  chartContainer: {
    marginHorizontal: -Spacing.sm,
    position: "relative",
  },

  /* ── Tooltip overlay ────────────────────────────────── */
  tooltipOverlay: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  tooltipBody: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 2,
    minWidth: 130,
    // subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  tooltipDate: {
    fontWeight: "600",
    marginBottom: 2,
  },

  /* ── Comic tail (CSS triangle via borders) ──────────── */
  tailLeft: {
    width: 0,
    height: 0,
    borderTopWidth: TAIL_SIZE,
    borderBottomWidth: TAIL_SIZE,
    borderRightWidth: TAIL_SIZE + 2,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: "transparent", // overridden inline
    marginRight: -1, // overlap border
  },
  tailRight: {
    width: 0,
    height: 0,
    borderTopWidth: TAIL_SIZE,
    borderBottomWidth: TAIL_SIZE,
    borderLeftWidth: TAIL_SIZE + 2,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent", // overridden inline
    marginLeft: -1, // overlap border
  },
});

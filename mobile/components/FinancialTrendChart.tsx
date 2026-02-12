import React, { useState, useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
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
import type { WishlistChartMarker } from "../hooks/useWishlistChart";

interface Props {
  wishlistMarkers?: WishlistChartMarker[];
  onFullscreen?: () => void;
}

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

  // Build marker index set for quick lookup
  const markerMap = useMemo(() => {
    const map = new Map<number, WishlistChartMarker>();
    if (wishlistMarkers) {
      for (const m of wishlistMarkers) map.set(m.index, m);
    }
    return map;
  }, [wishlistMarkers]);

  // Apply showDataPoint + customDataPoint to capital line at marker indices
  const capitalDataWithMarkers = useMemo(() => {
    if (markerMap.size === 0) return capitalData;
    return capitalData.map((point, i) => {
      const marker = markerMap.get(i);
      if (!marker) return point;
      return {
        ...point,
        showDataPoint: true,
        dataPointRadius: 0, // hide default dot, we render custom
        customDataPoint: () => (
          <WishlistChartMarkerDot marker={marker} onPress={setSelectedMarker} />
        ),
      };
    });
  }, [capitalData, markerMap]);

  // Find wishlist goal name for tooltip enrichment
  const getMarkerLabel = (index: number): string | null => {
    const marker = markerMap.get(index);
    if (!marker) return null;
    if (marker.items.length === 1) {
      return t("chart.goal_available").replace("{name}", marker.items[0].name);
    }
    return t("chart.goals_on_date").replace("{count}", String(marker.items.length));
  };

  return (
    <Card>
      <CardHeader>
        <View style={styles.titleRow}>
          <ThemedText type="h4" style={styles.bold}>
            {t("dashboard.financial_forecast")}
          </ThemedText>
          <View style={styles.titleActions}>
            {onFullscreen ? (
              <Pressable onPress={onFullscreen} hitSlop={8}>
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
          <View style={styles.chartContainer}>
            <LineChart
              data={incomeData}
              data2={expenseData}
              data3={capitalDataWithMarkers}
              width={screenWidth - 40}
              height={200}
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
                pointerLabelWidth: 160,
                pointerLabelHeight: 110,
                pointerLabelComponent: (items: Array<{ value: number; date?: string; isForecast?: boolean }>, secondaryDataItem: any, pointerIndex: number) => {
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
});

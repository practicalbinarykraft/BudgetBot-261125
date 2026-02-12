import React from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { ChartControls } from "../components/financial-trend-chart/ChartControls";
import { ChartLegend } from "../components/financial-trend-chart/ChartLegend";
import { WishlistChartMarkerDot } from "../components/wishlist/WishlistChartMarker";
import { WishlistMarkerSheet } from "../components/wishlist/WishlistMarkerSheet";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import {
  useFinancialTrendChart,
  CHART_COLORS,
  formatCompact,
} from "../hooks/useFinancialTrendChart";
import { useWishlistChart, type WishlistChartMarker } from "../hooks/useWishlistChart";
import { useFullscreenChart } from "../hooks/useFullscreenChart";
import { useState, useMemo } from "react";

export default function FullscreenChartScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [selectedMarker, setSelectedMarker] = useState<WishlistChartMarker | null>(null);

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
    isLoading,
    hasData,
  } = useFinancialTrendChart();

  const { markers } = useWishlistChart(sampledTrendData);

  // Use current screen dimensions (updates on rotation)
  const { width, height } = Dimensions.get("window");
  const chartWidth = width - Spacing.lg * 2 - 60;
  const chartHeight = height - 200; // leave room for controls + legend

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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
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
            height={Math.max(200, chartHeight)}
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
            yAxisTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 9, width: 70 }}
            yAxisColor={theme.border}
            xAxisColor={theme.border}
            rulesColor={theme.border + "60"}
            formatYLabel={(val: string) => formatCompact(Number(val))}
            noOfSections={5}
            initialSpacing={10}
            endSpacing={10}
            adjustToWidth
          />
        </View>
      )}

      <ChartLegend />

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
});

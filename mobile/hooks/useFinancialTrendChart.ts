import { useState, useMemo } from "react";
import { Dimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Spacing } from "../constants/theme";
import { api } from "../lib/api-client";
import { useTranslation } from "../i18n";
import { getDateLocale } from "../lib/date-locale";
import type { TrendResponse, TrendDataPoint } from "../types";

export const CHART_COLORS = {
  income: "#22c55e",
  expense: "#dc2626",
  capital: "#3b82f6",
};

export type HistoryDays = 7 | 30 | 90 | 365;

export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatChartDate(dateStr: string, locale: string = "en-US"): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

export const HISTORY_OPTIONS: { value: HistoryDays; label: string }[] = [
  { value: 7, label: "7D" },
  { value: 30, label: "30D" },
  { value: 90, label: "90D" },
  { value: 365, label: "1Y" },
];

export function useFinancialTrendChart() {
  const { language } = useTranslation();
  const locale = getDateLocale(language);
  const [historyDays, setHistoryDays] = useState<HistoryDays>(30);
  const [showForecast, setShowForecast] = useState(true);
  const screenWidth = Dimensions.get("window").width - Spacing.lg * 2 - Spacing.lg * 2;

  const forecastDays = showForecast ? 365 : 0;

  const trendQuery = useQuery({
    queryKey: ["analytics-trend", historyDays, forecastDays],
    queryFn: () =>
      api.get<TrendResponse>(
        `/api/analytics/trend?historyDays=${historyDays}&forecastDays=${forecastDays}&graphMode=lite&capitalMode=networth`
      ),
  });

  const trendData = trendQuery.data?.trendData || [];

  const { incomeData, expenseData, capitalData, xLabels } = useMemo(() => {
    if (trendData.length === 0) {
      return { incomeData: [], expenseData: [], capitalData: [], xLabels: [] };
    }

    const maxPoints = historyDays <= 30 ? 50 : historyDays <= 90 ? 60 : 70;
    const step = Math.max(1, Math.floor(trendData.length / maxPoints));
    const sampled: TrendDataPoint[] = [];
    for (let i = 0; i < trendData.length; i += step) {
      sampled.push(trendData[i]);
    }
    if (sampled[sampled.length - 1] !== trendData[trendData.length - 1]) {
      sampled.push(trendData[trendData.length - 1]);
    }

    const labelInterval = Math.max(1, Math.floor(sampled.length / 5));

    const income = sampled.map((p, i) => ({
      value: p.income,
      date: formatChartDate(p.date, locale),
      isForecast: !!p.isForecast,
      label: i % labelInterval === 0 ? formatChartDate(p.date, locale) : "",
      showDataPoint: false,
    }));

    const expense = sampled.map((p) => ({
      value: p.expense,
      showDataPoint: false,
    }));

    const capital = sampled.map((p) => ({
      value: p.capital,
      showDataPoint: false,
    }));

    const labels = sampled.map((p) => formatChartDate(p.date, locale));

    return {
      incomeData: income,
      expenseData: expense,
      capitalData: capital,
      xLabels: labels,
    };
  }, [trendData, locale]);

  const forecastSummary = useMemo(() => {
    if (trendData.length === 0) return null;
    const historical = trendData.filter((p) => !p.isForecast);
    const forecast = trendData.filter((p) => p.isForecast);
    if (historical.length === 0 || forecast.length === 0) return null;

    const current = historical[historical.length - 1].capital;
    const projected = forecast[forecast.length - 1].capital;
    const percentChange =
      current !== 0 ? ((projected - current) / Math.abs(current)) * 100 : 0;

    return { current, projected, percentChange };
  }, [trendData]);

  const isLoading = trendQuery.isLoading;
  const hasData = incomeData.length > 0;

  return {
    historyDays,
    setHistoryDays,
    showForecast,
    setShowForecast,
    screenWidth,
    incomeData,
    expenseData,
    capitalData,
    xLabels,
    forecastSummary,
    isLoading,
    hasData,
  };
}

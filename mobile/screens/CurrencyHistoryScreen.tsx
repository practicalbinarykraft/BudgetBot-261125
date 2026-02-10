import React from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ThemedText } from "../components/ThemedText";
import { Card, CardContent } from "../components/Card";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { api } from "../lib/api-client";
import { styles } from "./styles/currencyHistoryStyles";

interface RateHistoryEntry {
  id: number;
  currencyCode: string;
  rate: string;
  source: string;
  createdAt: string;
}

interface RateHistory {
  history: Record<string, RateHistoryEntry[]>;
  count: number;
}

interface CurrencyCardData {
  code: string;
  latestRate: number;
  oldestRate: number;
  change: number;
  changePercent: number;
  isUp: boolean;
  isDown: boolean;
  isFlat: boolean;
  lastUpdated: string;
  source: string;
}

export default function CurrencyHistoryScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const { data, isLoading, isRefetching, refetch, error } = useQuery<RateHistory>({
    queryKey: ["exchange-rates-history", { days: 30 }],
    queryFn: () => api.get<RateHistory>("/api/exchange-rates/history?days=30"),
  });

  const currencies: CurrencyCardData[] = Object.keys(data?.history || {})
    .sort()
    .map((code) => {
      const history = data!.history[code];
      if (!history || history.length === 0) return null;
      const latestRate = parseFloat(history[0]?.rate || "0");
      const oldestRate = parseFloat(history[history.length - 1]?.rate || "0");
      const change = latestRate - oldestRate;
      const changePercent = oldestRate ? (change / oldestRate) * 100 : 0;
      return {
        code, latestRate, oldestRate, change, changePercent,
        isUp: change > 0, isDown: change < 0, isFlat: Math.abs(changePercent) < 0.1,
        lastUpdated: new Date(history[0]?.createdAt).toLocaleDateString(),
        source: history[0]?.source === "api" ? "Live API" : "Fallback",
      };
    })
    .filter(Boolean) as CurrencyCardData[];

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemedText type="body" color={theme.destructive}>{"Failed to load currency history"}</ThemedText>
      </View>
    );
  }

  const renderItem = ({ item }: { item: CurrencyCardData }) => (
    <Card style={styles.card}>
      <CardContent style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <ThemedText type="h3">{item.code}</ThemedText>
          {item.isFlat ? (
            <View style={styles.trendRow}>
              <Feather name="minus" size={14} color={theme.textTertiary} />
              <ThemedText type="small" color={theme.textTertiary}>{"Stable"}</ThemedText>
            </View>
          ) : (
            <View style={styles.trendRow}>
              <Feather name={item.isUp ? "trending-up" : "trending-down"} size={14} color={item.isUp ? "#16a34a" : theme.destructive} />
              <ThemedText type="small" color={item.isUp ? "#16a34a" : theme.destructive}>
                {Math.abs(item.changePercent).toFixed(2)}%
              </ThemedText>
            </View>
          )}
        </View>
        <View style={styles.rateSection}>
          <ThemedText type="small" color={theme.textSecondary}>{"Current Rate"}</ThemedText>
          <ThemedText type="h2" mono style={styles.rateValue}>{item.latestRate.toFixed(4)}</ThemedText>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statHalf}>
            <ThemedText type="small" color={theme.textSecondary}>{"30d ago"}</ThemedText>
            <ThemedText type="bodySm" style={styles.statValue}>{item.oldestRate.toFixed(4)}</ThemedText>
          </View>
          <View style={styles.statHalf}>
            <ThemedText type="small" color={theme.textSecondary}>{"Change"}</ThemedText>
            <ThemedText type="bodySm" color={item.isUp ? "#16a34a" : item.isDown ? theme.destructive : theme.textTertiary} style={styles.statValue}>
              {item.change >= 0 ? "+" : ""}{item.change.toFixed(4)}
            </ThemedText>
          </View>
        </View>
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <ThemedText type="small" color={theme.textTertiary}>{"Last updated: " + item.lastUpdated}</ThemedText>
          <ThemedText type="small" color={theme.textTertiary}>{"Source: " + item.source}</ThemedText>
        </View>
      </CardContent>
    </Card>
  );

  return (
    <FlatList
      data={currencies}
      keyExtractor={(item) => item.code}
      renderItem={renderItem}
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <ThemedText type="h2">{"Currency Exchange Rates History"}</ThemedText>
          <ThemedText type="bodySm" color={theme.textSecondary}>{"Historical rates for the last 30 days (1 USD = X currency)"}</ThemedText>
        </View>
      }
      ListEmptyComponent={
        <Card>
          <CardContent style={styles.empty}>
            <ThemedText type="body" color={theme.textSecondary}>{"No historical data available yet. Data will be collected daily."}</ThemedText>
          </CardContent>
        </Card>
      }
    />
  );
}

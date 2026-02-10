import React from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { Card, CardHeader, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { useTheme } from "../hooks/useTheme";
import { useProductDetailScreen } from "../hooks/useProductDetailScreen";
import { styles } from "./styles/productDetailStyles";
import type { PriceHistoryEntry } from "../types";

export default function ProductDetailScreen() {
  const { theme } = useTheme();
  const { historyQuery, handleDelete, formatDate } = useProductDetailScreen();

  if (historyQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const data = historyQuery.data;
  if (!data) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Feather name="package" size={48} color={theme.textTertiary} />
        <ThemedText type="body" color={theme.textSecondary}>{"Product not found"}</ThemedText>
      </View>
    );
  }

  const { product, priceHistory, byStore, statistics } = data;

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <ThemedText type="h2">{product.name}</ThemedText>
          {product.category ? <Badge label={product.category} variant="outline" /> : null}
        </View>
        <Button title="Delete" variant="destructive" size="sm" onPress={handleDelete} icon={<Feather name="trash-2" size={14} color="#ffffff" />} />
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <ThemedText type="small" color={theme.textSecondary}>{"Total Purchases"}</ThemedText>
            <ThemedText type="h3" mono>{statistics.totalPurchases}</ThemedText>
          </CardContent>
        </Card>
        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <ThemedText type="small" color={theme.textSecondary}>{"Average Price"}</ThemedText>
            <ThemedText type="h3" mono>{statistics.averagePrice ? `$${statistics.averagePrice}` : "-"}</ThemedText>
          </CardContent>
        </Card>
        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <ThemedText type="small" color={theme.textSecondary}>{"Best Price"}</ThemedText>
            <ThemedText type="h3" mono color="#10b981">{statistics.bestPrice ? `$${statistics.bestPrice}` : "-"}</ThemedText>
          </CardContent>
        </Card>
        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <ThemedText type="small" color={theme.textSecondary}>{"Best Store"}</ThemedText>
            <ThemedText type="bodySm" style={styles.bold}>{statistics.bestStore || "-"}</ThemedText>
          </CardContent>
        </Card>
      </View>

      {Object.keys(byStore).length > 0 ? (
        <Card>
          <CardHeader>
            <ThemedText type="h4" style={styles.bold}>{"Price History by Store"}</ThemedText>
          </CardHeader>
          <CardContent style={styles.storesContent}>
            {Object.entries(byStore).map(([store, entries]) => (
              <View key={store} style={styles.storeSection}>
                <ThemedText type="bodySm" style={styles.storeName}>{store}</ThemedText>
                {entries.map((entry: PriceHistoryEntry) => (
                  <View key={entry.id} style={[styles.priceRow, { borderColor: theme.border }]}>
                    <ThemedText type="small" color={theme.textSecondary}>{formatDate(entry.purchaseDate)}</ThemedText>
                    <ThemedText type="bodySm" mono>{"$"}{entry.price}</ThemedText>
                  </View>
                ))}
              </View>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {priceHistory.length > 0 ? (
        <Card>
          <CardHeader>
            <ThemedText type="h4" style={styles.bold}>{"All Purchases"}</ThemedText>
          </CardHeader>
          <CardContent style={styles.historyContent}>
            {priceHistory.map((entry) => (
              <View key={entry.id} style={[styles.historyRow, { borderColor: theme.border }]}>
                <View style={styles.historyLeft}>
                  <ThemedText type="bodySm" style={styles.bold}>{entry.storeName}</ThemedText>
                  <ThemedText type="small" color={theme.textSecondary}>{formatDate(entry.purchaseDate)}</ThemedText>
                </View>
                <ThemedText type="bodySm" mono>{"$"}{entry.price}</ThemedText>
              </View>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </ScrollView>
  );
}

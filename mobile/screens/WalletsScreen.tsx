import React from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation } from "@tanstack/react-query";
import { normalizePaginatedData, queryClient } from "../lib/query-client";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Card, CardHeader, CardContent } from "../components/Card";
import { WalletCard } from "../components/WalletCard";
import { Button } from "../components/Button";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api-client";
import type { Wallet, PaginatedResponse } from "../types";
import { useTranslation } from "../i18n";
import { useSpotlightTarget } from "../tutorial/spotlight";

export default function WalletsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const addWalletTarget = useSpotlightTarget("add_wallet_btn");
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["wallets"],
    queryFn: () => api.get<PaginatedResponse<Wallet>>("/api/wallets?limit=50"),
  });

  const wallets = normalizePaginatedData<Wallet>(data);

  const setPrimaryMutation = useMutation({
    mutationFn: (walletId: number) =>
      api.patch(`/api/wallets/${walletId}/primary`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
  });

  const totalBalanceUsd = wallets.reduce(
    (sum, w) => sum + parseFloat(w.balanceUsd || w.balance || "0"),
    0
  );

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Block 1: Page header — web: flex-col sm:flex-row justify-between */}
      <View style={styles.pageHeader}>
        <View>
          <ThemedText type="h2">{t("wallets.title")}</ThemedText>
          <ThemedText type="bodySm" color={theme.textSecondary}>
            {t("wallets.manage")}
          </ThemedText>
        </View>
        <View style={styles.headerButtons}>
          <Button
            title={t("wallets.calibrate")}
            variant="outline"
            size="sm"
            onPress={() => navigation.navigate("Calibration")}
            icon={<Feather name="settings" size={14} color={theme.text} />}
          />
          <View ref={addWalletTarget.ref} onLayout={addWalletTarget.onLayout} collapsable={false} style={{ alignSelf: "flex-start" }}>
            <Button
              title={t("wallets.add_wallet")}
              size="sm"
              onPress={() => navigation.navigate("AddWallet")}
              icon={
                <Feather name="plus" size={14} color={theme.primaryForeground} />
              }
            />
          </View>
        </View>
      </View>

      {/* Block 2: Total Net Worth Card — web: Card border-l-4 border-l-primary */}
      <Card style={styles.totalCard}>
        <CardHeader>
          <ThemedText type="bodySm" color={theme.textSecondary}>
            {t("wallets.net_worth")}
          </ThemedText>
        </CardHeader>
        <CardContent>
          <ThemedText type="mono4xl" mono>
            {"$"}{totalBalanceUsd.toFixed(2)}
          </ThemedText>
        </CardContent>
      </Card>
    </View>
  );

  return (
    <FlatList
      data={wallets}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <View style={styles.walletItem}>
          <WalletCard
            wallet={item}
            onSetPrimary={(id) => setPrimaryMutation.mutate(id)}
          />
        </View>
      )}
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.list}
      numColumns={1}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Feather name="credit-card" size={48} color={theme.textTertiary} />
          <ThemedText type="body" color={theme.textSecondary} style={styles.emptyText}>
            {t("wallets.no_wallets")}
          </ThemedText>
          <ThemedText type="bodySm" color={theme.textTertiary}>
            {t("wallets.add_wallet")}
          </ThemedText>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: {
    padding: Spacing.lg,
    paddingBottom: Spacing["5xl"],
  },
  headerSection: {
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  pageHeader: {
    gap: Spacing.md,
  },
  headerButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  totalCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  walletItem: {
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    paddingVertical: Spacing["4xl"],
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyText: {
    marginTop: Spacing.md,
  },
});

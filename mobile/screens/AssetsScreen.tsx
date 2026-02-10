import React from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useAssetsScreen } from "../hooks/useAssetsScreen";
import type { TabFilter } from "../hooks/useAssetsScreen";
import { AssetCard } from "../components/assets/AssetCard";
import { AssetsSummaryCard } from "../components/assets/AssetsSummaryCard";
import type { Asset } from "../types";

export default function AssetsScreen() {
  const { theme } = useTheme();
  const {
    navigation,
    tab,
    setTab,
    allAssets,
    filtered,
    summary,
    isLoading,
    isRefetching,
    handleDelete,
    handleRefresh,
  } = useAssetsScreen();

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const renderItem = ({ item }: { item: Asset }) => (
    <AssetCard
      item={item}
      onPress={() => navigation.navigate("AssetDetail", { assetId: item.id })}
      onDelete={handleDelete}
    />
  );

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={handleRefresh}
        />
      }
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <ThemedText type="h2">{"Assets"}</ThemedText>
              <ThemedText type="bodySm" color={theme.textSecondary}>
                {"Manage your assets and liabilities"}
              </ThemedText>
            </View>
            <Button
              title="Add"
              size="sm"
              onPress={() =>
                navigation.navigate("AddEditAsset", { type: tab })
              }
              icon={
                <Feather
                  name="plus"
                  size={14}
                  color={theme.primaryForeground}
                />
              }
            />
          </View>

          {summary ? <AssetsSummaryCard summary={summary} /> : null}

          <View style={styles.tabsRow}>
            {(["asset", "liability"] as TabFilter[]).map((t) => {
              const isActive = tab === t;
              const count = allAssets.filter((a) => a.type === t).length;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  style={[
                    styles.tabBtn,
                    {
                      backgroundColor: isActive
                        ? theme.primary
                        : theme.secondary,
                      borderColor: isActive ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    type="bodySm"
                    color={isActive ? "#ffffff" : theme.text}
                  >
                    {t === "asset" ? "Assets" : "Liabilities"}
                    {" ("}
                    {count}
                    {")"}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Feather
            name={tab === "asset" ? "trending-up" : "trending-down"}
            size={48}
            color={theme.textTertiary}
          />
          <ThemedText
            type="body"
            color={theme.textSecondary}
            style={styles.emptyTitle}
          >
            {tab === "asset" ? "No assets yet" : "No liabilities yet"}
          </ThemedText>
          <ThemedText type="bodySm" color={theme.textTertiary}>
            {`Add your first ${tab} to track it`}
          </ThemedText>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: Spacing.lg, paddingBottom: Spacing["5xl"] },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  headerLeft: { flex: 1, gap: Spacing.xs },
  tabsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  tabBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    paddingVertical: Spacing["4xl"],
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyTitle: { marginTop: Spacing.md },
});

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
import { useTranslation } from "../i18n";
import { useAssetsScreen } from "../hooks/useAssetsScreen";
import type { TabFilter } from "../hooks/useAssetsScreen";
import { AssetCard } from "../components/assets/AssetCard";
import { AssetsSummaryCard } from "../components/assets/AssetsSummaryCard";
import type { Asset } from "../types";

export default function AssetsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
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
              <ThemedText type="h2">{t("assets.title")}</ThemedText>
              <ThemedText type="bodySm" color={theme.textSecondary}>
                {t("assets.manage")}
              </ThemedText>
            </View>
            <Button
              title={t("common.add")}
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
            {(["asset", "liability"] as TabFilter[]).map((f) => {
              const isActive = tab === f;
              const count = allAssets.filter((a) => a.type === f).length;
              return (
                <Pressable
                  key={f}
                  onPress={() => setTab(f)}
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
                    {f === "asset" ? t("assets.tab_assets") : t("assets.tab_liabilities")}
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
            {tab === "asset" ? t("assets.no_assets") : t("assets.no_liabilities")}
          </ThemedText>
          <ThemedText type="bodySm" color={theme.textTertiary}>
            {tab === "asset" ? t("assets.empty_add_asset") : t("assets.empty_add_liability")}
          </ThemedText>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing["5xl"] },
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

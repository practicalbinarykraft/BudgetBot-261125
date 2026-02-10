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
import { useWishlistScreen } from "../hooks/useWishlistScreen";
import type { SortOption } from "../hooks/useWishlistScreen";
import { WishlistCard } from "../components/wishlist/WishlistCard";
import type { WishlistItem } from "../types";

export default function WishlistScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const {
    navigation,
    sortBy,
    setSortBy,
    items,
    sorted,
    isLoading,
    isRefetching,
    handleRefresh,
    handleDelete,
    handleTogglePurchased,
  } = useWishlistScreen();

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const renderItem = ({ item }: { item: WishlistItem }) => (
    <WishlistCard
      item={item}
      onTogglePurchased={handleTogglePurchased}
      onDelete={handleDelete}
    />
  );

  return (
    <FlatList
      data={sorted}
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
              <ThemedText type="h2">{t("wishlist.title")}</ThemedText>
              <ThemedText type="bodySm" color={theme.textSecondary}>
                {t("wishlist.manage")}
              </ThemedText>
            </View>
            <Button
              title={t("wishlist.add")}
              size="sm"
              onPress={() => navigation.navigate("AddWishlist")}
              icon={<Feather name="plus" size={14} color={theme.primaryForeground} />}
            />
          </View>

          {items.length > 0 ? (
            <View style={styles.sortRow}>
              <Feather name="bar-chart-2" size={14} color={theme.textSecondary} />
              {(["priority", "amount", "date"] as SortOption[]).map((opt) => {
                const isActive = sortBy === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setSortBy(opt)}
                    style={[
                      styles.sortBtn,
                      {
                        backgroundColor: isActive ? theme.primary : theme.secondary,
                        borderColor: isActive ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <ThemedText type="small" color={isActive ? "#ffffff" : theme.text}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Feather name="heart" size={48} color={theme.textTertiary} />
          <ThemedText type="body" color={theme.textSecondary} style={styles.emptyTitle}>
            {t("wishlist.no_items")}
          </ThemedText>
          <ThemedText type="bodySm" color={theme.textTertiary}>
            {t("wishlist.manage")}
          </ThemedText>
          <Button
            title={t("wishlist.add")}
            onPress={() => navigation.navigate("AddWishlist")}
            icon={<Feather name="plus" size={14} color={theme.primaryForeground} />}
            style={styles.emptyBtn}
          />
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
    marginBottom: Spacing.md,
  },
  headerLeft: { flex: 1, gap: Spacing.xs },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sortBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  empty: {
    paddingVertical: Spacing["4xl"],
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyTitle: { marginTop: Spacing.md },
  emptyBtn: { marginTop: Spacing.md, minWidth: 160 },
});

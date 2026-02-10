import React from "react";
import {
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { useNotificationsScreen } from "../hooks/useNotificationsScreen";
import { styles } from "./styles/notificationsStyles";
import type { Notification } from "../types";

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const {
    filterType, setFilterType, notificationsQuery, notifications,
    completeMutation, dismissMutation, deleteMutation,
    handleRefresh, formatDate, filters,
  } = useNotificationsScreen();

  const renderItem = ({ item }: { item: Notification }) => {
    const isUnread = item.status === "unread";
    return (
      <View
        style={[
          styles.notifItem,
          {
            backgroundColor: isUnread ? theme.primary + "08" : theme.card,
            borderColor: theme.cardBorder,
          },
        ]}
      >
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <ThemedText type="bodySm" style={styles.notifTitle} numberOfLines={1}>
              {item.title}
            </ThemedText>
            {isUnread ? (
              <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
            ) : null}
          </View>
          <ThemedText type="small" color={theme.textSecondary} numberOfLines={2}>
            {item.message}
          </ThemedText>
          <ThemedText type="caption" color={theme.textTertiary}>
            {formatDate(item.createdAt)}
          </ThemedText>
        </View>
        <View style={styles.notifActions}>
          {isUnread ? (
            <Pressable onPress={() => completeMutation.mutate(item.id)} style={styles.actionBtn}>
              <Feather name="check" size={16} color={theme.primary} />
            </Pressable>
          ) : null}
          <Pressable onPress={() => dismissMutation.mutate(item.id)} style={styles.actionBtn}>
            <Feather name="x" size={16} color={theme.textSecondary} />
          </Pressable>
          <Pressable onPress={() => deleteMutation.mutate(item.id)} style={styles.actionBtn}>
            <Feather name="trash-2" size={16} color={theme.destructive} />
          </Pressable>
        </View>
      </View>
    );
  };

  if (notificationsQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.filterBar}>
        {filters.map((f) => (
          <Button
            key={f.value}
            title={f.label}
            variant={filterType === f.value ? "default" : "outline"}
            size="sm"
            onPress={() => setFilterType(f.value)}
          />
        ))}
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={notificationsQuery.isRefetching} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="bell" size={48} color={theme.textTertiary} />
            <ThemedText type="bodySm" color={theme.textSecondary}>
              {"No notifications"}
            </ThemedText>
            {filterType !== "all" ? (
              <ThemedText type="small" color={theme.textTertiary}>
                {"Try changing filters"}
              </ThemedText>
            ) : null}
          </View>
        }
      />
    </View>
  );
}

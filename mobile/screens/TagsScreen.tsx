import React from "react";
import {
  View,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { Card, CardContent } from "../components/Card";
import { TagBadge } from "../components/TagBadge";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { api } from "../lib/api-client";
import { queryClient, normalizePaginatedData } from "../lib/query-client";
import { styles } from "./styles/tagsStyles";
import type { PersonalTag, PaginatedResponse } from "../types";

interface TagStats {
  transactionCount: number;
  totalSpent: number;
  totalIncome?: number;
}

export default function TagsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get<PaginatedResponse<PersonalTag>>("/api/tags"),
  });
  const tags = normalizePaginatedData<PersonalTag>(tagsQuery.data);

  const statsQuery = useQuery({
    queryKey: ["tags-stats"],
    queryFn: async () => {
      const statsMap: Record<number, TagStats> = {};
      await Promise.all(
        (tags || []).map(async (tag) => {
          try {
            const res = await api.get<TagStats>(`/api/tags/${tag.id}/stats`);
            statsMap[tag.id] = res;
          } catch {
            statsMap[tag.id] = { transactionCount: 0, totalSpent: 0 };
          }
        })
      );
      return statsMap;
    },
    enabled: tags.length > 0,
  });
  const statsMap = statsQuery.data || {};

  const deleteMutation = useMutation({
    mutationFn: (tagId: number) => api.delete(`/api/tags/${tagId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["tags-stats"] });
    },
    onError: (error: Error) => Alert.alert(t("common.error"), error.message),
  });

  const handleDelete = (tag: PersonalTag) => {
    Alert.alert(t("tags.delete_tag"), t("tags.delete_confirm_message").replace("{name}", tag.name), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: () => deleteMutation.mutate(tag.id) },
    ]);
  };

  if (tagsQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const renderTag = ({ item: tag }: { item: PersonalTag }) => {
    const stats = statsMap[tag.id] || { transactionCount: 0, totalSpent: 0 };
    return (
      <Card style={styles.tagCard}>
        <CardContent style={styles.tagCardContent}>
          <Pressable onPress={() => navigation.navigate("TagDetail", { tagId: tag.id })} style={styles.tagInfoRow}>
            <TagBadge tag={tag} />
            <ThemedText type="small" color={theme.textSecondary}>
              {stats.transactionCount} {t("tags.stats_transactions_label")}{stats.totalSpent > 0 ? ` · $${stats.totalSpent.toFixed(0)} ${t("tags.stats_spent_label")}` : ""}
            </ThemedText>
          </Pressable>
          {!tag.isDefault ? (
            <View style={styles.tagActions}>
              <Pressable onPress={() => navigation.navigate("AddEditTag", { tag })} style={[styles.actionBtn, { backgroundColor: theme.secondary }]}>
                <Feather name="edit-2" size={14} color={theme.text} />
              </Pressable>
              <Pressable onPress={() => handleDelete(tag)} style={[styles.actionBtn, { backgroundColor: theme.destructive + "15" }]}>
                <Feather name="trash-2" size={14} color={theme.destructive} />
              </Pressable>
            </View>
          ) : (
            <View style={[styles.defaultBadge, { backgroundColor: theme.muted }]}>
              <Feather name="lock" size={10} color={theme.textSecondary} />
              <ThemedText type="small" color={theme.textSecondary}>{t("tags.default")}</ThemedText>
            </View>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <FlatList
      data={tags}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderTag}
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={tagsQuery.isRefetching} onRefresh={() => { tagsQuery.refetch(); statsQuery.refetch(); }} />}
      ListHeaderComponent={
        <View style={styles.headerSection}>
          <View style={styles.pageHeader}>
            <View>
              <ThemedText type="h2">{t("tags.title")}</ThemedText>
              <ThemedText type="bodySm" color={theme.textSecondary}>{t("tags.manage")}</ThemedText>
            </View>
            <Button title={t("tags.add_tag")} size="sm" onPress={() => navigation.navigate("AddEditTag", { tag: undefined })} icon={<Feather name="plus" size={14} color={theme.primaryForeground} />} />
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Feather name="tag" size={48} color={theme.textTertiary} />
          <ThemedText type="body" color={theme.textSecondary} style={styles.emptyText}>{t("tags.no_tags")}</ThemedText>
          <ThemedText type="bodySm" color={theme.textTertiary}>{t("tags.manage")}</ThemedText>
          <Button title={t("tags.add_tag")} onPress={() => navigation.navigate("AddEditTag", { tag: undefined })} icon={<Feather name="plus" size={14} color={theme.primaryForeground} />} style={styles.emptyBtn} />
        </View>
      }
    />
  );
}

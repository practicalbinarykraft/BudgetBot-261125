import React from "react";
import {
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { Card, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { getDateLocale } from "../lib/date-locale";
import { api } from "../lib/api-client";
import { queryClient, normalizePaginatedData } from "../lib/query-client";
import type { Recurring, PaginatedResponse } from "../types";
import { styles } from "./RecurringScreen.styles";

const FREQUENCY_KEYS: Record<string, string> = {
  daily: "recurring.frequency_daily",
  weekly: "recurring.frequency_weekly",
  monthly: "recurring.frequency_monthly",
  quarterly: "recurring.frequency_quarterly",
  yearly: "recurring.frequency_yearly",
};

export default function RecurringScreen() {
  const { theme } = useTheme();
  const { t, language } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const recurringQuery = useQuery({
    queryKey: ["recurring"],
    queryFn: () => api.get<PaginatedResponse<Recurring>>("/api/recurring"),
  });

  const recurring = normalizePaginatedData<Recurring>(recurringQuery.data);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/recurring/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
    },
    onError: (error: Error) => {
      Alert.alert(t("common.error"), error.message);
    },
  });

  const handleDelete = (item: Recurring) => {
    Alert.alert(t("common.delete"), t("recurring.delete_confirm").replace("{name}", item.description), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: () => deleteMutation.mutate(item.id) },
    ]);
  };

  if (recurringQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const formatNextDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(getDateLocale(language), { day: "numeric", month: "short", year: "numeric" });
  };

  const renderItem = ({ item }: { item: Recurring }) => {
    const isIncome = item.type === "income";

    return (
      <Card style={styles.card}>
        <CardContent style={styles.cardContent}>
          {/* Left: description + badges + next date */}
          <View style={styles.cardLeft}>
            <ThemedText type="bodySm" style={styles.description}>
              {item.description}
            </ThemedText>
            <View style={styles.metaRow}>
              <Badge label={t(FREQUENCY_KEYS[item.frequency] || item.frequency)} variant="secondary" />
              {item.category ? (
                <Badge label={item.category} variant="outline" />
              ) : null}
              <ThemedText type="small" color={theme.textSecondary}>
                {t("recurring.next") + " " + formatNextDate(item.nextDate)}
              </ThemedText>
            </View>
          </View>

          {/* Right: amount + delete */}
          <View style={styles.cardRight}>
            <ThemedText
              type="bodySm"
              mono
              color={isIncome ? theme.income : theme.expense}
              style={styles.amount}
            >
              {isIncome ? "+" : "-"}${item.amount}
            </ThemedText>
            <Pressable
              onPress={() => handleDelete(item)}
              style={[styles.deleteBtn, { backgroundColor: theme.destructive + "15" }]}
            >
              <Feather name="trash-2" size={14} color={theme.destructive} />
            </Pressable>
          </View>
        </CardContent>
      </Card>
    );
  };

  return (
    <FlatList
      data={recurring}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={recurringQuery.isRefetching}
          onRefresh={() => recurringQuery.refetch()}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ThemedText type="h2">{t("recurring.title")}</ThemedText>
            <ThemedText type="bodySm" color={theme.textSecondary}>
              {t("recurring.manage")}
            </ThemedText>
          </View>
          <Button
            title={t("recurring.add")}
            size="sm"
            onPress={() => navigation.navigate("AddRecurring")}
            icon={<Feather name="plus" size={14} color={theme.primaryForeground} />}
          />
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Feather name="repeat" size={48} color={theme.textTertiary} />
          <ThemedText type="body" color={theme.textSecondary} style={styles.emptyTitle}>
            {t("recurring.no_recurring")}
          </ThemedText>
          <ThemedText type="bodySm" color={theme.textTertiary}>
            {t("recurring.manage")}
          </ThemedText>
          <Button
            title={t("recurring.add")}
            onPress={() => navigation.navigate("AddRecurring")}
            icon={<Feather name="plus" size={14} color={theme.primaryForeground} />}
            style={styles.emptyBtn}
          />
        </View>
      }
    />
  );
}


import React from "react";
import {
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { Card, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { usePlannedIncomeScreen, type TabFilter } from "../hooks/usePlannedIncomeScreen";
import { styles } from "./styles/plannedIncomeStyles";
import type { PlannedIncome } from "../types";

export default function PlannedIncomeScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const statusBadge = (status: string) => {
    if (status === "received") return <Badge label={t("planned_income.status_received")} variant="default" />;
    if (status === "cancelled") return <Badge label={t("planned.status.cancelled")} variant="outline" />;
    return <Badge label={t("planned_income.status_pending")} variant="secondary" />;
  };
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const {
    tab, setTab, incomeQuery, allItems, filtered,
    receiveMutation, cancelMutation, handleDelete, formatDate,
  } = usePlannedIncomeScreen();

  if (incomeQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const renderItem = ({ item }: { item: PlannedIncome }) => (
    <Card style={styles.card}>
      <CardContent style={styles.cardInner}>
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <ThemedText type="bodySm" style={styles.itemName}>{item.description}</ThemedText>
            <ThemedText type="h3" mono color={theme.income} style={styles.itemAmount}>
              +${item.amount}
            </ThemedText>
          </View>
          {statusBadge(item.status)}
        </View>
        <View style={styles.metaRow}>
          <Feather name="calendar" size={12} color={theme.textSecondary} />
          <ThemedText type="small" color={theme.textSecondary}>
            {formatDate(item.expectedDate)}
          </ThemedText>
          {item.currency && item.currency !== "USD" ? (
            <Badge label={item.currency} variant="outline" />
          ) : null}
        </View>
        {item.status === "pending" ? (
          <View style={styles.actionsRow}>
            <Button title={t("planned_income.receive")} size="sm" onPress={() => receiveMutation.mutate(item.id)} style={styles.actionBtn} />
            <Button title={t("common.cancel")} variant="outline" size="sm" onPress={() => cancelMutation.mutate(item.id)} style={styles.actionBtn} />
            <Pressable onPress={() => handleDelete(item)} style={[styles.deleteBtn, { backgroundColor: theme.destructive + "15" }]}>
              <Feather name="trash-2" size={14} color={theme.destructive} />
            </Pressable>
          </View>
        ) : null}
      </CardContent>
    </Card>
  );

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={incomeQuery.isRefetching} onRefresh={() => incomeQuery.refetch()} />
      }
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <ThemedText type="h2">{t("planned_income.title")}</ThemedText>
              <ThemedText type="bodySm" color={theme.textSecondary}>{t("planned_income.manage")}</ThemedText>
            </View>
            <Button title={t("common.add")} size="sm" onPress={() => navigation.navigate("AddPlannedIncome")} icon={<Feather name="plus" size={14} color={theme.primaryForeground} />} />
          </View>
          <View style={styles.tabsRow}>
            {(["all", "pending", "received", "cancelled"] as TabFilter[]).map((f) => {
              const isActive = tab === f;
              const count = f === "all" ? allItems.length : allItems.filter((i) => i.status === f).length;
              return (
                <Pressable key={f} onPress={() => setTab(f)} style={[styles.tabBtn, { backgroundColor: isActive ? theme.primary : theme.secondary, borderColor: isActive ? theme.primary : theme.border }]}>
                  <ThemedText type="small" color={isActive ? "#ffffff" : theme.text}>
                    {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Feather name="dollar-sign" size={48} color={theme.textTertiary} />
          <ThemedText type="body" color={theme.textSecondary} style={styles.emptyTitle}>{t("planned_income.no_planned_income")}</ThemedText>
          <ThemedText type="bodySm" color={theme.textTertiary}>{t("planned_income.add_expected_income")}</ThemedText>
        </View>
      }
    />
  );
}

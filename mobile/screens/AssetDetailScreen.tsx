import React from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { Card, CardHeader, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useAssetDetailScreen } from "../hooks/useAssetDetailScreen";
import { AssetValueCard } from "../components/asset-detail/AssetValueCard";
import { CashflowCard } from "../components/asset-detail/CashflowCard";
import { ValuationHistory } from "../components/asset-detail/ValuationHistory";
import { CalibrateModal } from "../components/asset-detail/CalibrateModal";

export default function AssetDetailScreen() {
  const { theme } = useTheme();
  const {
    detailQuery,
    showCalibrate,
    setShowCalibrate,
    calibrateValue,
    setCalibrateValue,
    calibrateNotes,
    setCalibrateNotes,
    calibrateMutation,
    handleDelete,
    handleCalibrate,
    formatDate,
  } = useAssetDetailScreen();

  if (detailQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const data = detailQuery.data;
  if (!data) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Feather name="alert-circle" size={48} color={theme.textTertiary} />
        <ThemedText type="body" color={theme.textSecondary}>
          {"Asset not found"}
        </ThemedText>
      </View>
    );
  }

  const { asset, valuations, change } = data;
  const isAsset = asset.type === "asset";
  const value = parseFloat(asset.currentValue);
  const monthlyIncome = parseFloat(asset.monthlyIncome || "0");
  const monthlyExpense = parseFloat(asset.monthlyExpense || "0");
  const hasCashflow = monthlyIncome > 0 || monthlyExpense > 0;

  return (
    <>
      <ScrollView
        style={[styles.flex, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <ThemedText type="h2">{asset.name}</ThemedText>
            <Badge
              label={isAsset ? "Asset" : "Liability"}
              variant={isAsset ? "default" : "destructive"}
            />
            {asset.location ? (
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={12} color={theme.textSecondary} />
                <ThemedText type="small" color={theme.textSecondary}>
                  {asset.location}
                </ThemedText>
              </View>
            ) : null}
          </View>
          <Button
            title="Delete"
            variant="destructive"
            size="sm"
            onPress={handleDelete}
          />
        </View>

        <AssetValueCard
          value={value}
          isAsset={isAsset}
          change={change}
          onCalibrate={() => setShowCalibrate(true)}
        />

        {hasCashflow ? (
          <CashflowCard
            monthlyIncome={monthlyIncome}
            monthlyExpense={monthlyExpense}
          />
        ) : null}

        {asset.notes ? (
          <Card>
            <CardHeader>
              <ThemedText type="h4" style={styles.bold}>
                {"Notes"}
              </ThemedText>
            </CardHeader>
            <CardContent>
              <ThemedText type="bodySm" color={theme.textSecondary}>
                {asset.notes}
              </ThemedText>
            </CardContent>
          </Card>
        ) : null}

        <ValuationHistory valuations={valuations} formatDate={formatDate} />
      </ScrollView>

      <CalibrateModal
        visible={showCalibrate}
        onClose={() => setShowCalibrate(false)}
        calibrateValue={calibrateValue}
        onChangeValue={setCalibrateValue}
        calibrateNotes={calibrateNotes}
        onChangeNotes={setCalibrateNotes}
        isPending={calibrateMutation.isPending}
        onSubmit={handleCalibrate}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing["5xl"],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  headerInfo: { flex: 1, gap: Spacing.sm },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  bold: { fontWeight: "600" },
});

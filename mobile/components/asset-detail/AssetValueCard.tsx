import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import { Button } from "../Button";
import { Card, CardContent } from "../Card";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

interface ChangeData {
  changeAmount: number;
  changePercent: number;
  ownershipYears: number;
}

interface AssetValueCardProps {
  value: number;
  isAsset: boolean;
  change: ChangeData | null;
  onCalibrate: () => void;
}

export function AssetValueCard({ value, isAsset, change, onCalibrate }: AssetValueCardProps) {
  const { theme } = useTheme();

  return (
    <Card
      style={[
        { borderLeftWidth: 4 },
        { borderLeftColor: isAsset ? "#10b981" : theme.destructive },
      ]}
    >
      <CardContent style={styles.valueContent}>
        <ThemedText type="small" color={theme.textSecondary}>
          {"Current Value"}
        </ThemedText>
        <ThemedText
          type="h1"
          mono
          color={isAsset ? "#10b981" : theme.destructive}
        >
          {"$"}
          {value.toFixed(2)}
        </ThemedText>
        {change ? (
          <View style={styles.changeStats}>
            <View style={styles.changeStat}>
              <ThemedText type="small" color={theme.textSecondary}>
                {"Change"}
              </ThemedText>
              <ThemedText
                type="bodySm"
                mono
                color={
                  change.changePercent >= 0 ? "#10b981" : theme.destructive
                }
              >
                {change.changePercent >= 0 ? "+" : ""}
                {change.changePercent.toFixed(1)}
                {"%"}
              </ThemedText>
            </View>
            <View style={styles.changeStat}>
              <ThemedText type="small" color={theme.textSecondary}>
                {"Ownership"}
              </ThemedText>
              <ThemedText type="bodySm">
                {change.ownershipYears.toFixed(1)}
                {" years"}
              </ThemedText>
            </View>
          </View>
        ) : null}
        <Button
          title="Calibrate Price"
          variant="outline"
          size="sm"
          onPress={onCalibrate}
        />
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  valueContent: { gap: Spacing.sm },
  changeStats: {
    flexDirection: "row",
    gap: Spacing["3xl"],
  },
  changeStat: { gap: 2 },
});

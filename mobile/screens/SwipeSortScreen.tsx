import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "../components/ThemedText";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { useSwipeSortScreen } from "../hooks/useSwipeSortScreen";
import { AllSortedView } from "../components/swipe-sort/AllSortedView";
import { SwipeSortHeader } from "../components/swipe-sort/SwipeSortHeader";
import { SwipeCard } from "../components/swipe-sort/SwipeCard";

export default function SwipeSortScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const {
    pan,
    panResponder,
    stats,
    sessionPoints,
    currentTx,
    catLabel,
    remainingCount,
    progressPercent,
    isLoading,
    handleFinish,
    navigation,
  } = useSwipeSortScreen();

  if (!currentTx && !isLoading) {
    return <AllSortedView onGoBack={() => navigation.goBack()} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SwipeSortHeader
        sessionPoints={sessionPoints}
        stats={stats}
        remainingCount={remainingCount}
        progressPercent={progressPercent}
        onFinish={handleFinish}
      />

      <View style={styles.labelsContainer}>
        <ThemedText type="small" color="#22c55e" style={styles.dirLabel}>
          {"← " + t("analytics.type.essential")}
        </ThemedText>
        <ThemedText type="small" color={theme.primary} style={styles.dirLabel}>
          {"↑ " + t("common.asset")}
        </ThemedText>
        <ThemedText type="small" color="#f59e0b" style={styles.dirLabel}>
          {t("analytics.type.discretionary") + " →"}
        </ThemedText>
      </View>

      <View style={styles.deckContainer}>
        {currentTx ? (
          <SwipeCard
            transaction={currentTx}
            catLabel={catLabel}
            pan={pan}
            panResponder={panResponder}
          />
        ) : null}
      </View>

      <ThemedText
        type="small"
        color={theme.textTertiary}
        style={styles.dirLabelBottom}
      >
        {"↓ " + t("common.liability")}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.lg },
  labelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  dirLabel: { fontWeight: "500" },
  dirLabelBottom: {
    textAlign: "center",
    fontWeight: "500",
    marginTop: Spacing.sm,
  },
  deckContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

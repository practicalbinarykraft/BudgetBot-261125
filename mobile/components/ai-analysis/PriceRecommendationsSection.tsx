import React from "react";
import { View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { UseQueryResult } from "@tanstack/react-query";
import { ThemedText } from "../ThemedText";
import { Card, CardHeader, CardContent } from "../Card";
import { Badge } from "../Badge";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import type { PriceRecommendationsResponse } from "../../types";

interface PriceRecommendationsSectionProps {
  showRecommendations: boolean;
  setShowRecommendations: (val: boolean) => void;
  recQuery: UseQueryResult<PriceRecommendationsResponse>;
}

export function PriceRecommendationsSection({
  showRecommendations,
  setShowRecommendations,
  recQuery,
}: PriceRecommendationsSectionProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const recs = recQuery.data;

  return (
    <>
      <Pressable
        onPress={() => setShowRecommendations(!showRecommendations)}
        style={[styles.accordionHeader, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
      >
        <ThemedText type="body" style={styles.bold}>
          {t("ai.price_recommendations")}
        </ThemedText>
        <Feather
          name={showRecommendations ? "chevron-up" : "chevron-down"}
          size={18}
          color={theme.textSecondary}
        />
      </Pressable>

      {showRecommendations ? (
        recQuery.isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : recs && recs.recommendations && recs.recommendations.length > 0 ? (
          <>
            <Card>
              <CardHeader>
                <View style={styles.cardTitleRow}>
                  <Feather name="dollar-sign" size={18} color={theme.text} />
                  <ThemedText type="h4" style={styles.bold}>{t("ai.savings_overview")}</ThemedText>
                </View>
              </CardHeader>
              <CardContent style={styles.savingsGrid}>
                <View style={styles.savingsStat}>
                  <ThemedText type="small" color={theme.textSecondary}>{t("ai.total_potential_savings")}</ThemedText>
                  <ThemedText type="h3" mono style={styles.bold}>{"$"}{recs.totalPotentialSavings.toFixed(2)}</ThemedText>
                </View>
                <View style={styles.savingsStat}>
                  <ThemedText type="small" color={theme.textSecondary}>{t("ai.average_savings")}</ThemedText>
                  <ThemedText type="h3" mono style={styles.bold}>{recs.averageSavingsPercent.toFixed(1)}{"%"}</ThemedText>
                </View>
              </CardContent>
            </Card>

            {recs.aiInsights ? (
              <Card style={[{ borderColor: theme.primary + "33" }, { backgroundColor: theme.primary + "08" }]}>
                <CardHeader>
                  <ThemedText type="bodySm" style={styles.bold}>{t("ai.shopping_tips")}</ThemedText>
                </CardHeader>
                <CardContent>
                  <ThemedText type="bodySm">{recs.aiInsights}</ThemedText>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <View style={styles.cardTitleRow}>
                  <Feather name="trending-down" size={18} color={theme.text} />
                  <ThemedText type="h4" style={styles.bold}>{t("ai.price_recommendations")}</ThemedText>
                </View>
                <ThemedText type="small" color={theme.textSecondary}>
                  {t("ai.found_better_prices").replace("{count}", String(recs.recommendations.length))}
                </ThemedText>
              </CardHeader>
              <CardContent style={styles.recList}>
                {recs.recommendations.map((rec, index) => (
                  <View key={index} style={[styles.recItem, { borderColor: theme.border }]}>
                    <View style={styles.recLeft}>
                      <ThemedText type="bodySm" style={styles.bold}>{rec.itemName}</ThemedText>
                      <View style={styles.recMerchantRow}>
                        <Feather name="shopping-bag" size={12} color={theme.textSecondary} />
                        <ThemedText type="small" color={theme.textSecondary}>{rec.currentMerchant}</ThemedText>
                        <ThemedText type="small">{"$"}{rec.currentPrice.toFixed(2)}</ThemedText>
                      </View>
                    </View>
                    <View style={styles.recRight}>
                      <Badge label={`Save $${rec.savings.toFixed(2)} (${rec.savingsPercent.toFixed(1)}%)`} variant="default" />
                      <View style={styles.recBestRow}>
                        <Feather name="shopping-bag" size={12} color={theme.textSecondary} />
                        <ThemedText type="small" color={theme.textSecondary}>{rec.bestMerchant}</ThemedText>
                      </View>
                      <ThemedText type="small" color={theme.textSecondary}>{"$"}{rec.bestPrice.toFixed(2)}</ThemedText>
                    </View>
                  </View>
                ))}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent>
              <ThemedText type="bodySm" color={theme.textSecondary} style={styles.centered}>
                {t("ai.no_price_data")}
              </ThemedText>
            </CardContent>
          </Card>
        )
      ) : null}
    </>
  );
}

const S = Spacing;
const styles = StyleSheet.create({
  bold: { fontWeight: "600" },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: S.sm },
  accordionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: S.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  loadingBox: { padding: S.xl, alignItems: "center" },
  savingsGrid: { flexDirection: "row", gap: S.lg },
  savingsStat: { flex: 1, gap: S.xs },
  recList: { gap: S.md },
  recItem: { padding: S.md, borderWidth: 1, borderRadius: BorderRadius.md, gap: S.sm },
  recLeft: { gap: S.xs },
  recRight: { gap: S.xs, alignItems: "flex-start" },
  recMerchantRow: { flexDirection: "row", alignItems: "center", gap: S.xs },
  recBestRow: { flexDirection: "row", alignItems: "center", gap: S.xs },
  centered: { textAlign: "center", paddingVertical: S.xl },
});

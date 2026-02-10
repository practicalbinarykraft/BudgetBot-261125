import React from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ThemedText } from "../components/ThemedText";
import { Badge } from "../components/Badge";
import { Card, CardContent } from "../components/Card";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { api } from "../lib/api-client";
import type { CreditsData, PricingData } from "../types";
import { styles } from "./BillingScreen.styles";

export default function BillingScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const creditsQuery = useQuery({
    queryKey: ["credits"],
    queryFn: () => api.get<CreditsData>("/api/credits"),
  });

  const pricingQuery = useQuery({
    queryKey: ["credits-pricing"],
    queryFn: () => api.get<PricingData>("/api/credits/pricing"),
  });

  if (creditsQuery.isLoading || pricingQuery.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const credits = creditsQuery.data;
  const pricing = pricingQuery.data;
  const isByok = credits?.billingMode === "byok";
  const isLowBalance =
    !isByok && credits && credits.messagesRemaining < 5;

  const modeLabel =
    credits?.billingMode === "byok"
      ? "BYOK"
      : credits?.billingMode === "paid"
        ? "Paid"
        : "Free";

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Feather name="zap" size={24} color={theme.primary} />
        <View style={styles.headerText}>
          <ThemedText type="h2">{t("billing.title")}</ThemedText>
          <ThemedText type="bodySm" color={theme.textSecondary}>
            {isByok
              ? "∞ Unlimited"
              : `${credits?.messagesRemaining ?? 0} credits remaining`}
          </ThemedText>
        </View>
      </View>

      {/* Balance Card */}
      <Card>
        <CardContent style={styles.balanceContent}>
          <ThemedText type="bodySm" color={theme.textSecondary}>
            {"Your Balance"}
          </ThemedText>
          <ThemedText type="h1" mono style={styles.balanceAmount}>
            {isByok ? "∞" : String(credits?.messagesRemaining ?? 0)}
          </ThemedText>
          {!isByok ? (
            <View style={styles.balanceStats}>
              <View style={styles.balanceStat}>
                <ThemedText type="small" color={theme.textSecondary}>
                  {"Total Granted"}
                </ThemedText>
                <ThemedText type="bodySm" style={styles.bold}>
                  {String(credits?.totalGranted ?? 0)}
                </ThemedText>
              </View>
              <View style={styles.balanceStat}>
                <ThemedText type="small" color={theme.textSecondary}>
                  {"Total Used"}
                </ThemedText>
                <ThemedText type="bodySm" style={styles.bold}>
                  {String(credits?.totalUsed ?? 0)}
                </ThemedText>
              </View>
            </View>
          ) : null}
          <Badge label={modeLabel} variant={isByok ? "default" : "secondary"} />
          {isLowBalance ? (
            <View
              style={[
                styles.lowBalanceAlert,
                { backgroundColor: "#f59e0b" + "15", borderColor: "#f59e0b" },
              ]}
            >
              <Feather name="alert-triangle" size={14} color="#f59e0b" />
              <ThemedText type="small" color="#f59e0b">
                {"Low balance! Consider upgrading your plan."}
              </ThemedText>
            </View>
          ) : null}
        </CardContent>
      </Card>

      {/* Operation Pricing */}
      {pricing?.operations ? (
        <>
          <ThemedText type="h4" style={styles.sectionTitle}>
            {"What Costs Credits"}
          </ThemedText>
          <View style={styles.opsGrid}>
            {Object.entries(pricing.operations).map(([key, op]) => (
              <Card key={key} style={styles.opCard}>
                <CardContent style={styles.opContent}>
                  <ThemedText style={styles.opIcon}>{op.icon}</ThemedText>
                  <ThemedText type="bodySm" style={styles.bold}>
                    {op.name}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    color={theme.textSecondary}
                    numberOfLines={2}
                  >
                    {op.example}
                  </ThemedText>
                  <Badge
                    label={`${op.credits} credit${op.credits !== 1 ? "s" : ""}`}
                    variant="secondary"
                  />
                </CardContent>
              </Card>
            ))}
          </View>
        </>
      ) : null}

      {/* Pricing Tiers */}
      {pricing?.tiers ? (
        <>
          <ThemedText type="h4" style={styles.sectionTitle}>
            {"Pricing Plans"}
          </ThemedText>
          {pricing.tiers
            .filter((t) => t.id !== "byok")
            .map((tier) => (
              <Card key={tier.id} style={styles.tierCard}>
                <CardContent style={styles.tierContent}>
                  <ThemedText type="h4" style={styles.bold}>
                    {tier.name}
                  </ThemedText>
                  <View style={styles.tierPriceRow}>
                    <ThemedText type="h2" mono>
                      {tier.price === 0 ? "Free" : `$${tier.price}`}
                    </ThemedText>
                    {tier.priceMonthly > 0 ? (
                      <ThemedText type="small" color={theme.textSecondary}>
                        {" / month"}
                      </ThemedText>
                    ) : null}
                  </View>
                  {tier.credits ? (
                    <ThemedText type="bodySm" color={theme.textSecondary}>
                      {tier.credits}
                      {" credits per month"}
                    </ThemedText>
                  ) : null}
                  <View style={styles.featureList}>
                    {tier.features.map((f, i) => (
                      <View key={i} style={styles.featureRow}>
                        <Feather
                          name="check"
                          size={14}
                          color={theme.primary}
                        />
                        <ThemedText type="small" style={styles.featureText}>
                          {f}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                </CardContent>
              </Card>
            ))}
        </>
      ) : null}
    </ScrollView>
  );
}

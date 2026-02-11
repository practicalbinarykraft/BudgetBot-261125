import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { Card, CardHeader, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { FinancialHealthCard } from "../components/ai-analysis/FinancialHealthCard";
import { PriceRecommendationsSection } from "../components/ai-analysis/PriceRecommendationsSection";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { useAIAnalysisScreen } from "../hooks/useAIAnalysisScreen";

export default function AIAnalysisScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const {
    analysis,
    isAnalyzing,
    showRecommendations,
    setShowRecommendations,
    healthQuery,
    recQuery,
    handleAnalyze,
    getScoreColor,
  } = useAIAnalysisScreen();

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headerRow}>
        <View>
          <ThemedText type="h3" style={styles.bold}>{t("ai.analysis_title")}</ThemedText>
          <ThemedText type="small" color={theme.textSecondary}>{t("ai.analysis_subtitle")}</ThemedText>
        </View>
      </View>

      <Card>
        <CardHeader>
          <View style={styles.cardTitleRow}>
            <Feather name="zap" size={18} color={theme.primary} />
            <ThemedText type="h4" style={styles.bold}>{t("ai.spending_analysis")}</ThemedText>
          </View>
        </CardHeader>
        <CardContent>
          <Button
            title={isAnalyzing ? t("ai.analyzing") : t("ai.analyze_spending")}
            onPress={handleAnalyze}
            disabled={isAnalyzing}
            loading={isAnalyzing}
          />
        </CardContent>
      </Card>

      {analysis ? (
        <Card>
          <CardHeader>
            <ThemedText type="h4" style={styles.bold}>{t("ai.insights")}</ThemedText>
          </CardHeader>
          <CardContent style={styles.analysisContent}>
            <ThemedText type="bodySm" style={styles.analysisText}>{analysis}</ThemedText>
            <View style={styles.badgeRow}>
              <Badge label={t("ai.powered_by_claude")} variant="secondary" />
            </View>
          </CardContent>
        </Card>
      ) : null}

      <FinancialHealthCard healthQuery={healthQuery} getScoreColor={getScoreColor} />

      <Card>
        <CardHeader>
          <View style={styles.cardTitleRow}>
            <Feather name="camera" size={18} color={theme.text} />
            <ThemedText type="h4" style={styles.bold}>{t("receipts.title")}</ThemedText>
          </View>
        </CardHeader>
        <CardContent>
          <ThemedText type="small" color={theme.textSecondary} style={styles.cardDescription}>
            {t("receipts.description")}
          </ThemedText>
          <Button
            title={t("receipts.scan")}
            variant="outline"
            onPress={() => navigation.navigate("ReceiptScanner")}
            icon={<Feather name="camera" size={16} color={theme.text} />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <View style={styles.cardTitleRow}>
            <Feather name="message-circle" size={18} color={theme.primary} />
            <ThemedText type="h4" style={styles.bold}>{t("ai.financial_advisor")}</ThemedText>
          </View>
        </CardHeader>
        <CardContent>
          <ThemedText type="small" color={theme.textSecondary} style={styles.cardDescription}>
            {t("ai.advisor_description")}
          </ThemedText>
          <Button
            title={t("ai.open_chat")}
            variant="outline"
            onPress={() => navigation.navigate("AIChat")}
            icon={<Feather name="message-circle" size={16} color={theme.text} />}
          />
        </CardContent>
      </Card>

      <PriceRecommendationsSection
        showRecommendations={showRecommendations}
        setShowRecommendations={setShowRecommendations}
        recQuery={recQuery}
      />
    </ScrollView>
  );
}

const S = Spacing;
const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: S.lg, paddingTop: S.xl, gap: S.lg, paddingBottom: S["5xl"] },
  headerRow: { gap: S.sm },
  bold: { fontWeight: "600" },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: S.sm },
  cardDescription: { marginBottom: S.md },
  analysisContent: { gap: S.md },
  analysisText: { lineHeight: 22 },
  badgeRow: { flexDirection: "row", gap: S.sm },
});

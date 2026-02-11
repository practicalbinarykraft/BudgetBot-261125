import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Button } from "../Button";
import { Card, CardHeader, CardContent } from "../Card";
import { Badge } from "../Badge";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import type { VoiceParsedResult } from "../../types";

interface VoiceResultCardProps {
  result: VoiceParsedResult;
  onCreateTransaction: () => void;
}

export function VoiceResultCard({ result, onCreateTransaction }: VoiceResultCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      {/* Transcription */}
      <Card>
        <CardHeader>
          <ThemedText type="h4" style={styles.bold}>
            {t("voice_input.transcription")}
          </ThemedText>
        </CardHeader>
        <CardContent>
          <ThemedText type="bodySm" style={styles.transcription}>
            {result.transcription}
          </ThemedText>
        </CardContent>
      </Card>

      {/* Parsed Result */}
      <Card>
        <CardHeader>
          <View style={styles.parsedHeader}>
            <ThemedText type="h4" style={styles.bold}>
              {t("voice_input.parsed_transaction")}
            </ThemedText>
            <Badge
              label={result.parsed.confidence}
              variant={
                result.parsed.confidence === "high"
                  ? "default"
                  : result.parsed.confidence === "medium"
                    ? "secondary"
                    : "outline"
              }
            />
          </View>
        </CardHeader>
        <CardContent style={styles.parsedContent}>
          <View style={styles.parsedRow}>
            <ThemedText type="small" color={theme.textSecondary}>
              {t("common.type")}
            </ThemedText>
            <Badge
              label={result.parsed.type}
              variant={
                result.parsed.type === "income" ? "default" : "destructive"
              }
            />
          </View>
          <View style={styles.parsedRow}>
            <ThemedText type="small" color={theme.textSecondary}>
              {t("common.amount")}
            </ThemedText>
            <ThemedText type="body" mono style={styles.bold}>
              {result.parsed.amount}
              {" "}
              {result.parsed.currency}
            </ThemedText>
          </View>
          <View style={styles.parsedRow}>
            <ThemedText type="small" color={theme.textSecondary}>
              {t("common.description")}
            </ThemedText>
            <ThemedText type="bodySm">
              {result.parsed.description}
            </ThemedText>
          </View>
          {result.parsed.category ? (
            <View style={styles.parsedRow}>
              <ThemedText type="small" color={theme.textSecondary}>
                {t("common.category")}
              </ThemedText>
              <ThemedText type="bodySm">
                {result.parsed.category}
              </ThemedText>
            </View>
          ) : null}
        </CardContent>
      </Card>

      {/* Create Transaction Button */}
      <Button
        title={t("voice_input.create_transaction")}
        onPress={onCreateTransaction}
        icon={<Feather name="plus" size={16} color="#ffffff" />}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: "600" },
  transcription: { lineHeight: 22, fontStyle: "italic" },
  parsedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  parsedContent: { gap: Spacing.md },
  parsedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

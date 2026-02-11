import React from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Input } from "../Input";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { exchangeRateFields } from "./profileConstants";
import type { ExchangeRateKey } from "./profileConstants";
import { styles } from "./profileStyles";

interface ApiKeysAndRatesSectionProps {
  isMyselfTier: boolean;
  anthropicApiKey: string;
  setAnthropicApiKey: (v: string) => void;
  openaiApiKey: string;
  setOpenaiApiKey: (v: string) => void;
  exchangeRates: Record<ExchangeRateKey, string>;
  updateExchangeRate: (key: ExchangeRateKey, value: string) => void;
  exchangeRatesUpdatedAt: string | null | undefined;
}

export default function ApiKeysAndRatesSection({
  isMyselfTier,
  anthropicApiKey,
  setAnthropicApiKey,
  openaiApiKey,
  setOpenaiApiKey,
  exchangeRates,
  updateExchangeRate,
  exchangeRatesUpdatedAt,
}: ApiKeysAndRatesSectionProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      {/* API Keys */}
      <View style={[styles.separator, { backgroundColor: theme.border }]} />
      <ThemedText type="bodySm" style={styles.sectionTitle}>
        {t("settings.api_keys")}
      </ThemedText>
      {!isMyselfTier ? (
        <View
          style={[styles.tierAlert, {
            backgroundColor: theme.secondary,
            borderColor: theme.border,
          }]}
        >
          <Feather name="info" size={14} color={theme.textSecondary} />
          <ThemedText type="small" color={theme.textSecondary} style={styles.tierAlertText}>
            {t("settings.api_keys_tier_required")}
          </ThemedText>
        </View>
      ) : (
        <>
          <Input
            label={t("settings.anthropic_api_key")}
            value={anthropicApiKey}
            onChangeText={setAnthropicApiKey}
            placeholder="sk-ant-..."
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            description={t("settings.anthropic_api_key_desc")}
          />
          <Input
            label={t("settings.openai_api_key")}
            value={openaiApiKey}
            onChangeText={setOpenaiApiKey}
            placeholder="sk-..."
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            description={t("settings.openai_api_key_desc")}
          />
        </>
      )}

      {/* Exchange Rates */}
      <View style={[styles.separator, { backgroundColor: theme.border }]} />
      <ThemedText type="bodySm" style={styles.sectionTitle}>
        {t("settings.exchange_rates")}
      </ThemedText>
      <ThemedText type="small" color={theme.textSecondary}>
        {t("settings.exchange_rates_desc")}
      </ThemedText>
      {exchangeRateFields.map((f) => (
        <Input
          key={f.key}
          label={f.label}
          value={exchangeRates[f.key]}
          onChangeText={(v: string) => updateExchangeRate(f.key, v)}
          placeholder={f.placeholder}
          keyboardType="decimal-pad"
        />
      ))}
      {exchangeRatesUpdatedAt ? (
        <ThemedText type="small" color={theme.textTertiary}>
          {t("settings.last_updated")}
          {new Date(exchangeRatesUpdatedAt).toLocaleString()}
        </ThemedText>
      ) : null}
    </>
  );
}

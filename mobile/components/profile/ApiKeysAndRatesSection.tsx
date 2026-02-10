import React from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Input } from "../Input";
import { useTheme } from "../../hooks/useTheme";
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

  return (
    <>
      {/* API Keys */}
      <View style={[styles.separator, { backgroundColor: theme.border }]} />
      <ThemedText type="bodySm" style={styles.sectionTitle}>
        {"API Keys"}
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
            {"API keys require the 'myself' tier. Upgrade in Billing."}
          </ThemedText>
        </View>
      ) : (
        <>
          <Input
            label="Anthropic API Key"
            value={anthropicApiKey}
            onChangeText={setAnthropicApiKey}
            placeholder="sk-ant-..."
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            description="Your Anthropic API key for AI features"
          />
          <Input
            label="OpenAI API Key"
            value={openaiApiKey}
            onChangeText={setOpenaiApiKey}
            placeholder="sk-..."
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            description="Your OpenAI API key for AI features"
          />
        </>
      )}

      {/* Exchange Rates */}
      <View style={[styles.separator, { backgroundColor: theme.border }]} />
      <ThemedText type="bodySm" style={styles.sectionTitle}>
        {"Exchange Rates"}
      </ThemedText>
      <ThemedText type="small" color={theme.textSecondary}>
        {"Customize your exchange rates (1 USD = X)"}
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
          {"Last updated: "}
          {new Date(exchangeRatesUpdatedAt).toLocaleString()}
        </ThemedText>
      ) : null}
    </>
  );
}

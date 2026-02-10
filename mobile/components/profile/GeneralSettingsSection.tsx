import React from "react";
import { View, Pressable, ActivityIndicator, Switch } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Button } from "../Button";
import { Input } from "../Input";
import { Card, CardHeader, CardContent } from "../Card";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { styles } from "./profileStyles";
import AppearanceSelectors from "./AppearanceSelectors";
import ApiKeysAndRatesSection from "./ApiKeysAndRatesSection";
import type { useProfileData } from "../../hooks/useProfileData";

type ProfileData = ReturnType<typeof useProfileData>;

interface GeneralSettingsSectionProps {
  data: ProfileData;
  isMyselfTier: boolean;
}

export default function GeneralSettingsSection({
  data,
  isMyselfTier,
}: GeneralSettingsSectionProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const {
    currency, setCurrency,
    language, setLanguage,
    telegramNotifications, setTelegramNotifications,
    notificationTime, setNotificationTime,
    anthropicApiKey, setAnthropicApiKey,
    openaiApiKey, setOpenaiApiKey,
    exchangeRates, updateExchangeRate,
    settingsQuery, updateMutation,
    handleSave, selectedTz,
    setShowTimezoneModal,
  } = data;

  return (
    <Card>
      <CardHeader>
        <ThemedText type="h4" style={styles.cardTitle}>
          {t("settings.general_settings")}
        </ThemedText>
      </CardHeader>
      <CardContent style={styles.generalContent}>
        {settingsQuery.isLoading ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <>
            <AppearanceSelectors
              currency={currency}
              setCurrency={setCurrency}
              language={language}
              setLanguage={setLanguage}
            />

            {/* Save (top) */}
            <Button
              title={updateMutation.isPending ? `${t("settings.save_settings")}...` : t("settings.save_settings")}
              onPress={handleSave}
              disabled={updateMutation.isPending}
              loading={updateMutation.isPending}
            />

            {/* Telegram Notifications toggle */}
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <ThemedText type="bodySm" style={styles.label}>
                  {t("settings.telegram_notifications")}
                </ThemedText>
                <ThemedText type="small" color={theme.textSecondary}>
                  {t("settings.receive_alerts")}
                </ThemedText>
              </View>
              <Switch
                value={telegramNotifications}
                onValueChange={setTelegramNotifications}
                trackColor={{ false: theme.border, true: theme.primary }}
              />
            </View>

            {/* Notification Settings */}
            <View style={[styles.separator, { backgroundColor: theme.border }]} />
            <ThemedText type="bodySm" style={styles.sectionTitle}>
              {t("settings.notification_settings")}
            </ThemedText>
            <ThemedText type="small" color={theme.textSecondary}>
              {t("settings.notification_settings.description")}
            </ThemedText>

            {/* Timezone */}
            <View style={styles.field}>
              <ThemedText type="small" color={theme.textSecondary} style={styles.label}>
                {t("settings.timezone")}
              </ThemedText>
              <Pressable
                onPress={() => setShowTimezoneModal(true)}
                style={[styles.selectBtn, {
                  backgroundColor: theme.background,
                  borderColor: theme.input,
                }]}
              >
                <ThemedText
                  type="bodySm"
                  color={selectedTz ? theme.text : theme.textTertiary}
                >
                  {selectedTz ? `${selectedTz.label} (${selectedTz.key})` : "Select timezone"}
                </ThemedText>
                <Feather name="chevron-down" size={16} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Notification Time */}
            <Input
              label={t("settings.notification_time")}
              value={notificationTime}
              onChangeText={setNotificationTime}
              placeholder="09:00"
              description="24-hour format (HH:MM)"
            />

            <ApiKeysAndRatesSection
              isMyselfTier={isMyselfTier}
              anthropicApiKey={anthropicApiKey}
              setAnthropicApiKey={setAnthropicApiKey}
              openaiApiKey={openaiApiKey}
              setOpenaiApiKey={setOpenaiApiKey}
              exchangeRates={exchangeRates}
              updateExchangeRate={updateExchangeRate}
              exchangeRatesUpdatedAt={settingsQuery.data?.exchangeRatesUpdatedAt}
            />

            {/* Save (bottom) */}
            <Button
              title={updateMutation.isPending ? `${t("settings.save_settings")}...` : t("settings.save_settings")}
              onPress={handleSave}
              disabled={updateMutation.isPending}
              loading={updateMutation.isPending}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

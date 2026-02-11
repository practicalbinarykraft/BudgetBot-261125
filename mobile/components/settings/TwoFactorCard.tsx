import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Button } from "../Button";
import { Card, CardHeader, CardContent } from "../Card";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { useTwoFactor } from "../../hooks/useTwoFactor";
import { TwoFactorSetupModal } from "../two-factor/TwoFactorSetupModal";
import { TwoFactorDisableModal } from "../two-factor/TwoFactorDisableModal";

export default function TwoFactorCard() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const h = useTwoFactor();

  return (
    <>
      <Card>
        <CardHeader>
          <View style={styles.headerRow}>
            <Feather
              name="shield"
              size={20}
              color={h.enabled ? "#10b981" : theme.text}
            />
            <View style={styles.headerText}>
              <ThemedText type="h4" style={styles.cardTitle}>
                {t("settings.2fa_title")}
              </ThemedText>
              <ThemedText type="small" color={theme.textSecondary}>
                {t("settings.2fa_subtitle")}
              </ThemedText>
            </View>
          </View>
        </CardHeader>
        <CardContent style={styles.content}>
          <ThemedText
            type="bodySm"
            color={h.enabled ? "#10b981" : theme.textSecondary}
            style={styles.statusText}
          >
            {h.enabled ? t("settings.2fa_enabled") : t("settings.2fa_disabled")}
          </ThemedText>
          {h.enabled ? (
            <Button
              title={t("settings.disable_2fa")}
              variant="destructive"
              onPress={() => {
                h.handleCodeChange("");
                h.setShowDisable(true);
              }}
            />
          ) : (
            <Button
              title={h.setupMutation.isPending ? t("settings.setting_up") : t("settings.enable_2fa")}
              onPress={() => h.setupMutation.mutate()}
              disabled={h.setupMutation.isPending}
              loading={h.setupMutation.isPending}
            />
          )}
        </CardContent>
      </Card>

      <TwoFactorSetupModal
        visible={h.showSetup}
        onClose={() => h.setShowSetup(false)}
        setupData={h.setupData}
        code={h.code}
        onCodeChange={h.handleCodeChange}
        onEnable={h.handleEnable}
        isPending={h.enableMutation.isPending}
      />

      <TwoFactorDisableModal
        visible={h.showDisable}
        onClose={() => h.setShowDisable(false)}
        code={h.code}
        onCodeChange={h.handleCodeChange}
        onDisable={h.handleDisable}
        isPending={h.disableMutation.isPending}
      />
    </>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontWeight: "600" },
  headerRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  headerText: { flex: 1 },
  content: { gap: Spacing.md },
  statusText: { fontWeight: "500" },
});

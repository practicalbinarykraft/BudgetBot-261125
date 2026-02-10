import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Button } from "../Button";
import { Card, CardHeader, CardContent } from "../Card";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTwoFactor } from "../../hooks/useTwoFactor";
import { TwoFactorSetupModal } from "../two-factor/TwoFactorSetupModal";
import { TwoFactorDisableModal } from "../two-factor/TwoFactorDisableModal";

export default function TwoFactorCard() {
  const { theme } = useTheme();
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
                {"Two-Factor Authentication"}
              </ThemedText>
              <ThemedText type="small" color={theme.textSecondary}>
                {"Enhance your account security with 2FA"}
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
            {h.enabled ? "2FA is currently enabled" : "2FA is not enabled"}
          </ThemedText>
          {h.enabled ? (
            <Button
              title="Disable 2FA"
              variant="destructive"
              onPress={() => {
                h.handleCodeChange("");
                h.setShowDisable(true);
              }}
            />
          ) : (
            <Button
              title={h.setupMutation.isPending ? "Setting up..." : "Enable 2FA"}
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

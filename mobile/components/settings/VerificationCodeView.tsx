import React from "react";
import { View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Button } from "../Button";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { styles } from "./TelegramIntegrationCard.styles";

interface VerificationCodeViewProps {
  code: string;
  timeLeft: number;
  copied: boolean;
  onCopy: () => void;
  onCancel: () => void;
  formatTime: (seconds: number) => string;
}

export function VerificationCodeView({
  code,
  timeLeft,
  copied,
  onCopy,
  onCancel,
  formatTime,
}: VerificationCodeViewProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <ThemedText
        type="small"
        color={theme.textSecondary}
        style={styles.label}
      >
        {t("settings.verification_code")}
      </ThemedText>
      <Pressable onPress={onCopy} style={styles.codeRow}>
        <ThemedText type="h2" mono style={styles.codeText}>
          {code}
        </ThemedText>
        <Feather
          name={copied ? "check" : "copy"}
          size={18}
          color={theme.primary}
        />
      </Pressable>
      <ThemedText type="small" color={theme.textSecondary}>
        {t("settings.expires_in")}
        {formatTime(timeLeft)}
      </ThemedText>

      <View style={styles.steps}>
        <ThemedText type="small" color={theme.textSecondary}>
          {t("settings.telegram_step1")}
        </ThemedText>
        <ThemedText type="small" color={theme.textSecondary}>
          {t("settings.telegram_step2", { code })}
        </ThemedText>
        <ThemedText type="small" color={theme.textSecondary}>
          {t("settings.telegram_step3")}
        </ThemedText>
      </View>

      <Button
        title={t("common.cancel")}
        variant="outline"
        onPress={onCancel}
      />
    </>
  );
}

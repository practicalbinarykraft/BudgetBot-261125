import React from "react";
import { View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Button } from "../Button";
import { useTheme } from "../../hooks/useTheme";
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

  return (
    <>
      <ThemedText
        type="small"
        color={theme.textSecondary}
        style={styles.label}
      >
        {"Verification Code"}
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
        {"Expires in "}
        {formatTime(timeLeft)}
      </ThemedText>

      <View style={styles.steps}>
        <ThemedText type="small" color={theme.textSecondary}>
          {"1. Open Telegram and find @BudgetBuddyAIBot"}
        </ThemedText>
        <ThemedText type="small" color={theme.textSecondary}>
          {"2. Send /verify "}
          {code}
        </ThemedText>
        <ThemedText type="small" color={theme.textSecondary}>
          {"3. Return here to confirm connection"}
        </ThemedText>
      </View>

      <Button
        title="Cancel"
        variant="outline"
        onPress={onCancel}
      />
    </>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { View, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { ThemedText } from "../ThemedText";
import { Button } from "../Button";
import { Card, CardHeader, CardContent } from "../Card";
import { Badge } from "../Badge";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { api } from "../../lib/api-client";
import { queryClient } from "../../lib/query-client";
import type { TelegramStatus } from "../../types";
import { styles } from "./TelegramIntegrationCard.styles";
import { VerificationCodeView } from "./VerificationCodeView";

interface VerificationCode {
  code: string;
  expiresAt: string;
  ttlMinutes: number;
}

export default function TelegramIntegrationCard() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [verificationCode, setVerificationCode] =
    useState<VerificationCode | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const statusQuery = useQuery({
    queryKey: ["telegram-status"],
    queryFn: () => api.get<TelegramStatus>("/api/telegram/status"),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post<VerificationCode>("/api/telegram/generate-code", {}),
    onSuccess: (data) => {
      setVerificationCode(data);
    },
    onError: (error: Error) => Alert.alert(t("common.error"), error.message),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api.post("/api/telegram/disconnect", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegram-status"] });
      Alert.alert(t("common.success"), t("settings.telegram_disconnected"));
    },
    onError: (error: Error) => Alert.alert(t("common.error"), error.message),
  });

  // Countdown timer
  useEffect(() => {
    if (!verificationCode) return;
    const calcTimeLeft = () => {
      const diff = Math.floor(
        (new Date(verificationCode.expiresAt).getTime() - Date.now()) / 1000
      );
      return Math.max(0, diff);
    };
    setTimeLeft(calcTimeLeft());
    timerRef.current = setInterval(() => {
      const left = calcTimeLeft();
      setTimeLeft(left);
      if (left <= 0) {
        setVerificationCode(null);
        setTimeLeft(null);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [verificationCode]);

  const handleCopy = async () => {
    if (!verificationCode) return;
    await Clipboard.setStringAsync(verificationCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    Alert.alert(t("settings.disconnect_confirm_title"), t("settings.disconnect_confirm_message"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("settings.disconnect_telegram"),
        style: "destructive",
        onPress: () => disconnectMutation.mutate(),
      },
    ]);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const connected = statusQuery.data?.connected ?? false;
  const username = statusQuery.data?.username;

  return (
    <Card>
      <CardHeader>
        <ThemedText type="h4" style={styles.cardTitle}>
          {t("settings.telegram_title")}
        </ThemedText>
        <ThemedText type="small" color={theme.textSecondary}>
          {t("settings.telegram_subtitle")}
        </ThemedText>
      </CardHeader>
      <CardContent style={styles.content}>
        {/* Status */}
        <View style={styles.statusRow}>
          <Feather name="message-circle" size={18} color={theme.text} />
          <ThemedText type="bodySm" style={styles.statusLabel}>
            {t("settings.connection_status")}
          </ThemedText>
          <Badge
            label={connected ? t("settings.connected") : t("settings.not_connected")}
            variant={connected ? "default" : "secondary"}
          />
        </View>

        {connected ? (
          <>
            {username ? (
              <ThemedText type="bodySm" color={theme.textSecondary}>
                {t("settings.connected_as", { username })}
              </ThemedText>
            ) : null}
            <Button
              title={
                disconnectMutation.isPending
                  ? t("settings.disconnecting")
                  : t("settings.disconnect_telegram")
              }
              variant="destructive"
              onPress={handleDisconnect}
              disabled={disconnectMutation.isPending}
              loading={disconnectMutation.isPending}
            />
          </>
        ) : verificationCode && timeLeft !== null && timeLeft > 0 ? (
          <VerificationCodeView
            code={verificationCode.code}
            timeLeft={timeLeft}
            copied={copied}
            onCopy={handleCopy}
            onCancel={() => {
              setVerificationCode(null);
              setTimeLeft(null);
            }}
            formatTime={formatTime}
          />
        ) : (
          <>
            <ThemedText type="small" color={theme.textSecondary}>
              {t("settings.generate_code_hint")}
            </ThemedText>
            <Button
              title={
                generateMutation.isPending ? t("settings.generating") : t("settings.generate_code")
              }
              onPress={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              loading={generateMutation.isPending}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}


import React from "react";
import { View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { authStyles as styles } from "./authStyles";

interface AuthHeaderProps {
  language: "en" | "ru";
  onToggleLanguage: () => void;
}

export function AuthHeader({ language, onToggleLanguage }: AuthHeaderProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <View style={styles.langRow}>
        <Pressable
          onPress={onToggleLanguage}
          style={[styles.langButton, { backgroundColor: theme.muted }]}
        >
          <Feather name="globe" size={14} color={theme.textSecondary} />
          <ThemedText type="small" color={theme.textSecondary}>
            {language === "en" ? "EN" : "RU"}
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather name="credit-card" size={40} color={theme.primary} />
          <ThemedText type="h1" style={styles.title}>
            {t("auth.app_title")}
          </ThemedText>
        </View>
        <ThemedText type="bodySm" color={theme.textSecondary}>
          {t("auth.app_description")}
        </ThemedText>
      </View>
    </>
  );
}

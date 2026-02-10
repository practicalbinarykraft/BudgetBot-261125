import React from "react";
import { View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import { currencies } from "./profileConstants";
import { styles } from "./profileStyles";

interface AppearanceSelectorsProps {
  currency: string;
  setCurrency: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
}

export default function AppearanceSelectors({
  currency,
  setCurrency,
  language,
  setLanguage,
}: AppearanceSelectorsProps) {
  const { theme, mode, setMode } = useTheme();
  const { t } = useTranslation();

  const languages = [
    { key: "en", label: t("settings.language.english") },
    { key: "ru", label: t("settings.language.russian") },
  ];

  return (
    <>
      {/* Currency */}
      <View style={styles.field}>
        <ThemedText type="small" color={theme.textSecondary} style={styles.label}>
          {t("settings.currency")}
        </ThemedText>
        <View style={styles.optionsGrid}>
          {currencies.map((c) => {
            const isActive = currency === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => setCurrency(c.key)}
                style={[styles.optionBtn, {
                  backgroundColor: isActive ? theme.primary : theme.secondary,
                  borderColor: isActive ? theme.primary : theme.border,
                }]}
              >
                <ThemedText type="small" color={isActive ? "#ffffff" : theme.text}>
                  {c.key}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Language */}
      <View style={styles.field}>
        <ThemedText type="small" color={theme.textSecondary} style={styles.label}>
          {t("settings.language")}
        </ThemedText>
        <View style={styles.toggleRow}>
          {languages.map((l) => {
            const isActive = language === l.key;
            return (
              <Pressable
                key={l.key}
                onPress={() => setLanguage(l.key)}
                style={[styles.toggleBtn, {
                  backgroundColor: isActive ? theme.primary : theme.secondary,
                  borderColor: isActive ? theme.primary : theme.border,
                }]}
              >
                <ThemedText type="bodySm" color={isActive ? "#ffffff" : theme.text}>
                  {l.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Theme toggle */}
      <View style={styles.field}>
        <ThemedText type="small" color={theme.textSecondary} style={styles.label}>
          {"Theme"}
        </ThemedText>
        <View style={styles.toggleRow}>
          {(["system", "light", "dark"] as const).map((m) => {
            const isActive = mode === m;
            const labels = { system: "System", light: t("common.light_theme"), dark: t("common.dark_theme") };
            return (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[styles.themeBtn, {
                  backgroundColor: isActive ? theme.primary : theme.secondary,
                  borderColor: isActive ? theme.primary : theme.border,
                }]}
              >
                <Feather
                  name={m === "system" ? "smartphone" : m === "light" ? "sun" : "moon"}
                  size={14}
                  color={isActive ? "#ffffff" : theme.text}
                />
                <ThemedText type="bodySm" color={isActive ? "#ffffff" : theme.text}>
                  {labels[m]}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}

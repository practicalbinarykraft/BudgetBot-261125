import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Button } from "../Button";
import { ThemedText } from "../ThemedText";
import { Spacing, BorderRadius } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useTranslation } from "../../i18n";
import type { SpotlightTarget } from "../../lib/spotlight-ref";

type IconName = React.ComponentProps<typeof Feather>["name"];

export interface StepDef {
  stepId: string;
  icon: IconName;
  titleKey: string;
  descKey: string;
  credits: number;
  route?: string;
}

const SPOTLIGHT_MAP: Record<string, SpotlightTarget> = {
  add_transaction: "add_transaction",
  voice_input: "voice_input",
  receipt_scan: "receipt_scan",
  view_transactions: "view_transactions",
};

interface StepHelpViewProps {
  step: StepDef;
  onBack: () => void;
  onShowWhere: (targetId: SpotlightTarget) => void;
  onOpenScreen: (route: string) => void;
}

export function StepHelpView({ step, onBack, onShowWhere, onOpenScreen }: StepHelpViewProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const spotlightTarget = SPOTLIGHT_MAP[step.stepId] ?? null;
  const hasRoute = !!step.route && step.stepId !== "view_transactions";

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} hitSlop={8} style={styles.backRow}>
        <Feather name="arrow-left" size={20} color={theme.textSecondary} />
        <ThemedText type="bodySm" color={theme.textSecondary}>
          {t("common.back")}
        </ThemedText>
      </Pressable>

      <View style={[styles.iconCircle, { backgroundColor: theme.primary + "15" }]}>
        <Feather name={step.icon} size={28} color={theme.primary} />
      </View>

      <ThemedText type="h4" style={styles.title}>
        {t(step.titleKey)}
      </ThemedText>

      <ThemedText type="bodySm" color={theme.textSecondary} style={styles.description}>
        {t(`tutorial.step_help.${step.stepId}`)}
      </ThemedText>

      <View style={styles.actions}>
        {spotlightTarget && (
          <Button
            title={t("tutorial.show_where")}
            variant="outline"
            onPress={() => onShowWhere(spotlightTarget)}
            style={styles.btn}
          />
        )}
        {hasRoute && (
          <Button
            title={t("tutorial.open_screen")}
            onPress={() => onOpenScreen(step.route!)}
            style={styles.btn}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  title: { fontWeight: "600", textAlign: "center" },
  description: { textAlign: "center", lineHeight: 20 },
  actions: { gap: Spacing.sm, marginTop: Spacing.md },
  btn: { width: "100%" },
});

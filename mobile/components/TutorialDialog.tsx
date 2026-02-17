import React, { useEffect } from "react";
import {
  View,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Card, CardContent } from "./Card";
import { Button } from "./Button";
import { ThemedText } from "./ThemedText";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useTranslation, type Language } from "../i18n";
import { useTutorialDialog } from "../hooks/useTutorialDialog";
import { registerTutorialOpen, unregisterTutorialOpen } from "../lib/tutorial-ref";
import { startSpotlightFlow } from "../lib/spotlight-ref";
import type { SpotlightTarget } from "../lib/spotlight-ref";
import { showSpotlightOnMain } from "../lib/spotlight-navigation";
import { StepHelpView, type StepDef, FLOW_MAP } from "./tutorial/StepHelpView";

type IconName = React.ComponentProps<typeof Feather>["name"];

const STEPS: StepDef[] = [
  { stepId: "create_wallet", icon: "credit-card", titleKey: "tutorial.step.create_wallet", descKey: "tutorial.desc.create_wallet", credits: 10, route: "AddWallet" },
  { stepId: "add_transaction", icon: "plus-circle", titleKey: "tutorial.step.add_transaction", descKey: "tutorial.desc.add_transaction", credits: 5, route: "AddTransaction" },
  { stepId: "voice_input", icon: "mic", titleKey: "tutorial.step.voice_input", descKey: "tutorial.desc.voice_input", credits: 15, route: "VoiceInput" },
  { stepId: "receipt_scan", icon: "camera", titleKey: "tutorial.step.receipt_scan", descKey: "tutorial.desc.receipt_scan", credits: 10, route: "ReceiptScanner" },
  { stepId: "planned_income", icon: "dollar-sign", titleKey: "tutorial.step.planned_income", descKey: "tutorial.desc.planned_income", credits: 5, route: "AddPlannedIncome" },
  { stepId: "planned_expense", icon: "calendar", titleKey: "tutorial.step.planned_expense", descKey: "tutorial.desc.planned_expense", credits: 5, route: "AddPlannedExpense" },
  { stepId: "view_chart", icon: "trending-up", titleKey: "tutorial.step.view_chart", descKey: "tutorial.desc.view_chart", credits: 3, route: "FullscreenChart" },
  { stepId: "view_transactions", icon: "list", titleKey: "tutorial.step.view_transactions", descKey: "tutorial.desc.view_transactions", credits: 2 },
];

interface TutorialDialogProps {
  userId: number | undefined;
}

export default function TutorialDialog({ userId }: TutorialDialogProps) {
  const { theme } = useTheme();
  const { t, language, setLanguage } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { visible, view, setView, open, dismiss, tutorial, selectedStepId, openStepHelp, backToChecklist } = useTutorialDialog(userId);

  useEffect(() => {
    registerTutorialOpen(open);
    return () => unregisterTutorialOpen();
  }, [open]);

  const allDone = tutorial.completedSteps >= tutorial.totalSteps;

  const handleStepPress = (step: StepDef) => {
    if (tutorial.isStepCompleted(step.stepId)) return;
    const flowId = FLOW_MAP[step.stepId];
    if (flowId) {
      handleStartFlow(flowId);
      return;
    }
    openStepHelp(step.stepId);
  };

  const handleShowWhere = (targetId: SpotlightTarget) => {
    dismiss();
    showSpotlightOnMain(navigation, targetId);
  };

  const handleOpenScreen = (route: string) => {
    dismiss();
    setTimeout(() => navigation.navigate(route as any), 200);
  };

  const handleStartFlow = (flowId: string) => {
    dismiss();
    setTimeout(() => startSpotlightFlow(flowId, navigation), 200);
  };

  const selectedStep = selectedStepId ? STEPS.find((s) => s.stepId === selectedStepId) : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.overlay}>
        <Card style={styles.dialog}>
          <CardContent style={styles.dialogContent}>
            {view === "welcome" ? (
              <>
                <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" }]}>
                  <Feather name="star" size={32} color={theme.primary} />
                </View>
                <ThemedText type="h3" style={styles.title}>
                  {t("tutorial.welcome_title")}
                </ThemedText>
                <ThemedText type="bodySm" color={theme.textSecondary} style={styles.description}>
                  {t("tutorial.welcome_desc")}
                </ThemedText>
                <View style={styles.langRow}>
                  {(["en", "ru"] as Language[]).map((lang) => (
                    <Pressable
                      key={lang}
                      onPress={() => setLanguage(lang)}
                      style={[
                        styles.langChip,
                        {
                          backgroundColor: language === lang ? theme.primary : theme.muted,
                          borderColor: language === lang ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <ThemedText
                        type="bodySm"
                        color={language === lang ? theme.primaryForeground : theme.text}
                        style={{ fontWeight: "600" }}
                      >
                        {lang === "en" ? "EN" : "RU"}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
                <Button
                  title={t("tutorial.start")}
                  onPress={() => setView("checklist")}
                  style={styles.fullWidthBtn}
                />
                <Pressable onPress={dismiss} style={styles.skipRow}>
                  <ThemedText type="bodySm" color={theme.textSecondary}>
                    {t("tutorial.skip")}
                  </ThemedText>
                </Pressable>
              </>
            ) : view === "stepHelp" && selectedStep ? (
              <StepHelpView
                step={selectedStep}
                onBack={backToChecklist}
                onShowWhere={handleShowWhere}
                onOpenScreen={handleOpenScreen}
                onStartFlow={handleStartFlow}
              />
            ) : (
              <>
                {/* Header */}
                <View style={styles.checklistHeader}>
                  <ThemedText type="h4" style={styles.checklistTitle}>
                    {t("tutorial.title")}
                  </ThemedText>
                  <Pressable onPress={dismiss} hitSlop={8}>
                    <Feather name="x" size={20} color={theme.textSecondary} />
                  </Pressable>
                </View>

                {/* Progress bar */}
                <View style={styles.progressRow}>
                  <View style={[styles.progressBar, { backgroundColor: theme.muted }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: theme.primary,
                          width: `${(tutorial.completedSteps / tutorial.totalSteps) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <ThemedText type="small" color={theme.textSecondary}>
                    {t("tutorial.progress")
                      .replace("{completed}", String(tutorial.completedSteps))
                      .replace("{total}", String(tutorial.totalSteps))}
                  </ThemedText>
                </View>

                {allDone && (
                  <View style={[styles.allDoneBanner, { backgroundColor: "#22c55e15" }]}>
                    <Feather name="check-circle" size={20} color="#16a34a" />
                    <View style={{ flex: 1 }}>
                      <ThemedText type="bodySm" color="#16a34a" style={{ fontWeight: "600" }}>
                        {t("tutorial.all_done_title")}
                      </ThemedText>
                      <ThemedText type="small" color="#16a34a">
                        {t("tutorial.all_done_desc").replace("{count}", String(tutorial.totalCreditsEarned))}
                      </ThemedText>
                    </View>
                  </View>
                )}

                {/* Steps list */}
                <ScrollView style={styles.stepsList} showsVerticalScrollIndicator={false}>
                  {STEPS.map((step) => {
                    const completed = tutorial.isStepCompleted(step.stepId);
                    return (
                      <Pressable
                        key={step.stepId}
                        onPress={() => handleStepPress(step)}
                        style={[
                          styles.stepRow,
                          { borderColor: theme.border },
                          completed && { opacity: 0.6 },
                        ]}
                      >
                        <View
                          style={[
                            styles.stepIcon,
                            {
                              backgroundColor: completed ? "#22c55e20" : theme.primary + "15",
                            },
                          ]}
                        >
                          <Feather
                            name={completed ? "check" : step.icon}
                            size={16}
                            color={completed ? "#16a34a" : theme.primary}
                          />
                        </View>
                        <View style={styles.stepInfo}>
                          <ThemedText type="bodySm" style={{ fontWeight: "500" }}>
                            {t(step.titleKey)}
                          </ThemedText>
                          <ThemedText type="small" color={theme.textSecondary}>
                            {t(step.descKey)}
                          </ThemedText>
                        </View>
                        <View
                          style={[
                            styles.creditBadge,
                            {
                              backgroundColor: completed ? theme.muted : "#f59e0b20",
                            },
                          ]}
                        >
                          <ThemedText
                            type="small"
                            color={completed ? theme.textTertiary : "#f59e0b"}
                            style={{ fontWeight: "600" }}
                          >
                            +{step.credits}
                          </ThemedText>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Footer */}
                <View style={[styles.footer, { borderTopColor: theme.border }]}>
                  <ThemedText type="small" color={theme.textSecondary}>
                    {t("tutorial.total_earned").replace("{count}", String(tutorial.totalCreditsEarned))}
                  </ThemedText>
                </View>
              </>
            )}
          </CardContent>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["2xl"],
  },
  dialog: { width: "100%", maxWidth: 400, maxHeight: "85%" },
  dialogContent: {
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.sm,
  },
  title: { fontWeight: "700", textAlign: "center" },
  description: { textAlign: "center", lineHeight: 20 },
  langRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignSelf: "center",
    marginTop: Spacing.sm,
  },
  langChip: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  fullWidthBtn: { width: "100%", marginTop: Spacing.sm },
  skipRow: { paddingVertical: Spacing.sm, alignSelf: "center" },
  checklistHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  checklistTitle: { fontWeight: "600" },
  progressRow: { gap: Spacing.xs },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  allDoneBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  stepsList: { maxHeight: 360 },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepInfo: { flex: 1, gap: 2 },
  creditBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.sm,
    alignItems: "center",
  },
});

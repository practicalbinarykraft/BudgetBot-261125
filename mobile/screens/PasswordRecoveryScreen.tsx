import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import { KeyboardAvoidingView } from "@/components/KeyboardAvoidingView";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { usePasswordRecovery } from "../hooks/usePasswordRecovery";
import { StepIndicator } from "../components/password-recovery/StepIndicator";
import { RecoveryStepForms } from "../components/password-recovery/RecoveryStepForms";

export default function PasswordRecoveryScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const recovery = usePasswordRecovery();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Feather name="credit-card" size={32} color={theme.primary} />
              <ThemedText type="h3" style={styles.title}>
                {t("password_recovery.title")}
              </ThemedText>
            </View>
            <ThemedText type="bodySm" color={theme.textSecondary}>
              {recovery.step === "request" && t("password_recovery.step1_description")}
              {recovery.step === "verify" && t("password_recovery.step2_description")}
              {recovery.step === "reset" && t("password_recovery.step3_description")}
            </ThemedText>
          </View>

          {/* Back button */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backRow}
          >
            <Feather name="arrow-left" size={16} color={theme.text} />
            <ThemedText type="bodySm">{t("password_recovery.back_to_login")}</ThemedText>
          </Pressable>

          {/* Step indicator */}
          <StepIndicator currentStep={recovery.stepNum} />

          {/* Card with form */}
          <RecoveryStepForms
            step={recovery.step}
            emailOrTelegramId={recovery.emailOrTelegramId}
            setEmailOrTelegramId={recovery.setEmailOrTelegramId}
            code={recovery.code}
            setCode={recovery.setCode}
            newPassword={recovery.newPassword}
            setNewPassword={recovery.setNewPassword}
            confirmPassword={recovery.confirmPassword}
            setConfirmPassword={recovery.setConfirmPassword}
            isPending={recovery.isPending}
            onRequestRecovery={recovery.handleRequestRecovery}
            onVerifyCode={recovery.handleVerifyCode}
            onResetPassword={recovery.handleResetPassword}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing["4xl"],
  },
  container: {
    width: "100%",
    maxWidth: 448,
    alignSelf: "center",
    gap: Spacing.lg,
  },
  header: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    fontWeight: "700",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
});

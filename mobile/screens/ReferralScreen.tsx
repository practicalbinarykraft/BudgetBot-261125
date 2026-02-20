import React from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { ThemedText } from "../components/ThemedText";
import { Card, CardContent } from "../components/Card";
import { Badge } from "../components/Badge";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { useReferral } from "../hooks/useReferral";
import { useToast } from "../components/Toast";

export default function ReferralScreen() {
  const { theme } = useTheme();
  const { t, language } = useTranslation();
  const toast = useToast();
  const { code, link, stats, invited, isLoading, share } = useReferral();

  const handleCopy = async () => {
    if (!link) return;
    await Clipboard.setStringAsync(link);
    toast.show(t("referral.link_copied"), "success");
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      day: "numeric",
      month: "short",
    });
  };

  if (isLoading) {
    return (
      <View style={[s.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[s.flex, { backgroundColor: theme.background }]} contentContainerStyle={s.content}>
      {/* Header */}
      <ThemedText type="heading" style={s.title}>{t("referral.title")}</ThemedText>
      <ThemedText type="bodySm" color={theme.textSecondary} style={s.subtitle}>
        {t("referral.subtitle")}
      </ThemedText>

      {/* Link Card */}
      <Card style={s.card}>
        <CardContent>
          <ThemedText type="bodySm" color={theme.textSecondary} style={s.label}>
            {t("referral.your_link")}
          </ThemedText>
          <View style={[s.linkRow, { backgroundColor: theme.muted, borderRadius: 8 }]}>
            <ThemedText type="bodySm" numberOfLines={1} style={s.linkText}>
              {link ?? "..."}
            </ThemedText>
          </View>
          <View style={s.btnRow}>
            <Pressable
              onPress={handleCopy}
              style={[s.btn, { backgroundColor: theme.muted }]}
            >
              <Feather name="copy" size={16} color={theme.text} />
              <ThemedText type="bodySm" style={s.btnText}>{t("referral.copy_link")}</ThemedText>
            </Pressable>
            <Pressable
              onPress={share}
              style={[s.btn, { backgroundColor: theme.primary }]}
            >
              <Feather name="share-2" size={16} color="#fff" />
              <ThemedText type="bodySm" style={[s.btnText, { color: "#fff" }]}>{t("referral.share")}</ThemedText>
            </Pressable>
          </View>
        </CardContent>
      </Card>

      {/* Stats */}
      <View style={s.statsRow}>
        <Card style={s.statCard}>
          <CardContent style={s.statContent}>
            <Feather name="users" size={24} color={theme.primary} />
            <ThemedText type="heading" style={s.statValue}>{stats.invitedCount}</ThemedText>
            <ThemedText type="bodySm" color={theme.textSecondary}>{t("referral.stats_invited")}</ThemedText>
          </CardContent>
        </Card>
        <Card style={s.statCard}>
          <CardContent style={s.statContent}>
            <Feather name="zap" size={24} color={theme.primary} />
            <ThemedText type="heading" style={s.statValue}>{stats.creditsEarned}</ThemedText>
            <ThemedText type="bodySm" color={theme.textSecondary}>{t("referral.stats_credits")}</ThemedText>
          </CardContent>
        </Card>
      </View>

      {/* How it works */}
      <Card style={s.card}>
        <CardContent>
          <ThemedText type="subheading" style={s.sectionTitle}>{t("referral.how_it_works")}</ThemedText>
          {[
            { icon: "share-2" as const, title: t("referral.step1_title"), desc: t("referral.step1_desc") },
            { icon: "user-plus" as const, title: t("referral.step2_title"), desc: t("referral.step2_desc") },
            { icon: "gift" as const, title: t("referral.step3_title"), desc: t("referral.step3_desc") },
          ].map((step, i) => (
            <View key={i} style={s.stepRow}>
              <View style={[s.stepIcon, { backgroundColor: theme.primary + "20" }]}>
                <Feather name={step.icon} size={16} color={theme.primary} />
              </View>
              <View style={s.stepText}>
                <ThemedText type="body">{step.title}</ThemedText>
                <ThemedText type="bodySm" color={theme.textSecondary}>{step.desc}</ThemedText>
              </View>
            </View>
          ))}
        </CardContent>
      </Card>

      {/* Invited Users */}
      <Card style={s.card}>
        <CardContent>
          <ThemedText type="subheading" style={s.sectionTitle}>{t("referral.invited_users")}</ThemedText>
          {invited.length === 0 ? (
            <ThemedText type="bodySm" color={theme.textSecondary} style={s.emptyText}>
              {t("referral.no_invites_yet")}
            </ThemedText>
          ) : (
            invited.map((user) => (
              <View key={user.id} style={[s.invitedRow, { borderBottomColor: theme.cardBorder }]}>
                <View>
                  <ThemedText type="body">{user.name}</ThemedText>
                  <ThemedText type="bodySm" color={theme.textSecondary}>{formatDate(user.createdAt)}</ThemedText>
                </View>
                <View style={s.invitedRight}>
                  <ThemedText type="bodySm" style={{ color: theme.success || "#22c55e" }}>+{user.signupCredits}</ThemedText>
                  <Badge
                    label={user.onboardingCompleted ? t("referral.completed") : t("referral.pending")}
                    variant={user.onboardingCompleted ? "success" : "default"}
                  />
                </View>
              </View>
            ))
          )}
        </CardContent>
      </Card>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16 },
  title: { marginBottom: 4 },
  subtitle: { marginBottom: 16 },
  card: { marginBottom: 16 },
  label: { marginBottom: 8 },
  linkRow: { padding: 12, marginBottom: 12 },
  linkText: { flex: 1 },
  btnRow: { flexDirection: "row", gap: 8 },
  btn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, flex: 1, justifyContent: "center" },
  btnText: { fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statCard: { flex: 1 },
  statContent: { alignItems: "center", paddingVertical: 16 },
  statValue: { fontSize: 28, marginVertical: 4 },
  sectionTitle: { marginBottom: 12 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  stepIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  stepText: { flex: 1 },
  emptyText: { textAlign: "center", paddingVertical: 16 },
  invitedRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  invitedRight: { flexDirection: "row", alignItems: "center", gap: 8 },
});

import React, { useCallback } from "react";
import { View, ScrollView, Pressable, ActivityIndicator, Animated } from "react-native";
import { KeyboardAvoidingView } from "@/components/KeyboardAvoidingView";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { SpeechBubble } from "../components/SpeechBubble";
import { useTheme } from "../hooks/useTheme";
import { useAddTransactionScreen } from "../hooks/useAddTransactionScreen";
import { useInlineVoice } from "../hooks/useInlineVoice";
import { useTranslation } from "../i18n";
import { styles } from "./AddTransactionScreen.styles";

const CURRENCY_OPTIONS = ["USD", "RUB", "IDR", "EUR", "KRW", "CNY"];

export default function AddTransactionScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const nav = useNavigation<NativeStackNavigationProp<any>>();
  const h = useAddTransactionScreen();

  const handleVoiceResult = useCallback((r: { amount: string; currency: string; description: string; category?: string; type: "income" | "expense" }) => {
    if (r.amount && r.amount !== "0") h.setAmount(r.amount);
    if (r.description) h.setDescription(r.description);
    if (r.currency) h.setCurrency(r.currency);
    if (r.type) h.setType(r.type);
    if (r.category) h.setCategoryHint(r.category);
  }, []);

  const voice = useInlineVoice(false, handleVoiceResult);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type toggle */}
        <View style={styles.toggleRow}>
          {(["expense", "income"] as const).map((typ) => (
            <Pressable
              key={typ}
              onPress={() => h.setType(typ)}
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: h.type === typ ? theme[typ] : theme.secondary,
                  borderColor: h.type === typ ? theme[typ] : theme.border,
                },
              ]}
            >
              <ThemedText
                type="h4"
                color={h.type === typ ? "#ffffff" : theme.textSecondary}
              >
                {typ === "expense" ? t("transactions.type.expense") : t("transactions.type.income")}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <Input
          label={t("transactions.amount")}
          value={h.amount}
          onChangeText={h.setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          containerStyle={styles.field}
        />

        {/* Currency selector */}
        <View style={styles.field}>
          <ThemedText type="small" color={theme.textSecondary} style={styles.label}>
            {t("common.currency")}
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {CURRENCY_OPTIONS.map((cur) => (
              <Pressable
                key={cur}
                onPress={() => h.setCurrency(cur)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: h.currency === cur ? theme.primary + "30" : theme.secondary,
                    borderColor: h.currency === cur ? theme.primary : theme.border,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  color={h.currency === cur ? theme.primary : theme.text}
                  style={h.currency === cur ? { fontWeight: "600" } : undefined}
                >
                  {cur}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
          {h.convertedAmount ? (
            <ThemedText type="small" color={theme.textSecondary} style={{ marginTop: 4 }}>
              {t("transactions.approx_usd").replace("{amount}", h.convertedAmount)}
            </ThemedText>
          ) : null}
        </View>

        <Input
          label={t("transactions.description")}
          value={h.description}
          onChangeText={h.setDescription}
          placeholder={t("transactions.placeholder_description")}
          containerStyle={styles.field}
        />

        {/* Quick input: inline voice + receipt scan */}
        <View style={styles.quickInputCol}>
          <SpeechBubble
            text={voice.isRecording
              ? t("voice_input.recording")
              : t("voice_input.bubble_hint")}
            visible={voice.isRecording || voice.isParsing}
          />
          <View style={styles.quickInputRow}>
            <Animated.View style={[styles.quickBtnWrap, { transform: [{ scale: voice.isRecording ? voice.pulseAnim : 1 }] }]}>
              <Pressable
                onPress={() => voice.toggle()}
                disabled={voice.isParsing}
                style={[
                  styles.quickBtn,
                  {
                    backgroundColor: voice.isRecording ? "#ef4444" : voice.isParsing ? theme.secondary : theme.secondary,
                    borderColor: voice.isRecording ? "#ef4444" : theme.border,
                  },
                ]}
              >
                {voice.isParsing ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Feather
                    name={voice.isRecording ? "square" : "mic"}
                    size={18}
                    color={voice.isRecording ? "#ffffff" : theme.primary}
                  />
                )}
                <ThemedText
                  type="small"
                  color={voice.isRecording ? "#ffffff" : theme.textSecondary}
                >
                  {voice.isParsing
                    ? t("voice_input.transcribing")
                    : voice.isRecording
                      ? t("voice_input.tap_stop")
                      : t("voice_input.title")}
                </ThemedText>
              </Pressable>
            </Animated.View>
            <Pressable
              onPress={() => nav.navigate("ReceiptScanner")}
              style={[styles.quickBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
            >
              <Feather name="camera" size={18} color={theme.primary} />
              <ThemedText type="small" color={theme.textSecondary}>{t("receipts.scan")}</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* AI category suggestion */}
        {h.hasCategorySuggestion ? (
          <View style={[styles.suggestionBox, { backgroundColor: theme.primary + "10", borderColor: theme.primary + "40" }]}>
            <View style={styles.suggestionHeader}>
              <Feather name="zap" size={14} color={theme.primary} />
              <ThemedText type="bodySm" color={theme.text}>
                {t("transactions.category_suggestion")}
              </ThemedText>
            </View>
            <View style={styles.chipsRow}>
              {h.suggestedCategories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => { h.setSelectedCategoryId(cat.id); h.dismissCategorySuggestion(); }}
                  style={[styles.chip, { backgroundColor: cat.color + "30", borderColor: cat.color }]}
                >
                  <ThemedText type="small">{cat.icon + " " + cat.name}</ThemedText>
                </Pressable>
              ))}
              <Pressable
                onPress={() => { h.dismissCategorySuggestion(); nav.navigate("CategoryPicker", { type: h.type }); }}
                style={[styles.chip, { backgroundColor: "transparent", borderColor: theme.border }]}
              >
                <ThemedText type="small" color={theme.textSecondary}>{t("transactions.other_category")}</ThemedText>
              </Pressable>
            </View>
            <ThemedText type="small" color={theme.textTertiary}>
              {t("transactions.category_suggestion_hint")}
            </ThemedText>
          </View>
        ) : null}

        {/* Category picker */}
        <View style={styles.field}>
          <ThemedText type="small" color={theme.textSecondary} style={styles.label}>
            {t("transactions.category_optional")}
          </ThemedText>
          {h.categoriesLoading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {h.categories.map((cat) => {
                const isSelected = h.selectedCategoryId === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => h.setSelectedCategoryId(isSelected ? null : cat.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? cat.color + "30" : theme.secondary,
                        borderColor: isSelected ? cat.color : theme.border,
                      },
                    ]}
                  >
                    <ThemedText type="small">{cat.icon + " " + cat.name}</ThemedText>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => nav.navigate("CategoryPicker", { type: h.type })}
                style={[
                  styles.chip,
                  {
                    backgroundColor: "transparent",
                    borderColor: theme.primary,
                  },
                ]}
              >
                <ThemedText type="small" color={theme.primary} style={{ fontWeight: "600" }}>
                  {h.categories.length === 0 ? t("category_picker.select") : t("transactions.add_category")}
                </ThemedText>
              </Pressable>
            </ScrollView>
          )}
        </View>

        {/* Wallet picker */}
        <View style={styles.field}>
          <ThemedText type="small" color={theme.textSecondary} style={styles.label}>
            {t("wallets.title")}
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {h.wallets.map((w) => {
              const isSelected = h.selectedWalletId === w.id;
              return (
                <Pressable
                  key={w.id}
                  onPress={() => h.setSelectedWalletId(isSelected ? null : w.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? theme.primary + "30" : theme.secondary,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <ThemedText type="small">{w.name}</ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Tag picker */}
        <View style={styles.field}>
          <ThemedText type="small" color={theme.textSecondary} style={styles.label}>
            {t("transactions.tag_optional")}
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            <Pressable
              onPress={() => h.setPersonalTagId(null)}
              style={[
                styles.chip,
                {
                  backgroundColor: h.personalTagId === null ? theme.primary + "30" : theme.secondary,
                  borderColor: h.personalTagId === null ? theme.primary : theme.border,
                },
              ]}
            >
              <ThemedText type="small">{t("transactions.tag_optional")}</ThemedText>
            </Pressable>
            {h.tags.map((tag) => {
              const isSelected = h.personalTagId === tag.id;
              return (
                <Pressable
                  key={tag.id}
                  onPress={() => h.setPersonalTagId(tag.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? (tag.color || theme.primary) + "30" : theme.secondary,
                      borderColor: isSelected ? tag.color || theme.primary : theme.border,
                    },
                  ]}
                >
                  <ThemedText type="small">{tag.name}</ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <Button
          title={t("transactions.add_transaction")}
          onPress={h.handleSubmit}
          loading={h.createMutation.isPending}
          disabled={h.createMutation.isPending}
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

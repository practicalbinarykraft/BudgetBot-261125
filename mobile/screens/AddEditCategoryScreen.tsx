import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ThemedText } from "../components/ThemedText";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import {
  useAddEditCategoryScreen,
  EMOJI_OPTIONS,
  COLOR_OPTIONS,
} from "../hooks/useAddEditCategoryScreen";
import { useTranslation } from "../i18n";

export default function AddEditCategoryScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const h = useAddEditCategoryScreen();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input
          label={t("categories.title")}
          value={h.name}
          onChangeText={h.setName}
          placeholder="e.g. Groceries"
          containerStyle={styles.field}
        />

        {/* Type toggle (only for new categories) */}
        {!h.isEditing ? (
          <View style={styles.field}>
            <ThemedText type="small" color={theme.textSecondary} style={styles.label}>
              {t("common.type")}
            </ThemedText>
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
                  <ThemedText type="h4" color={h.type === typ ? "#ffffff" : theme.textSecondary}>
                    {typ === "expense" ? t("categories.expense") : t("categories.income")}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Icon picker */}
        <View style={styles.field}>
          <ThemedText type="small" color={theme.textSecondary} style={styles.label}>{"Icon"}</ThemedText>
          <View style={styles.grid}>
            {EMOJI_OPTIONS.map((emoji) => {
              const isSelected = h.icon === emoji;
              return (
                <Pressable
                  key={emoji}
                  onPress={() => h.setIcon(emoji)}
                  style={[
                    styles.emojiCell,
                    {
                      backgroundColor: isSelected ? theme.primary + "20" : theme.secondary,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <ThemedText type="h3">{emoji}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Color picker */}
        <View style={styles.field}>
          <ThemedText type="small" color={theme.textSecondary} style={styles.label}>{"Color"}</ThemedText>
          <View style={styles.colorRow}>
            {COLOR_OPTIONS.map((c) => {
              const isSelected = h.color === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => h.setColor(c)}
                  style={[
                    styles.colorCell,
                    { backgroundColor: c },
                    isSelected ? { borderWidth: 3, borderColor: theme.text } : null,
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Preview */}
        <View style={styles.field}>
          <ThemedText type="small" color={theme.textSecondary} style={styles.label}>{"Preview"}</ThemedText>
          <View style={[styles.preview, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.previewIcon, { backgroundColor: h.color + "20" }]}>
              <ThemedText type="h3">{h.icon}</ThemedText>
            </View>
            <ThemedText type="h4">{h.name || "Category Name"}</ThemedText>
          </View>
        </View>

        <Button
          title={h.isEditing ? t("common.save") : t("categories.add_category")}
          onPress={h.handleSave}
          loading={h.isPending}
          disabled={h.isPending}
          style={styles.saveBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing["5xl"] },
  field: { marginBottom: Spacing.xl },
  label: { marginBottom: Spacing.sm },
  toggleRow: { flexDirection: "row", gap: Spacing.md },
  toggleBtn: {
    flex: 1, height: 48, borderRadius: BorderRadius.sm,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  emojiCell: {
    width: 48, height: 48, borderRadius: BorderRadius.md,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md },
  colorCell: { width: 40, height: 40, borderRadius: 20 },
  preview: {
    flexDirection: "row", alignItems: "center", padding: Spacing.lg,
    borderRadius: BorderRadius.md, borderWidth: 1, gap: Spacing.md,
  },
  previewIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  saveBtn: { marginTop: Spacing.lg },
});

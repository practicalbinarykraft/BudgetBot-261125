import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { KeyboardAvoidingView } from "@/components/KeyboardAvoidingView";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import {
  useAddEditTagScreen,
  ICON_OPTIONS,
  COLOR_OPTIONS,
  TYPE_OPTIONS,
} from "../hooks/useAddEditTagScreen";

export default function AddEditTagScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const h = useAddEditTagScreen();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input
          label="Name"
          value={h.name}
          onChangeText={h.setName}
          placeholder="e.g. Family, Work, Friends"
          containerStyle={styles.field}
        />

        {/* Icon selector */}
        <View style={styles.field}>
          <ThemedText type="small" color={theme.textSecondary} style={styles.label}>{"Icon"}</ThemedText>
          <View style={styles.iconGrid}>
            {ICON_OPTIONS.map((opt) => {
              const isActive = h.icon === opt.name;
              return (
                <Pressable
                  key={opt.name}
                  onPress={() => h.setIcon(opt.name)}
                  style={[
                    styles.iconBtn,
                    {
                      backgroundColor: isActive ? theme.primary + "20" : theme.secondary,
                      borderColor: isActive ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Feather
                    name={opt.feather}
                    size={18}
                    color={isActive ? theme.primary : theme.text}
                  />
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
              const isActive = h.color === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => h.setColor(c)}
                  style={[
                    styles.colorBtn,
                    {
                      backgroundColor: c,
                      borderColor: isActive ? theme.text : "transparent",
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Type selector */}
        <View style={styles.field}>
          <ThemedText type="small" color={theme.textSecondary} style={styles.label}>{"Type"}</ThemedText>
          <View style={styles.typeRow}>
            {TYPE_OPTIONS.map((t) => {
              const isActive = h.type === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => h.setType(t.key)}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: isActive ? theme.primary : theme.secondary,
                      borderColor: isActive ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <ThemedText type="small" color={isActive ? "#ffffff" : theme.text}>
                    {t.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {h.editTag ? (
          <Button
            title={t("common.delete")}
            variant="destructive"
            onPress={h.handleDelete}
            icon={<Feather name="trash-2" size={14} color={theme.destructiveForeground} />}
            style={styles.deleteBtn}
          />
        ) : null}

        <View style={styles.footerRow}>
          <Button
            title={t("common.cancel")}
            variant="outline"
            onPress={() => h.navigation.goBack()}
            style={styles.footerBtn}
          />
          <Button
            title={h.isPending ? t("common.loading") : t("common.save")}
            onPress={h.handleSubmit}
            loading={h.isPending}
            disabled={h.isPending}
            style={styles.footerBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing["5xl"] },
  field: { marginBottom: Spacing.xl },
  label: { marginBottom: Spacing.sm, fontWeight: "500" },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  iconBtn: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  colorRow: { flexDirection: "row", gap: Spacing.sm },
  colorBtn: { width: 32, height: 32, borderRadius: BorderRadius.full, borderWidth: 2 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  typeBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm, borderWidth: 1.5,
  },
  deleteBtn: { marginBottom: Spacing.lg },
  footerRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.lg },
  footerBtn: { flex: 1 },
});

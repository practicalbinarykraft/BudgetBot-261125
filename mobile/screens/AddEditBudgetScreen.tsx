import React from "react";
import {
  View,
  ScrollView,
  Pressable,
} from "react-native";
import { KeyboardAvoidingView } from "@/components/KeyboardAvoidingView";
import { ThemedText } from "../components/ThemedText";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useTheme } from "../hooks/useTheme";
import { useAddEditBudgetScreen } from "../hooks/useAddEditBudgetScreen";
import { styles } from "./styles/addEditBudgetStyles";
import { useTranslation } from "../i18n";

export default function AddEditBudgetScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const {
    isEditing, categoryId, setCategoryId, limitAmount, setLimitAmount,
    period, setPeriod, expenseCategories, isPending, handleSave, periods,
  } = useAddEditBudgetScreen();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <ThemedText type="small" color={theme.textSecondary} style={styles.label}>
            {t("budgets.category")}
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {expenseCategories.map((cat) => {
              const isSelected = categoryId === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setCategoryId(isSelected ? null : cat.id)}
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
          </ScrollView>
          {expenseCategories.length === 0 ? (
            <ThemedText type="small" color={theme.textTertiary}>
              {t("categories.no_categories")}
            </ThemedText>
          ) : null}
        </View>

        <Input
          label={t("budgets.limit")}
          value={limitAmount}
          onChangeText={setLimitAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          containerStyle={styles.field}
        />

        <View style={styles.field}>
          <ThemedText type="small" color={theme.textSecondary} style={styles.label}>
            {t("budgets.period")}
          </ThemedText>
          <View style={styles.toggleRow}>
            {periods.map((p) => {
              const isActive = period === p.key;
              return (
                <Pressable
                  key={p.key}
                  onPress={() => setPeriod(p.key)}
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: isActive ? theme.primary : theme.secondary,
                      borderColor: isActive ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <ThemedText type="h4" color={isActive ? "#ffffff" : theme.textSecondary}>
                    {p.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button
          title={isEditing ? t("common.save") : t("budgets.add_budget")}
          onPress={handleSave}
          loading={isPending}
          disabled={isPending}
          style={styles.saveBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

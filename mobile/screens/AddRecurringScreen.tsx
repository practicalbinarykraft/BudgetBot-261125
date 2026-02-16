import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import { KeyboardAvoidingView } from "@/components/KeyboardAvoidingView";
import { ThemedText } from "../components/ThemedText";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import {
  useAddRecurringScreen,
  FREQUENCY_OPTIONS,
  CURRENCY_OPTIONS,
} from "../hooks/useAddRecurringScreen";

export default function AddRecurringScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const h = useAddRecurringScreen();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Description"
          value={h.description}
          onChangeText={h.setDescription}
          placeholder="e.g. Netflix, Rent, Salary"
          containerStyle={styles.field}
        />

        {/* Type toggle */}
        <View style={styles.field}>
          <ThemedText type="small" color={theme.textSecondary} style={styles.label}>
            {"Type"}
          </ThemedText>
          <View style={styles.toggleRow}>
            {(["expense", "income"] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => h.setType(t)}
                style={[
                  styles.toggleBtn,
                  {
                    backgroundColor: h.type === t ? theme[t] : theme.secondary,
                    borderColor: h.type === t ? theme[t] : theme.border,
                  },
                ]}
              >
                <ThemedText
                  type="bodySm"
                  color={h.type === t ? "#ffffff" : theme.textSecondary}
                >
                  {t === "expense" ? "Expense" : "Income"}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Amount + Currency */}
        <View style={styles.row}>
          <View style={styles.rowHalf}>
            <Input
              label="Amount"
              value={h.amount}
              onChangeText={h.setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.rowHalf}>
            <ThemedText type="small" color={theme.textSecondary} style={styles.label}>
              {"Currency"}
            </ThemedText>
            {[CURRENCY_OPTIONS.slice(0, 3), CURRENCY_OPTIONS.slice(3)].map((row, i) => (
              <View key={i} style={[styles.currencyRow, i > 0 && { marginTop: Spacing.xs }]}>
                {row.map((c) => {
                  const isActive = h.currency === c.key;
                  return (
                    <Pressable
                      key={c.key}
                      onPress={() => h.setCurrency(c.key)}
                      style={[
                        styles.currencyBtn,
                        {
                          backgroundColor: isActive ? theme.primary : theme.secondary,
                          borderColor: isActive ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <ThemedText type="small" color={isActive ? "#ffffff" : theme.text}>
                        {c.key}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Frequency */}
        <View style={styles.field}>
          <ThemedText type="small" color={theme.textSecondary} style={styles.label}>
            {"Frequency"}
          </ThemedText>
          <View style={styles.frequencyRow}>
            {FREQUENCY_OPTIONS.map((f) => {
              const isActive = h.frequency === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => h.setFrequency(f.key)}
                  style={[
                    styles.frequencyBtn,
                    {
                      backgroundColor: isActive ? theme.primary : theme.secondary,
                      borderColor: isActive ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <ThemedText type="small" color={isActive ? "#ffffff" : theme.text}>
                    {f.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Input
          label="Category (optional)"
          value={h.category}
          onChangeText={h.setCategory}
          placeholder="e.g. Subscriptions"
          containerStyle={styles.field}
        />

        <Input
          label="Next Date"
          value={h.nextDate}
          onChangeText={h.setNextDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          containerStyle={styles.field}
        />

        <View style={styles.footerRow}>
          <Button
            title={t("common.cancel")}
            variant="outline"
            onPress={() => h.navigation.goBack()}
            style={styles.footerBtn}
          />
          <Button
            title={h.createMutation.isPending ? t("common.loading") : t("recurring.add")}
            onPress={h.handleSubmit}
            loading={h.createMutation.isPending}
            disabled={h.createMutation.isPending}
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
  toggleRow: { flexDirection: "row", gap: Spacing.md },
  toggleBtn: { flex: 1, height: 44, borderRadius: BorderRadius.sm, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.xl },
  rowHalf: { flex: 1 },
  currencyRow: { flexDirection: "row", gap: Spacing.sm },
  currencyBtn: { flex: 1, height: 36, borderRadius: BorderRadius.sm, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  frequencyRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  frequencyBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, borderWidth: 1.5 },
  footerRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.lg },
  footerBtn: { flex: 1 },
});

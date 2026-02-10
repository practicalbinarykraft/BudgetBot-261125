import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { ThemedText } from "../components/ThemedText";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useAddTransactionScreen } from "../hooks/useAddTransactionScreen";

export default function AddTransactionScreen() {
  const { theme } = useTheme();
  const h = useAddTransactionScreen();

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
                type="h4"
                color={h.type === t ? "#ffffff" : theme.textSecondary}
              >
                {t === "expense" ? "Expense" : "Income"}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <Input
          label="Amount (USD)"
          value={h.amount}
          onChangeText={h.setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          containerStyle={styles.field}
        />

        <Input
          label="Description"
          value={h.description}
          onChangeText={h.setDescription}
          placeholder="What was it for?"
          containerStyle={styles.field}
        />

        {/* Category picker */}
        <View style={styles.field}>
          <ThemedText type="small" color={theme.textSecondary} style={styles.label}>
            {"Category"}
          </ThemedText>
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
          </ScrollView>
        </View>

        {/* Wallet picker */}
        <View style={styles.field}>
          <ThemedText type="small" color={theme.textSecondary} style={styles.label}>
            {"Wallet"}
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
            {"Tag (optional)"}
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
              <ThemedText type="small">{"No tag"}</ThemedText>
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
          title="Add Transaction"
          onPress={h.handleSubmit}
          loading={h.createMutation.isPending}
          disabled={h.createMutation.isPending}
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing["5xl"] },
  toggleRow: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.xl },
  toggleBtn: {
    flex: 1, height: 48, borderRadius: BorderRadius.sm,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  field: { marginBottom: Spacing.xl },
  label: { marginBottom: Spacing.sm },
  chipsRow: { gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  submitBtn: { marginTop: Spacing.lg },
});

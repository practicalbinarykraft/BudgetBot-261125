import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { ThemedText } from "../components/ThemedText";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Spacing, BorderRadius } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";

const PRIORITY_OPTIONS: { key: string; label: string }[] = [
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
];

export default function AddWishlistScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [priority, setPriority] = useState("medium");
  const [targetDate, setTargetDate] = useState("");

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/api/wishlist", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      navigation.goBack();
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      amount,
      priority,
      targetDate: targetDate || null,
      isPurchased: false,
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name — web: FormField name */}
        <Input
          label="Item Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. New laptop, Vacation"
          containerStyle={styles.field}
        />

        {/* Amount — web: FormField amount */}
        <Input
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          containerStyle={styles.field}
        />

        {/* Priority — web: Select low/medium/high */}
        <View style={styles.field}>
          <ThemedText type="small" color={theme.textSecondary} style={styles.label}>
            {"Priority"}
          </ThemedText>
          <View style={styles.priorityRow}>
            {PRIORITY_OPTIONS.map((p) => {
              const isActive = priority === p.key;
              return (
                <Pressable
                  key={p.key}
                  onPress={() => setPriority(p.key)}
                  style={[
                    styles.priorityBtn,
                    {
                      backgroundColor: isActive ? theme.primary : theme.secondary,
                      borderColor: isActive ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <ThemedText type="bodySm" color={isActive ? "#ffffff" : theme.text}>
                    {p.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Target Date — web: FormField targetDate */}
        <Input
          label="Target Date (optional)"
          value={targetDate}
          onChangeText={setTargetDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          containerStyle={styles.field}
        />

        {/* Footer — web: Cancel + Add */}
        <View style={styles.footerRow}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.footerBtn}
          />
          <Button
            title={createMutation.isPending ? "Adding..." : "Add Item"}
            onPress={handleSubmit}
            loading={createMutation.isPending}
            disabled={createMutation.isPending}
            style={styles.footerBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing["5xl"],
  },
  field: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "500",
  },
  priorityRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  priorityBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  footerRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  footerBtn: {
    flex: 1,
  },
});

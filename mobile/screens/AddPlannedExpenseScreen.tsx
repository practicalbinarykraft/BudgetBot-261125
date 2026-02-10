import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { ThemedText } from "../components/ThemedText";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";

export default function AddPlannedExpenseScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [targetDate, setTargetDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [category, setCategory] = useState("");

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/api/planned", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planned"] });
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
      targetDate,
      category: category.trim() || null,
      currency: "USD",
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Rent, Insurance" containerStyle={styles.field} />
        <Input label="Amount" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" containerStyle={styles.field} />
        <Input label="Target Date" value={targetDate} onChangeText={setTargetDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" containerStyle={styles.field} />
        <Input label="Category (optional)" value={category} onChangeText={setCategory} placeholder="e.g. Rent" containerStyle={styles.field} />

        <View style={styles.footerRow}>
          <Button title={t("common.cancel")} variant="outline" onPress={() => navigation.goBack()} style={styles.footerBtn} />
          <Button
            title={createMutation.isPending ? t("common.loading") : t("common.add")}
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
  content: { padding: Spacing.lg, paddingBottom: Spacing["5xl"] },
  field: { marginBottom: Spacing.xl },
  footerRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.lg },
  footerBtn: { flex: 1 },
});

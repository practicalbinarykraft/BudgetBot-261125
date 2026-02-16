import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
} from "react-native";
import { KeyboardAvoidingView } from "@/components/KeyboardAvoidingView";
import { uiAlert } from "@/lib/uiAlert";
import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import { completeTutorialStep } from "../lib/tutorial-step";

export default function AddPlannedIncomeScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expectedDate, setExpectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/api/planned-income", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planned-income"] });
      navigation.goBack();
      completeTutorialStep("planned_income");
    },
    onError: (error: Error) => {
      uiAlert(t("common.error"), error.message);
    },
  });

  const handleSubmit = () => {
    if (!description.trim()) {
      uiAlert(t("common.error"), t("planned_income.error_enter_description"));
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      uiAlert(t("common.error"), t("planned_income.error_enter_amount"));
      return;
    }
    createMutation.mutate({
      description: description.trim(),
      amount,
      expectedDate,
      currency: "USD",
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label={t("common.description")} value={description} onChangeText={setDescription} placeholder={t("planned_income.description_placeholder")} containerStyle={styles.field} />
        <Input label={t("common.amount")} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" containerStyle={styles.field} />
        <Input label={t("planned_income.expected_date")} value={expectedDate} onChangeText={setExpectedDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" containerStyle={styles.field} />

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

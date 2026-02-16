import React, { useState } from "react";
import {
  View,
  ScrollView,
  Platform,
} from "react-native";
import { KeyboardAvoidingView } from "@/components/KeyboardAvoidingView";
import { uiAlert } from "@/lib/uiAlert";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../i18n";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import { styles } from "./AddEditAssetScreen.styles";
import { CurrencySelector } from "./CurrencySelector";

type AddEditAssetRoute = RouteProp<
  { AddEditAsset: { type?: string } },
  "AddEditAsset"
>;

export default function AddEditAssetScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<AddEditAssetRoute>();
  const assetType = route.params?.type || "asset";

  const [name, setName] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [monthlyExpense, setMonthlyExpense] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/api/assets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["assets-summary"] });
      navigation.goBack();
    },
    onError: (error: Error) => uiAlert(t("common.error"), error.message),
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      uiAlert(t("common.error"), t("assets.error_enter_name"));
      return;
    }
    if (!currentValue || parseFloat(currentValue) <= 0) {
      uiAlert(t("common.error"), t("assets.error_enter_value"));
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      type: assetType,
      currentValue,
      currency,
      purchasePrice: purchasePrice || null,
      purchaseDate: purchaseDate || null,
      monthlyIncome: monthlyIncome || "0",
      monthlyExpense: monthlyExpense || "0",
      location: location || null,
      notes: notes || null,
    });
  };

  const isAsset = assetType === "asset";

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
          label={t("assets.form_name")}
          value={name}
          onChangeText={setName}
          placeholder={isAsset ? t("assets.form_name_placeholder") : t("assets.form_name_placeholder_liability")}
          containerStyle={styles.field}
        />

        <Input
          label={t("assets.form_current_value")}
          value={currentValue}
          onChangeText={setCurrentValue}
          placeholder="0.00"
          keyboardType="decimal-pad"
          containerStyle={styles.field}
        />

        <CurrencySelector currency={currency} onSelect={setCurrency} />

        <Input
          label={t("assets.form_purchase_price")}
          value={purchasePrice}
          onChangeText={setPurchasePrice}
          placeholder="0.00"
          keyboardType="decimal-pad"
          containerStyle={styles.field}
        />

        <Input
          label={t("assets.form_purchase_date")}
          value={purchaseDate}
          onChangeText={setPurchaseDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          containerStyle={styles.field}
        />

        <Input
          label={t("assets.form_monthly_income")}
          value={monthlyIncome}
          onChangeText={setMonthlyIncome}
          placeholder="0.00"
          keyboardType="decimal-pad"
          description={t("assets.form_income_hint")}
          containerStyle={styles.field}
        />

        <Input
          label={t("assets.form_monthly_expense")}
          value={monthlyExpense}
          onChangeText={setMonthlyExpense}
          placeholder="0.00"
          keyboardType="decimal-pad"
          description={t("assets.form_expense_hint")}
          containerStyle={styles.field}
        />

        <Input
          label={t("assets.form_location")}
          value={location}
          onChangeText={setLocation}
          placeholder={t("assets.form_location_placeholder")}
          containerStyle={styles.field}
        />

        <Input
          label={t("assets.form_notes")}
          value={notes}
          onChangeText={setNotes}
          placeholder={t("assets.form_notes_placeholder")}
          multiline
          numberOfLines={3}
          containerStyle={styles.field}
        />

        <View style={styles.footerRow}>
          <Button
            title={t("common.cancel")}
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.footerBtn}
          />
          <Button
            title={
              createMutation.isPending
                ? t("common.loading")
                : t("common.add")
            }
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


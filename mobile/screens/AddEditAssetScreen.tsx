import React, { useState } from "react";
import {
  View,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useTheme } from "../hooks/useTheme";
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
    onError: (error: Error) => Alert.alert("Error", error.message),
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }
    if (!currentValue || parseFloat(currentValue) <= 0) {
      Alert.alert("Error", "Please enter a valid current value");
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
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder={isAsset ? "e.g. Car, Apartment" : "e.g. Mortgage, Loan"}
          containerStyle={styles.field}
        />

        <Input
          label="Current Value"
          value={currentValue}
          onChangeText={setCurrentValue}
          placeholder="0.00"
          keyboardType="decimal-pad"
          containerStyle={styles.field}
        />

        <CurrencySelector currency={currency} onSelect={setCurrency} />

        <Input
          label="Purchase Price (optional)"
          value={purchasePrice}
          onChangeText={setPurchasePrice}
          placeholder="0.00"
          keyboardType="decimal-pad"
          containerStyle={styles.field}
        />

        <Input
          label="Purchase Date (optional)"
          value={purchaseDate}
          onChangeText={setPurchaseDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          containerStyle={styles.field}
        />

        <Input
          label="Monthly Income (optional)"
          value={monthlyIncome}
          onChangeText={setMonthlyIncome}
          placeholder="0.00"
          keyboardType="decimal-pad"
          description="e.g. Rental income"
          containerStyle={styles.field}
        />

        <Input
          label="Monthly Expense (optional)"
          value={monthlyExpense}
          onChangeText={setMonthlyExpense}
          placeholder="0.00"
          keyboardType="decimal-pad"
          description="e.g. Maintenance, insurance"
          containerStyle={styles.field}
        />

        <Input
          label="Location (optional)"
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. New York"
          containerStyle={styles.field}
        />

        <Input
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional information..."
          multiline
          numberOfLines={3}
          containerStyle={styles.field}
        />

        <View style={styles.footerRow}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.footerBtn}
          />
          <Button
            title={
              createMutation.isPending
                ? "Adding..."
                : `Add ${isAsset ? "Asset" : "Liability"}`
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


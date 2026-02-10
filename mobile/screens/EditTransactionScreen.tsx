import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Spacing } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useEditTransactionScreen } from "../hooks/useEditTransactionScreen";
import { TypeToggle } from "../components/edit-transaction/TypeToggle";
import { CurrencySelector } from "../components/edit-transaction/CurrencySelector";
import { CategoryChips } from "../components/edit-transaction/CategoryChips";
import { TagChips } from "../components/edit-transaction/TagChips";
import { FinancialTypeSelector } from "../components/edit-transaction/FinancialTypeSelector";

export default function EditTransactionScreen() {
  const { theme } = useTheme();
  const {
    navigation,
    type,
    setType,
    amount,
    setAmount,
    currency,
    setCurrency,
    description,
    setDescription,
    selectedCategory,
    setSelectedCategory,
    financialType,
    setFinancialType,
    personalTagId,
    setPersonalTagId,
    date,
    setDate,
    allCategories,
    tags,
    updateMutation,
    handleSubmit,
  } = useEditTransactionScreen();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TypeToggle type={type} onTypeChange={setType} />

        <CurrencySelector
          amount={amount}
          onAmountChange={setAmount}
          currency={currency}
          onCurrencyChange={setCurrency}
        />

        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="What was it for?"
          containerStyle={styles.field}
        />

        <CategoryChips
          allCategories={allCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onCreateNew={() =>
            navigation.navigate("AddEditCategory", {
              category: undefined,
            })
          }
        />

        <TagChips
          tags={tags}
          personalTagId={personalTagId}
          onSelectTag={setPersonalTagId}
        />

        <FinancialTypeSelector
          financialType={financialType}
          onFinancialTypeChange={setFinancialType}
        />

        <Input
          label="Date"
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
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
              updateMutation.isPending ? "Updating..." : "Update Transaction"
            }
            onPress={handleSubmit}
            loading={updateMutation.isPending}
            disabled={updateMutation.isPending}
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
  footerRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  footerBtn: {
    flex: 1,
  },
});

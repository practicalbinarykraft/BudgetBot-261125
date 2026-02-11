import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
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
import { useTranslation } from "../i18n";

export default function EditTransactionScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
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
    deleteMutation,
    handleSubmit,
    handleDelete,
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
          label={t("transactions.description")}
          value={description}
          onChangeText={setDescription}
          placeholder={t("transactions.placeholder_description")}
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
          label={t("transactions.date")}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          containerStyle={styles.field}
        />

        <Button
          title={t("common.delete")}
          variant="destructive"
          onPress={handleDelete}
          loading={deleteMutation.isPending}
          disabled={deleteMutation.isPending}
          icon={<Feather name="trash-2" size={14} color={theme.destructiveForeground} />}
          style={styles.deleteBtn}
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
              updateMutation.isPending ? t("transactions.adding") : t("transactions.update_transaction")
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
  deleteBtn: {
    marginTop: Spacing.xl,
    borderColor: "#dc262640",
  },
  footerBtn: {
    flex: 1,
  },
});

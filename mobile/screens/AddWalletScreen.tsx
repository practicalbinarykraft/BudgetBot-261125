import React, { useState } from "react";
import {
  View,
  ScrollView,
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
import { useTheme } from "../hooks/useTheme";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import { styles } from "./styles/addWalletStyles";
import { useTranslation } from "../i18n";

type WalletType = "card" | "cash" | "crypto";

const walletTypeKeys: { key: WalletType; labelKey: string }[] = [
  { key: "card", labelKey: "wallets.card" },
  { key: "cash", labelKey: "wallets.cash" },
  { key: "crypto", labelKey: "wallets.crypto" },
];

const currencies = [
  { key: "USD", label: "USD ($)" },
  { key: "RUB", label: "RUB (\u20BD)" },
  { key: "IDR", label: "IDR (Rp)" },
];

export default function AddWalletScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [type, setType] = useState<WalletType>("card");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState("USD");

  const createMutation = useMutation({
    mutationFn: (data: { name: string; type: string; balance: string; currency: string }) =>
      api.post("/api/wallets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      navigation.goBack();
    },
    onError: (error: Error) => Alert.alert("Error", error.message),
  });

  const handleSubmit = () => {
    if (!name.trim()) { Alert.alert("Error", "Please enter a wallet name"); return; }
    if (!balance || parseFloat(balance) < 0) { Alert.alert("Error", "Please enter a valid balance"); return; }
    createMutation.mutate({ name: name.trim(), type, balance, currency });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label={t("wallets.name")} value={name} onChangeText={setName} placeholder="e.g. My Bank Account" containerStyle={styles.field} />
        <View style={styles.field}>
          <ThemedText type="small" color={theme.textSecondary} style={styles.label}>{t("wallets.type")}</ThemedText>
          <View style={styles.toggleRow}>
            {walletTypeKeys.map((wt) => {
              const isActive = type === wt.key;
              return (
                <Pressable key={wt.key} onPress={() => setType(wt.key)} style={[styles.toggleBtn, { backgroundColor: isActive ? theme.primary : theme.secondary, borderColor: isActive ? theme.primary : theme.border }]}>
                  <ThemedText type="bodySm" color={isActive ? "#ffffff" : theme.text}>{t(wt.labelKey)}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.rowHalf}>
            <Input label={t("wallets.balance")} value={balance} onChangeText={setBalance} placeholder="0.00" keyboardType="decimal-pad" />
          </View>
          <View style={styles.rowHalf}>
            <ThemedText type="small" color={theme.textSecondary} style={styles.label}>{"Currency"}</ThemedText>
            <View style={styles.currencyRow}>
              {currencies.map((c) => {
                const isActive = currency === c.key;
                return (
                  <Pressable key={c.key} onPress={() => setCurrency(c.key)} style={[styles.currencyBtn, { backgroundColor: isActive ? theme.primary : theme.secondary, borderColor: isActive ? theme.primary : theme.border }]}>
                    <ThemedText type="small" color={isActive ? "#ffffff" : theme.text}>{c.key}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
        <View style={styles.footerRow}>
          <Button title={t("common.cancel")} variant="outline" onPress={() => navigation.goBack()} style={styles.footerBtn} />
          <Button title={createMutation.isPending ? t("transactions.adding") : t("wallets.add_wallet")} onPress={handleSubmit} loading={createMutation.isPending} disabled={createMutation.isPending} style={styles.footerBtn} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

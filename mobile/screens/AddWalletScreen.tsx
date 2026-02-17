import React, { useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { KeyboardAvoidingView } from "@/components/KeyboardAvoidingView";
import { uiAlert } from "@/lib/uiAlert";
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
import { useSpotlightTarget } from "../tutorial/spotlight";
import { completeTutorialStep } from "../lib/tutorial-step";
import { dismissSpotlightFlow } from "../lib/spotlight-ref";

type WalletType = "card" | "cash" | "crypto";

const walletTypeKeys: { key: WalletType; labelKey: string }[] = [
  { key: "card", labelKey: "wallets.type_card" },
  { key: "cash", labelKey: "wallets.type_cash" },
  { key: "crypto", labelKey: "wallets.type_crypto" },
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
  const typeTarget = useSpotlightTarget("wallet_type_row");
  const currencyTarget = useSpotlightTarget("wallet_currency_row");
  const submitTarget = useSpotlightTarget("wallet_submit_btn");

  const createMutation = useMutation({
    mutationFn: (data: { name: string; type: string; balance: string; currency: string }) =>
      api.post("/api/wallets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      dismissSpotlightFlow();
      completeTutorialStep("create_wallet");
      navigation.goBack();
    },
    onError: (error: Error) => uiAlert(t("common.error"), error.message),
  });

  const handleSubmit = () => {
    if (!name.trim()) { uiAlert(t("common.error"), t("wallets.error_enter_name")); return; }
    if (!balance || parseFloat(balance) < 0) { uiAlert(t("common.error"), t("wallets.error_enter_balance")); return; }
    createMutation.mutate({ name: name.trim(), type, balance, currency });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label={t("wallets.name")} value={name} onChangeText={setName} placeholder={t("wallets.name_placeholder")} containerStyle={styles.field} />
        <View style={styles.field}>
          <ThemedText type="small" color={theme.textSecondary} style={styles.label}>{t("wallets.type")}</ThemedText>
          <View style={styles.toggleRow} ref={typeTarget.ref} onLayout={typeTarget.onLayout} collapsable={false}>
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
            <ThemedText type="small" color={theme.textSecondary} style={styles.label}>{t("common.currency")}</ThemedText>
            <View style={styles.currencyRow} ref={currencyTarget.ref} onLayout={currencyTarget.onLayout} collapsable={false}>
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
          <View ref={submitTarget.ref} onLayout={submitTarget.onLayout} collapsable={false} style={styles.footerBtn}>
            <Button title={createMutation.isPending ? t("transactions.adding") : t("wallets.add_wallet")} onPress={handleSubmit} loading={createMutation.isPending} disabled={createMutation.isPending} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

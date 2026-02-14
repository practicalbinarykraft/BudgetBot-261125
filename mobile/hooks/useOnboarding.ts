import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";

const STORAGE_KEY = "budgetbot_onboarding_status";

export type Step = "welcome" | "wallet" | "success";
export type OnboardingStatus = "never" | "dismissed" | "completed";

export function useOnboarding(userId: number | undefined) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [walletName, setWalletName] = useState("");
  const [walletType, setWalletType] = useState<"card" | "cash" | "crypto">("card");
  const [initialBalance, setInitialBalance] = useState("0");

  useEffect(() => {
    if (!userId) return;
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (!val || val === "never") {
        setVisible(true);
      }
    });
  }, [userId]);

  const walletMutation = useMutation({
    mutationFn: () =>
      api.post("/api/wallets", {
        name: walletName,
        type: walletType,
        balance: initialBalance || "0",
        currency: "USD",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setStep("success");
    },
  });

  const skip = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEY, "dismissed");
    setVisible(false);
  }, []);

  const complete = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEY, "completed");
    setVisible(false);
  }, []);

  const open = useCallback(() => {
    setStep("welcome");
    setVisible(true);
  }, []);

  return {
    visible,
    step, setStep,
    walletName, setWalletName,
    walletType, setWalletType,
    initialBalance, setInitialBalance,
    walletMutation,
    skip,
    complete,
    open,
  };
}

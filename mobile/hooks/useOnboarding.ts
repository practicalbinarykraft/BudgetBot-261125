import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";

const ONBOARDING_KEY = "budgetbot_onboarding_completed";

export type Step = "welcome" | "wallet" | "success";

export function useOnboarding(userId: number | undefined) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [walletName, setWalletName] = useState("");
  const [walletType, setWalletType] = useState<"card" | "cash" | "crypto">("card");
  const [initialBalance, setInitialBalance] = useState("0");

  useEffect(() => {
    if (!userId) return;
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      if (val !== "true") {
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

  const complete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    setVisible(false);
  };

  return {
    visible,
    step, setStep,
    walletName, setWalletName,
    walletType, setWalletType,
    initialBalance, setInitialBalance,
    walletMutation,
    complete,
  };
}

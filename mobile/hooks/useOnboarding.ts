import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import { completeTutorialStep } from "../lib/tutorial-step";

export type Step = "welcome" | "wallet" | "success";

export function useOnboarding() {
  const [step, setStep] = useState<Step>("welcome");
  const [walletName, setWalletName] = useState("");
  const [walletType, setWalletType] = useState<"card" | "cash" | "crypto">("card");
  const [initialBalance, setInitialBalance] = useState("0");

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
      completeTutorialStep("create_wallet");
    },
  });

  const reset = useCallback(() => {
    setStep("welcome");
    setWalletName("");
    setWalletType("card");
    setInitialBalance("0");
  }, []);

  return {
    step, setStep,
    walletName, setWalletName,
    walletType, setWalletType,
    initialBalance, setInitialBalance,
    walletMutation,
    reset,
  };
}

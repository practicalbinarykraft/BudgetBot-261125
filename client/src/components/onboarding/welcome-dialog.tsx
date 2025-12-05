/**
 * Welcome Onboarding Dialog
 *
 * Shows for new users after first login.
 * Guides them through creating their first wallet.
 *
 * Steps:
 * 1. Welcome message
 * 2. Create first wallet
 * 3. Success - go to dashboard
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/i18n";
import { apiRequest } from "@/lib/queryClient";
import { Wallet, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

const ONBOARDING_KEY = "budgetbot_onboarding_completed";

interface WelcomeDialogProps {
  open: boolean;
  onComplete: () => void;
}

type Step = "welcome" | "wallet" | "success";

export function WelcomeDialog({ open, onComplete }: WelcomeDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("welcome");
  const [walletName, setWalletName] = useState("");
  const [walletType, setWalletType] = useState("card");
  const [walletBalance, setWalletBalance] = useState("");

  const createWalletMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      type: string;
      balance: string;
      currency: string;
    }) => {
      const res = await apiRequest("POST", "/api/wallets", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      setStep("success");
    },
  });

  const handleWalletSubmit = () => {
    if (!walletName.trim()) return;
    createWalletMutation.mutate({
      name: walletName,
      type: walletType,
      balance: walletBalance || "0",
      currency: "USD",
    });
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
      >
        {step === "welcome" && (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Sparkles className="w-8 h-8 text-primary" aria-hidden="true" />
                </div>
              </div>
              <DialogTitle id="onboarding-title" className="text-center text-xl">
                {t("onboarding.welcome_title")}
              </DialogTitle>
              <DialogDescription id="onboarding-description" className="text-center">
                {t("onboarding.welcome_description")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Wallet className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm">{t("onboarding.feature_wallets")}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Sparkles className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm">{t("onboarding.feature_ai")}</span>
              </div>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                onClick={() => setStep("wallet")}
                className="w-full"
                aria-label={t("onboarding.get_started")}
              >
                {t("onboarding.get_started")}
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="w-full"
                aria-label={t("onboarding.skip")}
              >
                {t("onboarding.skip")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "wallet" && (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Wallet className="w-8 h-8 text-primary" aria-hidden="true" />
                </div>
              </div>
              <DialogTitle className="text-center text-xl">
                {t("onboarding.create_wallet_title")}
              </DialogTitle>
              <DialogDescription className="text-center">
                {t("onboarding.create_wallet_description")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="wallet-name">{t("onboarding.wallet_name")}</Label>
                <Input
                  id="wallet-name"
                  placeholder={t("onboarding.wallet_name_placeholder")}
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  aria-required="true"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wallet-type">{t("onboarding.wallet_type")}</Label>
                <Select value={walletType} onValueChange={setWalletType}>
                  <SelectTrigger id="wallet-type" aria-label={t("onboarding.wallet_type")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">{t("onboarding.type_card")}</SelectItem>
                    <SelectItem value="cash">{t("onboarding.type_cash")}</SelectItem>
                    <SelectItem value="crypto">{t("onboarding.type_crypto")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wallet-balance">{t("onboarding.initial_balance")}</Label>
                <Input
                  id="wallet-balance"
                  type="number"
                  placeholder="0"
                  value={walletBalance}
                  onChange={(e) => setWalletBalance(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                onClick={handleWalletSubmit}
                disabled={!walletName.trim() || createWalletMutation.isPending}
                className="w-full"
                aria-label={t("onboarding.create_wallet")}
              >
                {createWalletMutation.isPending
                  ? t("common.creating")
                  : t("onboarding.create_wallet")}
              </Button>
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="w-full"
                aria-label={t("onboarding.skip")}
              >
                {t("onboarding.skip")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "success" && (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle2 className="w-8 h-8 text-green-600" aria-hidden="true" />
                </div>
              </div>
              <DialogTitle className="text-center text-xl">
                {t("onboarding.success_title")}
              </DialogTitle>
              <DialogDescription className="text-center">
                {t("onboarding.success_description")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-4">
              <Button
                onClick={handleComplete}
                className="w-full"
                aria-label={t("onboarding.go_to_dashboard")}
              >
                {t("onboarding.go_to_dashboard")}
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to check if onboarding should be shown
 */
export function useOnboarding() {
  const isCompleted = localStorage.getItem(ONBOARDING_KEY) === "true";
  return { showOnboarding: !isCompleted };
}

/**
 * Mark onboarding as completed
 */
export function completeOnboarding() {
  localStorage.setItem(ONBOARDING_KEY, "true");
}

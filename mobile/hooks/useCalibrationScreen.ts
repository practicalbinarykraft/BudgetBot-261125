import { useState, useMemo } from "react";
import { uiAlert } from "@/lib/uiAlert";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient, normalizePaginatedData } from "../lib/query-client";
import type { Wallet, PaginatedResponse } from "../types";

export interface WalletPreviewItem {
  wallet: Wallet;
  actualBalance: number;
  currentBalance: number;
  difference: number;
  percentChange: number;
  status: "same" | "warning" | "critical";
  willCreateTransaction: boolean;
  hasChanged: boolean;
}

export interface CalibrationSummaryData {
  changedWallets: number;
  transactionsCount: number;
  totalDifferenceUSD: number;
}

export const currencySymbols: Record<string, string> = {
  USD: "$",
  RUB: "\u20BD",
  EUR: "\u20AC",
  IDR: "Rp",
  KRW: "\u20A9",
  CNY: "\u00A5",
};

export function useCalibrationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const walletsQuery = useQuery({
    queryKey: ["wallets"],
    queryFn: () => api.get<PaginatedResponse<Wallet>>("/api/wallets?limit=50"),
  });

  const wallets = normalizePaginatedData<Wallet>(walletsQuery.data);

  const [balances, setBalances] = useState<Record<number, string>>({});

  const walletPreview: WalletPreviewItem[] = useMemo(() => {
    return wallets.map((wallet) => {
      const inputValue = balances[wallet.id];
      const actualBalance = inputValue
        ? parseFloat(inputValue)
        : parseFloat(wallet.balance);
      const currentBalance = parseFloat(wallet.balance);
      const difference = actualBalance - currentBalance;
      const percentChange =
        currentBalance !== 0
          ? Math.abs(difference / currentBalance) * 100
          : 0;

      let status: "same" | "warning" | "critical" = "same";
      if (Math.abs(difference) > 0.01) {
        status =
          percentChange > 10
            ? "critical"
            : percentChange > 5
              ? "warning"
              : "same";
      }

      const willCreateTransaction = difference < -0.01;

      return {
        wallet,
        actualBalance,
        currentBalance,
        difference,
        percentChange,
        status,
        willCreateTransaction,
        hasChanged:
          inputValue !== undefined && Math.abs(difference) > 0.01,
      };
    });
  }, [wallets, balances]);

  const summary: CalibrationSummaryData = useMemo(() => {
    const changedWallets = walletPreview.filter((w) => w.hasChanged);
    const transactionsCount = walletPreview.filter(
      (w) => w.willCreateTransaction && w.hasChanged
    ).length;
    const totalDifferenceUSD = walletPreview
      .filter((w) => w.hasChanged)
      .reduce((sum, w) => {
        const balance = parseFloat(w.wallet.balance);
        const usdDiff =
          w.wallet.currency === "USD"
            ? w.difference
            : w.wallet.balanceUsd && balance !== 0
              ? (w.difference / balance) * parseFloat(w.wallet.balanceUsd)
              : 0;
        return sum + usdDiff;
      }, 0);

    return {
      changedWallets: changedWallets.length,
      transactionsCount,
      totalDifferenceUSD,
    };
  }, [walletPreview]);

  const [isCalibrating, setIsCalibrating] = useState(false);

  const handleCalibrateAll = async () => {
    setIsCalibrating(true);
    let calibratedCount = 0;
    let transactionsCreated = 0;

    for (const preview of walletPreview) {
      if (!preview.hasChanged) continue;

      try {
        const result = await api.post<{
          calibration: any;
          transactionCreated: boolean;
        }>(`/api/wallets/${preview.wallet.id}/calibrate`, {
          actualBalance: parseFloat(balances[preview.wallet.id]),
        });

        calibratedCount++;
        if (result.transactionCreated) {
          transactionsCreated++;
        }
      } catch (error: any) {
        uiAlert(
          "Error",
          `Failed to calibrate ${preview.wallet.name}: ${error.message}`
        );
      }
    }

    setIsCalibrating(false);

    if (calibratedCount > 0) {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });

      uiAlert(
        "Calibration complete",
        `${calibratedCount} wallet(s) calibrated. ${transactionsCreated} unaccounted expense(s) created.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } else {
      uiAlert("No changes", "No wallets were modified.");
    }
  };

  return {
    navigation,
    walletsQuery,
    wallets,
    balances,
    setBalances,
    walletPreview,
    summary,
    isCalibrating,
    handleCalibrateAll,
  };
}

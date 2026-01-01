/**
 * Hook to fetch and track user's AI message credits balance
 */

import { useQuery } from "@tanstack/react-query";

export interface CreditBalance {
  messagesRemaining: number;
  totalGranted: number;
  totalUsed: number;
}

async function fetchCreditBalance(): Promise<CreditBalance> {
  const res = await fetch("/api/ai/chat/balance", {
    credentials: "include"
  });

  if (!res.ok) {
    throw new Error("Failed to fetch credit balance");
  }

  return res.json();
}

export function useCreditsBalance() {
  return useQuery({
    queryKey: ["credits-balance"],
    queryFn: fetchCreditBalance,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true
  });
}

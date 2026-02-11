import { useState } from "react";
import { Alert } from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import type { TwoFactorStatus, TwoFactorSetup } from "../types";

export function useTwoFactor() {
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState("");

  const statusQuery = useQuery({
    queryKey: ["2fa-status"],
    queryFn: () => api.get<TwoFactorStatus>("/api/2fa/status"),
  });

  const setupMutation = useMutation({
    mutationFn: () => api.post<TwoFactorSetup>("/api/2fa/setup", {}),
    onSuccess: (data) => {
      setSetupData(data);
      setShowSetup(true);
      setCode("");
    },
    onError: (error: Error) => Alert.alert("Error", error.message),
  });

  const enableMutation = useMutation({
    mutationFn: (data: { secret: string; token: string }) =>
      api.post("/api/2fa/enable", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
      setShowSetup(false);
      setSetupData(null);
      setCode("");
      Alert.alert("Success", "Two-factor authentication enabled");
    },
    onError: () => Alert.alert("Error", "Invalid verification code"),
  });

  const disableMutation = useMutation({
    mutationFn: (data: { token: string }) =>
      api.post("/api/2fa/disable", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
      setShowDisable(false);
      setCode("");
      Alert.alert("Success", "Two-factor authentication disabled");
    },
    onError: () => Alert.alert("Error", "Invalid verification code"),
  });

  const handleEnable = () => {
    if (!setupData || code.length !== 6) return;
    enableMutation.mutate({ secret: setupData.secret, token: code });
  };

  const handleDisable = () => {
    if (code.length !== 6) return;
    disableMutation.mutate({ token: code });
  };

  const handleCodeChange = (text: string) => {
    setCode(text.replace(/\D/g, "").slice(0, 6));
  };

  const enabled = statusQuery.data?.enabled ?? false;

  return {
    showSetup, setShowSetup,
    showDisable, setShowDisable,
    setupData,
    code,
    enabled,
    setupMutation,
    enableMutation,
    disableMutation,
    handleEnable,
    handleDisable,
    handleCodeChange,
  };
}

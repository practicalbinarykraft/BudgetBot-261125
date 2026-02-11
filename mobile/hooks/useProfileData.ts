import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import { queryClient } from "../lib/query-client";
import { exchangeRateFields, timezones } from "../components/profile/profileConstants";
import type { ExchangeRateKey } from "../components/profile/profileConstants";
import type { Settings } from "../types";

export function useProfileData() {
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguage] = useState("en");
  const [telegramNotifications, setTelegramNotifications] = useState(false);
  const [timezone, setTimezone] = useState("");
  const [notificationTime, setNotificationTime] = useState("09:00");
  const [anthropicApiKey, setAnthropicApiKey] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [exchangeRates, setExchangeRates] = useState<Record<ExchangeRateKey, string>>({
    exchangeRateRUB: "",
    exchangeRateIDR: "",
    exchangeRateKRW: "",
    exchangeRateEUR: "",
    exchangeRateCNY: "",
  });
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<Settings>("/api/settings"),
  });

  useEffect(() => {
    const s = settingsQuery.data;
    if (!s) return;
    setCurrency(s.currency || "USD");
    setLanguage(s.language || "en");
    setTelegramNotifications(s.telegramNotifications ?? false);
    setTimezone(s.timezone || "");
    setNotificationTime(s.notificationTime || "09:00");
    setAnthropicApiKey(s.anthropicApiKey || "");
    setOpenaiApiKey(s.openaiApiKey || "");
    setExchangeRates({
      exchangeRateRUB: s.exchangeRateRUB != null ? String(s.exchangeRateRUB) : "",
      exchangeRateIDR: s.exchangeRateIDR != null ? String(s.exchangeRateIDR) : "",
      exchangeRateKRW: s.exchangeRateKRW != null ? String(s.exchangeRateKRW) : "",
      exchangeRateEUR: s.exchangeRateEUR != null ? String(s.exchangeRateEUR) : "",
      exchangeRateCNY: s.exchangeRateCNY != null ? String(s.exchangeRateCNY) : "",
    });
  }, [settingsQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.patch("/api/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      Alert.alert("Success", "Settings saved");
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleSave = () => {
    const data: Record<string, unknown> = {
      currency,
      language,
      telegramNotifications,
      timezone: timezone || null,
      notificationTime,
      anthropicApiKey: anthropicApiKey || null,
      openaiApiKey: openaiApiKey || null,
    };
    for (const f of exchangeRateFields) {
      const val = exchangeRates[f.key];
      data[f.key] = val ? parseFloat(val) : null;
    }
    updateMutation.mutate(data);
  };

  const updateExchangeRate = (key: ExchangeRateKey, value: string) => {
    setExchangeRates((prev) => ({ ...prev, [key]: value }));
  };

  const selectedTz = timezones.find((t) => t.key === timezone);

  return {
    currency,
    setCurrency,
    language,
    setLanguage,
    telegramNotifications,
    setTelegramNotifications,
    timezone,
    setTimezone,
    notificationTime,
    setNotificationTime,
    anthropicApiKey,
    setAnthropicApiKey,
    openaiApiKey,
    setOpenaiApiKey,
    exchangeRates,
    updateExchangeRate,
    showTimezoneModal,
    setShowTimezoneModal,
    settingsQuery,
    updateMutation,
    handleSave,
    selectedTz,
  };
}

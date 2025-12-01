/**
 * Settings Page - Main Component
 *
 * Orchestrates all settings sections:
 * - General Settings (currency, language, API keys, exchange rates)
 * - Telegram Integration (connection, verification)
 * - Account Information (user details)
 *
 * Junior-Friendly: <200 lines, focused on data management and coordination
 */

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSettingsSchema, Settings as SettingsType } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/i18n";
import { FormData, TelegramStatus, VerificationCodeResponse } from "./types";
import { GeneralSettingsCard } from "./general-settings-card";
import { TelegramIntegrationCard } from "./telegram-integration-card";
import { AccountInfoCard } from "./account-info-card";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<SettingsType>({
    queryKey: ["/api/settings"],
  });

  const { data: telegramStatus, isLoading: isTelegramLoading } = useQuery<TelegramStatus>({
    queryKey: ["/api/telegram/status"],
  });

  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/telegram/generate-code", {});
      return res.json() as Promise<VerificationCodeResponse>;
    },
    onSuccess: (data) => {
      toast({
        title: t("settings.verification_code"),
        description: t("settings.code_generated").replace("{minutes}", data.ttlMinutes.toString()),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error_occurred"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/telegram/disconnect", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/telegram/status"] });
      toast({
        title: t("settings.telegram"),
        description: t("settings.telegram_disconnected"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error_occurred"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(insertSettingsSchema),
    defaultValues: {
      userId: user?.id || 0,
      language: "en",
      currency: "USD",
      telegramNotifications: true,
      timezone: "UTC",
      notificationTime: "09:00",
      anthropicApiKey: undefined,
      openaiApiKey: undefined,
      exchangeRateRUB: undefined,
      exchangeRateIDR: undefined,
    },
  });

  // Reset form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        userId: settings.userId,
        language: (settings.language || "en") as "en" | "ru",
        currency: (settings.currency || "USD") as "USD" | "RUB" | "IDR",
        telegramNotifications: settings.telegramNotifications,
        timezone: settings.timezone || "UTC",
        notificationTime: settings.notificationTime || "09:00",
        anthropicApiKey: settings.anthropicApiKey || undefined,
        openaiApiKey: settings.openaiApiKey || undefined,
        exchangeRateRUB: settings.exchangeRateRUB || undefined,
        exchangeRateIDR: settings.exchangeRateIDR || undefined,
      });
    }
  }, [settings, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Normalize empty strings to null for exchange rates
      const normalizedData = {
        ...data,
        exchangeRateRUB: data.exchangeRateRUB === "" || data.exchangeRateRUB === undefined ? null : data.exchangeRateRUB,
        exchangeRateIDR: data.exchangeRateIDR === "" || data.exchangeRateIDR === undefined ? null : data.exchangeRateIDR,
      };
      const res = await apiRequest("PATCH", "/api/settings", normalizedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: t("common.success"),
        description: t("settings.saved"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error_occurred"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground">{t("settings.manage_preferences")}</p>
      </div>

      <GeneralSettingsCard
        form={form}
        settings={settings}
        onSubmit={onSubmit}
        isPending={updateMutation.isPending}
      />

      <TelegramIntegrationCard
        telegramStatus={telegramStatus}
        isTelegramLoading={isTelegramLoading}
        generateCodeMutation={generateCodeMutation}
        disconnectMutation={disconnectMutation}
      />

      <AccountInfoCard />
    </div>
  );
}

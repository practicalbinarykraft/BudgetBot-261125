import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings as SettingsType } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSettingsSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, MessageCircle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n";

type FormData = z.infer<typeof insertSettingsSchema>;

interface TelegramStatus {
  connected: boolean;
  username: string | null;
}

interface VerificationCodeResponse {
  code: string;
  expiresAt: string;
  ttlMinutes: number;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [verificationCode, setVerificationCode] = useState<VerificationCodeResponse | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

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
      setVerificationCode(data);
      setCopied(false);
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
      setVerificationCode(null);
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

  useEffect(() => {
    if (!verificationCode) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiresAt = new Date(verificationCode.expiresAt).getTime();
      const diff = Math.floor((expiresAt - now) / 1000);

      if (diff <= 0) {
        setTimeLeft(null);
        setVerificationCode(null);
      } else {
        setTimeLeft(diff);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [verificationCode]);

  const handleCopyCode = () => {
    if (verificationCode) {
      navigator.clipboard.writeText(verificationCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.general_settings")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.currency")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-currency">
                          <SelectValue placeholder={t("settings.select_currency")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">{t("settings.currency.usd")}</SelectItem>
                        <SelectItem value="RUB">{t("settings.currency.rub")}</SelectItem>
                        <SelectItem value="IDR">{t("settings.currency.idr")}</SelectItem>
                        <SelectItem value="KRW">{t("settings.currency.krw")}</SelectItem>
                        <SelectItem value="EUR">{t("settings.currency.eur")}</SelectItem>
                        <SelectItem value="CNY">{t("settings.currency.cny")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.language")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-language">
                          <SelectValue placeholder={t("settings.select_language")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">{t("settings.language.english")}</SelectItem>
                        <SelectItem value="ru">{t("settings.language.russian")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telegramNotifications"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-4">
                    <div>
                      <FormLabel>{t("settings.telegram_notifications")}</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {t("settings.receive_alerts")}
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-telegram"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-2">{t("settings.notification_settings")}</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {t("settings.notification_settings.description")}
                </p>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.timezone")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "UTC"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-timezone">
                              <SelectValue placeholder={t("settings.select_timezone")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="UTC">{t("settings.tz.utc")}</SelectItem>
                            <SelectItem value="America/New_York">{t("settings.tz.eastern")}</SelectItem>
                            <SelectItem value="America/Chicago">{t("settings.tz.central")}</SelectItem>
                            <SelectItem value="America/Denver">{t("settings.tz.mountain")}</SelectItem>
                            <SelectItem value="America/Los_Angeles">{t("settings.tz.pacific")}</SelectItem>
                            <SelectItem value="America/Phoenix">{t("settings.tz.arizona")}</SelectItem>
                            <SelectItem value="America/Toronto">{t("settings.tz.toronto")}</SelectItem>
                            <SelectItem value="America/Mexico_City">{t("settings.tz.mexico_city")}</SelectItem>
                            <SelectItem value="America/Sao_Paulo">{t("settings.tz.sao_paulo")}</SelectItem>
                            <SelectItem value="Europe/London">{t("settings.tz.london")}</SelectItem>
                            <SelectItem value="Europe/Paris">{t("settings.tz.paris")}</SelectItem>
                            <SelectItem value="Europe/Moscow">{t("settings.tz.moscow")}</SelectItem>
                            <SelectItem value="Asia/Dubai">{t("settings.tz.dubai")}</SelectItem>
                            <SelectItem value="Asia/Kolkata">{t("settings.tz.india")}</SelectItem>
                            <SelectItem value="Asia/Singapore">{t("settings.tz.singapore")}</SelectItem>
                            <SelectItem value="Asia/Shanghai">{t("settings.tz.shanghai")}</SelectItem>
                            <SelectItem value="Asia/Tokyo">{t("settings.tz.tokyo")}</SelectItem>
                            <SelectItem value="Asia/Seoul">{t("settings.tz.seoul")}</SelectItem>
                            <SelectItem value="Asia/Jakarta">{t("settings.tz.jakarta")}</SelectItem>
                            <SelectItem value="Australia/Sydney">{t("settings.tz.sydney")}</SelectItem>
                            <SelectItem value="Pacific/Auckland">{t("settings.tz.auckland")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t("settings.timezone.description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notificationTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.notification_time")}</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            value={field.value || "09:00"}
                            data-testid="input-notification-time"
                          />
                        </FormControl>
                        <FormDescription>
                          {t("settings.notification_time.description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="anthropicApiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.anthropic_api_key")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t("settings.anthropic_api_key.placeholder")}
                        {...field}
                        value={field.value || ""}
                        data-testid="input-anthropic-key"
                      />
                    </FormControl>
                    <FormDescription>
                      {t("settings.anthropic_api_key.description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="openaiApiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.openai_api_key")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t("settings.openai_api_key.placeholder")}
                        {...field}
                        value={field.value || ""}
                        data-testid="input-openai-key"
                      />
                    </FormControl>
                    <FormDescription>
                      {t("settings.openai_api_key.description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-2">{t("settings.exchange_rates")}</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {t("settings.exchange_rates.customize")}
                </p>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="exchangeRateRUB"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.exchange_rate_rub")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="92.5"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-rate-rub"
                          />
                        </FormControl>
                        <FormDescription>
                          {t("settings.exchange_rate_rub.description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="exchangeRateIDR"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.exchange_rate_idr")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="15750"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-rate-idr"
                          />
                        </FormControl>
                        <FormDescription>
                          {t("settings.exchange_rate_idr.description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="exchangeRateKRW"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.exchange_rate_krw")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="1300"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-rate-krw"
                          />
                        </FormControl>
                        <FormDescription>
                          {t("settings.exchange_rate_krw.description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="exchangeRateEUR"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.exchange_rate_eur")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.0001"
                            placeholder="0.92"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-rate-eur"
                          />
                        </FormControl>
                        <FormDescription>
                          {t("settings.exchange_rate_eur.description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="exchangeRateCNY"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.exchange_rate_cny")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="7.2"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-rate-cny"
                          />
                        </FormControl>
                        <FormDescription>
                          {t("settings.exchange_rate_cny.description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {settings?.exchangeRatesUpdatedAt && (
                    <p className="text-sm text-muted-foreground">
                      {t("settings.last_updated")}: {new Date(settings.exchangeRatesUpdatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-settings">
                {updateMutation.isPending ? `${t("settings.save_settings")}...` : t("settings.save_settings")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.telegram_integration")}</CardTitle>
          <CardDescription>{t("settings.telegram_integration.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTelegramLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <>
              <div className="flex items-center justify-between rounded-md border p-4">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t("settings.connection_status")}</p>
                    {telegramStatus?.connected ? (
                      <p className="text-sm text-muted-foreground">
                        {t("settings.connected_as")} @{telegramStatus.username || "unknown"}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("settings.telegram_not_connected")}</p>
                    )}
                  </div>
                </div>
                <Badge variant={telegramStatus?.connected ? "default" : "secondary"} data-testid="badge-telegram-status">
                  {telegramStatus?.connected ? t("settings.telegram_connected") : t("settings.telegram_not_connected")}
                </Badge>
              </div>

              {telegramStatus?.connected ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t("settings.connected_account")}
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => disconnectMutation.mutate()}
                    disabled={disconnectMutation.isPending}
                    data-testid="button-disconnect-telegram"
                  >
                    {disconnectMutation.isPending ? `${t("settings.disconnecting")}...` : t("settings.disconnect_telegram")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {!verificationCode ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {t("settings.generate_code_description")}
                      </p>
                      <Button
                        onClick={() => generateCodeMutation.mutate()}
                        disabled={generateCodeMutation.isPending}
                        data-testid="button-generate-code"
                      >
                        {generateCodeMutation.isPending ? `${t("settings.generating")}...` : t("settings.generate_code")}
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-4 rounded-md border p-4 bg-accent/5">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">{t("settings.verification_code_label")}</p>
                        <div className="flex items-center gap-2">
                          <code className="relative rounded bg-muted px-3 py-1.5 font-mono text-2xl font-bold tracking-wider" data-testid="text-verification-code">
                            {verificationCode.code}
                          </code>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={handleCopyCode}
                            data-testid="button-copy-code"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        {timeLeft !== null && (
                          <p className="text-sm text-muted-foreground">
                            {t("settings.expires_in")}: <span className="font-medium" data-testid="text-time-left">{formatTime(timeLeft)}</span>
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 border-t pt-4">
                        <p className="text-sm font-medium">{t("settings.how_to_connect")}</p>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                          <li>{t("settings.telegram_step1")}</li>
                          <li>{t("settings.telegram_step2")}: /verify {verificationCode.code}</li>
                          <li>{t("settings.telegram_step3")}</li>
                        </ol>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => setVerificationCode(null)}
                        data-testid="button-cancel-code"
                      >
                        <X className="h-4 w-4 mr-2" />
                        {t("settings.cancel")}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.account_information")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">{t("common.name")}</p>
            <p className="font-medium">{user?.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("settings.email")}</p>
            <p className="font-medium">{user?.email}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

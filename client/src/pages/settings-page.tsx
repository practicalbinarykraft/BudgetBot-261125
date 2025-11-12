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
        title: "Code Generated",
        description: `Your verification code expires in ${data.ttlMinutes} minutes`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
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
        title: "Disconnected",
        description: "Telegram account disconnected successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
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
      anthropicApiKey: undefined,
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
        anthropicApiKey: settings.anthropicApiKey || undefined,
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
        title: "Success",
        description: "Settings updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
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
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-currency">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="RUB">RUB - Russian Ruble</SelectItem>
                        <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
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
                    <FormLabel>Language</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ru">Русский</SelectItem>
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
                      <FormLabel>Telegram Notifications</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Receive spending alerts via Telegram
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

              <FormField
                control={form.control}
                name="anthropicApiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anthropic API Key (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="sk-ant-..."
                        {...field}
                        value={field.value || ""}
                        data-testid="input-anthropic-key"
                      />
                    </FormControl>
                    <FormDescription>
                      Your personal Anthropic API key for AI-powered forecasting and analysis. Get one at{" "}
                      <a
                        href="https://console.anthropic.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        console.anthropic.com
                      </a>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-2">Exchange Rates</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Customize currency conversion rates for RUB and IDR. Leave empty to use default rates (1 USD = 92.5 RUB, 1 USD = 15,750 IDR). 
                  Changes apply to all future transactions and Telegram bot conversions.
                </p>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="exchangeRateRUB"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RUB to USD Rate</FormLabel>
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
                          How many Russian Rubles equal 1 USD (e.g., 92.5 means 1 USD = 92.5 RUB)
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
                        <FormLabel>IDR to USD Rate</FormLabel>
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
                          How many Indonesian Rupiah equal 1 USD (e.g., 15750 means 1 USD = 15,750 IDR)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {settings?.exchangeRatesUpdatedAt && (
                    <p className="text-sm text-muted-foreground">
                      Last updated: {new Date(settings.exchangeRatesUpdatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-settings">
                {updateMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Telegram Integration</CardTitle>
          <CardDescription>Connect your Telegram account to track expenses on the go</CardDescription>
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
                    <p className="font-medium">Connection Status</p>
                    {telegramStatus?.connected ? (
                      <p className="text-sm text-muted-foreground">
                        Connected as @{telegramStatus.username || "unknown"}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not connected</p>
                    )}
                  </div>
                </div>
                <Badge variant={telegramStatus?.connected ? "default" : "secondary"} data-testid="badge-telegram-status">
                  {telegramStatus?.connected ? "Connected" : "Not Connected"}
                </Badge>
              </div>

              {telegramStatus?.connected ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Your Telegram account is connected. You can now send expenses directly to the bot!
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => disconnectMutation.mutate()}
                    disabled={disconnectMutation.isPending}
                    data-testid="button-disconnect-telegram"
                  >
                    {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect Telegram"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {!verificationCode ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Generate a verification code to link your Telegram account
                      </p>
                      <Button
                        onClick={() => generateCodeMutation.mutate()}
                        disabled={generateCodeMutation.isPending}
                        data-testid="button-generate-code"
                      >
                        {generateCodeMutation.isPending ? "Generating..." : "Generate Code"}
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-4 rounded-md border p-4 bg-accent/5">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Your Verification Code:</p>
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
                            Expires in: <span className="font-medium" data-testid="text-time-left">{formatTime(timeLeft)}</span>
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 border-t pt-4">
                        <p className="text-sm font-medium">How to connect:</p>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Open Telegram and find @BudgetBuddyBot</li>
                          <li>Send the command: /verify {verificationCode.code}</li>
                          <li>Start tracking expenses instantly!</li>
                        </ol>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => setVerificationCode(null)}
                        data-testid="button-cancel-code"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
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
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{user?.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

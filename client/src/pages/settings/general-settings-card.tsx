/**
 * General Settings Card Component
 *
 * Currency, Language, API Keys, Notifications, Timezone
 * Main settings form with multiple sections
 * Junior-Friendly: <200 lines, focused on general configuration
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "@/i18n";
import { FormData } from "./types";
import { Settings as SettingsType } from "@shared/schema";
import { ExchangRatesSection } from "./exchange-rates-section";

interface GeneralSettingsCardProps {
  form: UseFormReturn<FormData>;
  settings: SettingsType | undefined;
  onSubmit: (data: FormData) => void;
  isPending: boolean;
}

export function GeneralSettingsCard({
  form,
  settings,
  onSubmit,
  isPending,
}: GeneralSettingsCardProps) {
  const { t } = useTranslation();

  return (
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

            <Button type="submit" disabled={isPending} data-testid="button-save-settings-top" className="w-full">
              {isPending ? `${t("settings.save_settings")}...` : t("settings.save_settings")}
            </Button>

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

            <ExchangRatesSection form={form} settings={settings} />

            <Button type="submit" disabled={isPending} data-testid="button-save-settings">
              {isPending ? `${t("settings.save_settings")}...` : t("settings.save_settings")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

/**
 * Exchange Rates Section Component
 *
 * Custom exchange rates configuration for multiple currencies
 * Allows users to override default exchange rates
 * Junior-Friendly: <150 lines, focused on exchange rate inputs
 */

import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "@/i18n";
import { FormData } from "./types";
import { Settings as SettingsType } from "@shared/schema";

interface ExchangRatesSectionProps {
  form: UseFormReturn<FormData>;
  settings: SettingsType | undefined;
}

export function ExchangRatesSection({ form, settings }: ExchangRatesSectionProps) {
  const { t } = useTranslation();

  return (
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
  );
}

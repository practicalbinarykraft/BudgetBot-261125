/**
 * Value Fields Component
 *
 * Current value, currency, purchase price, and purchase date fields
 * Junior-Friendly: <100 lines, focused on value-related inputs
 */

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "@/i18n";
import { FormData } from "./types";

interface ValueFieldsProps {
  form: UseFormReturn<FormData>;
}

export function ValueFields({ form }: ValueFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Текущая стоимость */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <FormField
            control={form.control}
            name="currentValueOriginal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("assets.form_current_value")} *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="200000"
                    data-testid="input-current-value"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="currencyOriginal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("assets.form_currency")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger data-testid="select-currency">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="RUB">RUB</SelectItem>
                  <SelectItem value="IDR">IDR</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="KRW">KRW</SelectItem>
                  <SelectItem value="CNY">CNY</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Цена покупки */}
      <div className="grid grid-cols-2 gap-2">
        <FormField
          control={form.control}
          name="purchasePriceOriginal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("assets.form_purchase_price")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  placeholder="150000"
                  data-testid="input-purchase-price"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="purchaseDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("assets.form_purchase_date")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="date"
                  data-testid="input-purchase-date"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}

/**
 * Cashflow Fields Component
 *
 * Monthly income and expense fields for asset cashflow
 * Junior-Friendly: <60 lines, focused on cashflow inputs
 */

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "@/i18n";
import { FormData } from "./types";

interface CashflowFieldsProps {
  form: UseFormReturn<FormData>;
}

export function CashflowFields({ form }: CashflowFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="monthlyIncome"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("assets.form_monthly_income")}</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="number"
                step="0.01"
                placeholder="0"
                data-testid="input-monthly-income"
              />
            </FormControl>
            <p className="text-xs text-muted-foreground">{t("assets.form_income_hint")}</p>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="monthlyExpense"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("assets.form_monthly_expense")}</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="number"
                step="0.01"
                placeholder="0"
                data-testid="input-monthly-expense"
              />
            </FormControl>
            <p className="text-xs text-muted-foreground">{t("assets.form_expense_hint")}</p>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

/**
 * Rate Fields Component
 *
 * Appreciation and depreciation rate fields
 * Junior-Friendly: <60 lines, focused on rate inputs
 */

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "@/i18n";
import { FormData } from "./types";

interface RateFieldsProps {
  form: UseFormReturn<FormData>;
}

export function RateFields({ form }: RateFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="appreciationRate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("assets.form_appreciation")}</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="number"
                step="0.01"
                placeholder="8"
                data-testid="input-appreciation-rate"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="depreciationRate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("assets.form_depreciation")}</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="number"
                step="0.01"
                placeholder="8"
                data-testid="input-depreciation-rate"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

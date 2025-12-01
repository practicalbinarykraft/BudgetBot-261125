/**
 * Basic Info Fields Component
 *
 * Name and Category selection fields for asset form
 * Junior-Friendly: <50 lines, focused on basic info inputs
 */

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "@/i18n";
import { FormData } from "./types";

interface BasicInfoFieldsProps {
  form: UseFormReturn<FormData>;
  assetCategories: Array<{ id: number; name: string }>;
}

export function BasicInfoFields({ form, assetCategories }: BasicInfoFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Название */}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("assets.form_name")} *</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={t("assets.form_name_placeholder")}
                data-testid="input-asset-name"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Категория */}
      <FormField
        control={form.control}
        name="categoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("assets.form_category")}</FormLabel>
            <Select
              value={field.value?.toString() || "none"}
              onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
            >
              <FormControl>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder={t("assets.form_no_category")} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">{t("assets.form_no_category")}</SelectItem>
                {assetCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

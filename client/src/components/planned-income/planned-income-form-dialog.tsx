import { useState } from "react";
import { Category } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { insertPlannedIncomeSchema } from "@shared/schema";
import { z } from "zod";
import { useTranslation } from "@/i18n/context";
import { useTranslateCategory } from "@/lib/category-translations";
import { CategoryCreateDialog } from "@/components/categories/category-create-dialog";
import { Plus } from "lucide-react";

type FormData = z.infer<typeof insertPlannedIncomeSchema>;

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "RUB", label: "RUB (₽)" },
  { value: "KRW", label: "KRW (₩)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "CNY", label: "CNY (¥)" },
  { value: "IDR", label: "IDR (Rp)" },
];

export function PlannedIncomeFormDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  editing,
  incomeCategories,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<FormData>;
  onSubmit: (data: FormData) => void;
  editing: boolean;
  incomeCategories: Category[];
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const translateCategory = useTranslateCategory();
  const [showCreateCategory, setShowCreateCategory] = useState(false);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-planned-income-form">
        <DialogHeader>
          <DialogTitle>
            {editing ? t("planned_income.edit") : t("planned_income.add")}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("planned_income.field.description")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("planned_income.field.description_placeholder")}
                      {...field}
                      data-testid="input-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("planned_income.field.amount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]+(\.[0-9]{1,2})?"
                        placeholder="1000.00"
                        {...field}
                        data-testid="input-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("planned_income.field.currency")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "USD"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-currency">
                          <SelectValue placeholder="USD" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expectedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("planned_income.field.expected_date")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} data-testid="input-expected-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("planned_income.field.category")}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder={t("common.select_category")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {incomeCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full bg-muted-foreground"
                              style={category.color ? { backgroundColor: category.color } : undefined}
                            />
                            {translateCategory(category.name)}
                          </div>
                        </SelectItem>
                      ))}
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowCreateCategory(true);
                        }}
                        className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent active:bg-accent/80 rounded-sm flex items-center gap-2 text-primary"
                        data-testid="button-create-category-planned-income"
                      >
                        <Plus className="h-4 w-4" />
                        {t("transactions.create_new_category")}
                      </button>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("planned_income.field.notes")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional notes"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit">
                {editing ? t("common.save") : t("planned_income.action.save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <CategoryCreateDialog
      open={showCreateCategory}
      onOpenChange={setShowCreateCategory}
      defaultType="income"
      onSuccess={(categoryName) => {
        // Find category by name and set categoryId
        const category = incomeCategories.find(c => c.name === categoryName);
        if (category) {
          form.setValue("categoryId", category.id);
        }
      }}
    />
    </>
  );
}

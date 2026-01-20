import { useState } from "react";
import { Category } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { insertBudgetSchema } from "@shared/schema";
import { z } from "zod";
import { useTranslation } from "@/i18n/context";
import { useTranslateCategory } from "@/lib/category-translations";
import { CategoryCreateDialog } from "@/components/categories/category-create-dialog";
import { Plus } from "lucide-react";

type FormData = z.infer<typeof insertBudgetSchema>;

export function BudgetFormDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  editingBudget,
  expenseCategories,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<FormData>;
  onSubmit: (data: FormData) => void;
  editingBudget: boolean;
  expenseCategories: Category[];
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const translateCategory = useTranslateCategory();
  const [showCreateCategory, setShowCreateCategory] = useState(false);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-budget-form">
        <DialogHeader>
          <DialogTitle>{editingBudget ? t("budgets.edit_budget_dialog") : t("budgets.add_budget_dialog")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("budgets.category")}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder={t("budgets.select_category")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseCategories.map((category) => (
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
                        data-testid="button-create-category-budget"
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
              name="limitAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("budgets.limit_amount")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="100.00"
                      {...field}
                      data-testid="input-limit"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("budgets.period")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-period">
                        <SelectValue placeholder={t("budgets.select_period")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="week">{t("budgets.period_week")}</SelectItem>
                      <SelectItem value="month">{t("budgets.period_month")}</SelectItem>
                      <SelectItem value="year">{t("budgets.period_year")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("budgets.start_date")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} data-testid="input-start-date" />
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
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-submit"
              >
                {isPending
                  ? (editingBudget ? t("budgets.updating") : t("budgets.creating"))
                  : (editingBudget ? t("budgets.update") : t("budgets.create"))
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <CategoryCreateDialog
      open={showCreateCategory}
      onOpenChange={setShowCreateCategory}
      defaultType="expense"
      onSuccess={(categoryName) => {
        // Find category by name and set categoryId
        const category = expenseCategories.find(c => c.name === categoryName);
        if (category) {
          form.setValue("categoryId", category.id);
        }
      }}
    />
    </>
  );
}

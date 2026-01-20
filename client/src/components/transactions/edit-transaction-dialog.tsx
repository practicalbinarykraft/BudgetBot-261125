import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Transaction, Category, PersonalTag } from "@shared/schema";
import { TagSelector } from "@/components/tags/tag-selector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/context";
import { useTranslateCategory } from "@/lib/category-translations";
import { CategoryCreateDialog } from "@/components/categories/category-create-dialog";
import { Plus } from "lucide-react";
import { z } from "zod";

interface EditTransactionDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTransactionDialog({ transaction, open, onOpenChange }: EditTransactionDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const translateCategory = useTranslateCategory();
  const [showCreateCategory, setShowCreateCategory] = useState(false);

  // Client-side validation schema
  const formSchema = z.object({
    type: z.enum(["income", "expense"]),
    amount: z.string().min(1, t("transactions.amount_required")),
    description: z.string().min(1),
    date: z.string().min(1),
    category: z.string().optional(),
    currency: z.string().default("USD"),
    personalTagId: z.number().nullable().optional(),
    walletId: z.number().optional(),
    financialType: z.enum(["essential", "discretionary", "asset", "liability"]).optional(),
  });

  type FormData = z.infer<typeof formSchema>;

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: open,
  });

  const { data: tags = [] } = useQuery<PersonalTag[]>({
    queryKey: ["/api/tags"],
    enabled: open,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    values: transaction ? {
      date: transaction.date,
      type: transaction.type as "income" | "expense",
      amount: transaction.amount,
      description: transaction.description,
      category: transaction.category || "",
      currency: transaction.currency || "USD",
      walletId: transaction.walletId || undefined,
      personalTagId: transaction.personalTagId || null,
      financialType: (transaction.financialType || "discretionary") as "essential" | "discretionary" | "asset" | "liability",
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!transaction) return;
      const payload = {
        type: data.type,
        amount: data.amount,
        amountUsd: data.amount,
        description: data.description,
        date: data.date,
        category: data.category || undefined,
        currency: data.currency,
        personalTagId: data.personalTagId,
        walletId: data.walletId,
        financialType: data.financialType,
      };
      const res = await apiRequest("PATCH", `/api/transactions/${transaction.id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/tags"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/sorting/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/unsorted"], exact: false });
      toast({
        title: t("common.success"),
        description: t("transactions.updated_successfully"),
      });
      onOpenChange(false);
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

  if (!transaction) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("transactions.edit_transaction")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4 overflow-y-auto flex-1 pr-2">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.type")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-type-edit">
                        <SelectValue placeholder={t("transactions.select_type")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="income">{t("transactions.type.income")}</SelectItem>
                      <SelectItem value="expense">{t("transactions.type.expense")}</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <FormLabel>{t("transactions.amount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-amount-edit"
                        {...field}
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
                    <FormLabel>{t("transactions.currency")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger data-testid="select-currency-edit">
                          <SelectValue placeholder={t("transactions.currency")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="RUB">RUB (₽)</SelectItem>
                        <SelectItem value="IDR">IDR (Rp)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("transactions.description")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("transactions.placeholder_description")} data-testid="input-description-edit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("transactions.category_optional")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category-edit">
                        <SelectValue placeholder={t("transactions.select_category")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          <div className="flex items-center gap-2">
                            {cat.icon && cat.icon !== 'Tag' && (
                              <span className="text-base">{cat.icon}</span>
                            )}
                            <span>{translateCategory(cat.name)}</span>
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
                        data-testid="button-create-category-edit"
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
              name="personalTagId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("transactions.tag_optional")}</FormLabel>
                  <FormControl>
                    <TagSelector
                      value={field.value ?? null}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="financialType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("transactions.financial_type")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger data-testid="select-financial-type-edit">
                        <SelectValue placeholder={t("transactions.select_financial_type")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="essential">{t("transactions.essential")}</SelectItem>
                      <SelectItem value="discretionary">{t("transactions.discretionary")}</SelectItem>
                      <SelectItem value="asset">{t("transactions.asset")}</SelectItem>
                      <SelectItem value="liability">{t("transactions.liability")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("transactions.date")}</FormLabel>
                  <FormControl>
                    <Input type="date" data-testid="input-date-edit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-edit"
              >
                {t("transactions.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-testid="button-submit-edit"
              >
                {updateMutation.isPending ? t("transactions.updating") : t("transactions.update_transaction")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <CategoryCreateDialog
      open={showCreateCategory}
      onOpenChange={setShowCreateCategory}
      defaultType={form.watch("type") as "income" | "expense"}
      onSuccess={(categoryName) => {
        form.setValue("category", categoryName);
      }}
    />
    </>
  );
}

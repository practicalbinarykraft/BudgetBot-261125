import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/i18n/context";
import { Category, PersonalTag } from "@shared/schema";
import { Plus } from "lucide-react";
import { CategoryCreateDialog } from "@/components/categories/category-create-dialog";
import { TagSelector } from "@/components/tags/tag-selector";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPersonalTagId?: number | null;
}

interface TransactionResponse {
  id: number;
  userId: number;
  date: string;
  type: string;
  amount: string;
  description: string;
  category: string | null;
  categoryId: number | null;
  currency: string | null;
  amountUsd: string;
  mlSuggested: boolean;
  mlConfidence: number;
}

export function AddTransactionDialog({ open, onOpenChange, defaultPersonalTagId }: AddTransactionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [showCreateCategory, setShowCreateCategory] = useState(false);

  // Client-side validation schema - simpler than server schema
  const formSchema = z.object({
    type: z.enum(["income", "expense"]),
    amount: z.string().min(1, t("transactions.amount_required")),
    description: z.string().min(1, t("transactions.description_required")),
    date: z.string().min(1),
    category: z.string().optional(),
    currency: z.string().default("USD"),
    personalTagId: z.number().nullable().optional(),
    walletId: z.number().optional(),
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
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      type: "expense",
      amount: "",
      description: "",
      category: "",
      currency: "USD",
      walletId: undefined,
      personalTagId: defaultPersonalTagId ?? null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
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
        source: 'manual',
      };
      const res = await apiRequest("POST", "/api/transactions", payload);
      return res.json() as Promise<TransactionResponse>;
    },
    onSuccess: (transaction: TransactionResponse) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tags"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/sorting/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/unsorted"], exact: false });
      
      if (transaction.mlSuggested && transaction.category) {
        const confidence = Math.round(transaction.mlConfidence * 100);
        toast({
          title: t("transactions.smart_suggestion_applied"),
          description: t("transactions.category_auto_selected")
            .replace("{category}", transaction.category)
            .replace("{confidence}", String(confidence)),
        });
      } else {
        toast({
          title: t("common.success"),
          description: t("transactions.added_successfully"),
        });
      }
      
      form.reset();
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
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("transactions.add_transaction")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.type")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-type">
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
                        data-testid="input-amount"
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
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger data-testid="select-currency">
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
                    <Input placeholder={t("transactions.placeholder_description")} data-testid="input-description" {...field} />
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
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder={t("transactions.select_category")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowCreateCategory(true);
                        }}
                        className="w-full px-2 py-1.5 text-sm text-left hover-elevate active-elevate-2 rounded-sm flex items-center gap-2 text-primary"
                        data-testid="button-create-category"
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
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("transactions.date")}</FormLabel>
                  <FormControl>
                    <Input type="date" data-testid="input-date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                data-testid="button-cancel"
              >
                {t("transactions.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1"
                data-testid="button-submit-transaction"
              >
                {createMutation.isPending ? t("transactions.adding") : t("transactions.add_transaction")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      <CategoryCreateDialog
        open={showCreateCategory}
        onOpenChange={setShowCreateCategory}
        defaultType={form.watch("type") as "income" | "expense"}
        onSuccess={(categoryName) => {
          form.setValue("category", categoryName);
        }}
      />
    </Dialog>
  );
}

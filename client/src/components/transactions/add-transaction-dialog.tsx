import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { Plus, Mic } from "lucide-react";
import { CategoryCreateDialog } from "@/components/categories/category-create-dialog";
import { TagSelector } from "@/components/tags/tag-selector";
import { useTranslateCategory } from "@/lib/category-translations";
import { VoiceRecorderAdaptive, ParsedVoiceResult } from "@/components/voice-recorder-adaptive";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPersonalTagId?: number | null;
  // Props for voice input prefill
  defaultDescription?: string;
  defaultAmount?: string;
  defaultCurrency?: string;
  defaultCategory?: string;
  defaultType?: 'income' | 'expense';
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

export function AddTransactionDialog({
  open,
  onOpenChange,
  defaultPersonalTagId,
  defaultDescription,
  defaultAmount,
  defaultCurrency,
  defaultCategory,
  defaultType,
}: AddTransactionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const translateCategory = useTranslateCategory();
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);

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

  // Prefill form when dialog opens with voice input data
  useEffect(() => {
    if (open) {
      if (defaultDescription) form.setValue("description", defaultDescription);
      if (defaultAmount) form.setValue("amount", defaultAmount);
      if (defaultCurrency) form.setValue("currency", defaultCurrency);
      if (defaultCategory) form.setValue("category", defaultCategory);
      if (defaultType) form.setValue("type", defaultType);
    }
  }, [open, defaultDescription, defaultAmount, defaultCurrency, defaultCategory, defaultType, form]);

  // Handler for Web Speech API (plain text) - used in regular browsers
  const handleVoiceResult = (text: string) => {
    form.setValue("description", text);
    setShowVoiceInput(false);
  };

  // Handler for server-side parsed result - used in Telegram Mini App
  const handleVoiceParsedResult = (result: ParsedVoiceResult) => {
    if (result.parsed.description) form.setValue("description", result.parsed.description);
    if (result.parsed.amount) form.setValue("amount", result.parsed.amount);
    if (result.parsed.currency) form.setValue("currency", result.parsed.currency);
    if (result.parsed.category) form.setValue("category", result.parsed.category);
    if (result.parsed.type) form.setValue("type", result.parsed.type);
    setShowVoiceInput(false);
  };

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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] flex flex-col !p-0 overflow-hidden">
        <DialogHeader className="px-3 pt-3 pb-2 sm:px-6 sm:pt-6 sm:pb-4 flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg">{t("transactions.add_transaction")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">{t("common.type")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-type" className="w-full max-w-full text-sm h-9">
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

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">{t("transactions.amount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-amount"
                        className="w-full text-sm h-9"
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
                    <FormLabel className="text-sm">{t("transactions.currency")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                      <SelectTrigger data-testid="select-currency" className="w-full max-w-full text-sm h-9">
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
                  <FormLabel className="text-sm">{t("transactions.description")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("transactions.placeholder_description")}
                      data-testid="input-description"
                      className="w-full text-sm h-9"
                      {...field}
                    />
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
                  <FormLabel className="text-sm">{t("transactions.category_optional")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category" className="w-full max-w-full text-sm h-9">
                        <SelectValue placeholder={t("transactions.select_category")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {translateCategory(cat.name)}
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
                  <FormLabel className="text-sm">{t("transactions.tag_optional")}</FormLabel>
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
                <FormItem className="w-full">
                  <FormLabel className="text-sm">{t("transactions.date")}</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      data-testid="input-date"
                      className="w-full text-sm h-9"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            </div>
            <div className="flex gap-2 pt-2 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6 border-t flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 text-sm"
                data-testid="button-cancel"
              >
                {t("transactions.cancel")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowVoiceInput(true)}
                className="px-3 sm:px-4 text-sm"
                aria-label={t("voice_input.title")}
              >
                <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 text-sm"
                data-testid="button-submit-transaction"
              >
                {createMutation.isPending ? t("transactions.adding") : t("transactions.add_transaction")}
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

      {/* Voice Input Dialog - Separate Dialog to avoid z-index conflicts */}
      <Dialog open={showVoiceInput} onOpenChange={setShowVoiceInput}>
        <DialogContent className="max-w-sm z-[200]">
          <DialogHeader>
            <DialogTitle>{t("voice_input.title")}</DialogTitle>
            <DialogDescription>
              {t("voice_input.instructions")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mb-4">
            <VoiceRecorderAdaptive
              onResult={handleVoiceResult}
              onParsedResult={handleVoiceParsedResult}
              className="w-16 h-16"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowVoiceInput(false)}
            className="w-full"
          >
            {t("common.cancel")}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

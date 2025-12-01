/**
 * Asset Form - Main Component
 *
 * Dialog form for creating/editing assets and liabilities
 * Orchestrates form setup, mutations, currency conversion, and field components
 * Junior-Friendly: <200 lines, focused on coordination and data management
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@shared/schema";
import { useTranslation } from "@/i18n";
import { AssetFormProps, FormData } from "./types";
import { BasicInfoFields } from "./basic-info-fields";
import { ValueFields } from "./value-fields";
import { CashflowFields } from "./cashflow-fields";
import { RateFields } from "./rate-fields";
import { AdditionalFields } from "./additional-fields";

export function AssetForm({ open, onOpenChange, asset, type }: AssetFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const assetFormSchema = z.object({
    name: z.string().min(1, t("assets.form_name_required")),
    type: z.enum(['asset', 'liability']),
    categoryId: z.number().nullable(),

    currentValueOriginal: z.string().min(1, t("assets.form_current_value_required")),
    currencyOriginal: z.string().default('USD'),

    purchasePriceOriginal: z.string().optional(),
    purchaseDate: z.string().optional(),

    monthlyIncome: z.string().optional(),
    monthlyExpense: z.string().optional(),

    depreciationRate: z.string().optional(),
    appreciationRate: z.string().optional(),

    location: z.string().optional(),
    notes: z.string().optional(),
    imageUrl: z.string().optional(),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: open,
  });

  const assetCategories = categories.filter(
    c => c.applicableTo === 'asset' || c.applicableTo === 'both'
  );

  const form = useForm<FormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: asset?.name || '',
      type: type,
      categoryId: asset?.categoryId || null,

      currentValueOriginal: asset?.currentValueOriginal || '',
      currencyOriginal: asset?.currencyOriginal || 'USD',

      purchasePriceOriginal: asset?.purchasePriceOriginal || '',
      purchaseDate: asset?.purchaseDate || '',

      monthlyIncome: asset?.monthlyIncome || '',
      monthlyExpense: asset?.monthlyExpense || '',

      depreciationRate: asset?.depreciationRate || '',
      appreciationRate: asset?.appreciationRate || '',

      location: asset?.location || '',
      notes: asset?.notes || '',
      imageUrl: asset?.imageUrl || '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Fetch exchange rates
      const ratesRes = await fetch('/api/exchange-rates');
      const ratesData = await ratesRes.json();
      const rates = ratesData.rates;

      // Helper: convert to USD
      const convertToUSD = (amount: string, currency: string) => {
        const num = parseFloat(amount);
        if (!num || currency === 'USD') return num.toFixed(2);

        const rate = rates[currency];
        if (!rate) {
          const errorMsg = t("assets.error_unsupported_currency").replace("{currency}", currency);
          throw new Error(errorMsg);
        }

        return (num / rate).toFixed(2);
      };

      // Prepare data with USD conversions
      const dataToSubmit = {
        ...data,
        // Convert current value
        currentValue: convertToUSD(data.currentValueOriginal, data.currencyOriginal),
        // Convert purchase price (if provided)
        purchasePrice: data.purchasePriceOriginal
          ? convertToUSD(data.purchasePriceOriginal, data.currencyOriginal)
          : null,
        // Convert monthly income/expense (empty string → null)
        monthlyIncome: data.monthlyIncome && data.monthlyIncome.trim() !== ''
          ? convertToUSD(data.monthlyIncome, data.currencyOriginal)
          : null,
        monthlyExpense: data.monthlyExpense && data.monthlyExpense.trim() !== ''
          ? convertToUSD(data.monthlyExpense, data.currencyOriginal)
          : null,
        // Convert appreciation/depreciation rates (empty string → null)
        appreciationRate: data.appreciationRate && data.appreciationRate.trim() !== ''
          ? data.appreciationRate
          : null,
        depreciationRate: data.depreciationRate && data.depreciationRate.trim() !== ''
          ? data.depreciationRate
          : null,
        // Save exchange rate
        exchangeRate: data.currencyOriginal !== 'USD'
          ? rates[data.currencyOriginal]?.toString()
          : null,
      };

      const endpoint = asset ? `/api/assets/${asset.id}` : '/api/assets';
      const method = asset ? 'PATCH' : 'POST';
      const res = await apiRequest(method, endpoint, dataToSubmit);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/assets/summary"] });
      const successKey = asset
        ? (type === 'asset' ? 'assets.form_updated' : 'assets.liability_form_updated')
        : (type === 'asset' ? 'assets.form_created' : 'assets.liability_form_created');
      toast({
        description: t(successKey),
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {asset
              ? (type === 'asset' ? t("assets.edit_asset") : t("assets.edit_liability"))
              : (type === 'asset' ? t("assets.add_asset") : t("assets.add_liability"))
            }
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <BasicInfoFields form={form} assetCategories={assetCategories} />
            <ValueFields form={form} />
            <CashflowFields form={form} />
            <RateFields form={form} />
            <AdditionalFields form={form} />

            {/* Кнопки */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                data-testid="button-cancel"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1"
                data-testid="button-submit"
              >
                {createMutation.isPending ? t("common.creating") : (asset ? t("common.update") : t("common.create"))}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

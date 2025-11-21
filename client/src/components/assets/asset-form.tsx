import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@shared/schema";
import { useTranslation } from "@/i18n";
import { ImageLibraryPicker } from "@/components/assets/image-library-picker";
import { ImageIcon } from "lucide-react";

interface AssetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: any;
  type: 'asset' | 'liability';
}

type FormData = {
  name: string;
  type: 'asset' | 'liability';
  categoryId: number | null;
  currentValueOriginal: string;
  currencyOriginal: string;
  purchasePriceOriginal?: string;
  purchaseDate?: string;
  monthlyIncome: string;
  monthlyExpense: string;
  depreciationRate?: string;
  appreciationRate?: string;
  location?: string;
  notes?: string;
  imageUrl?: string;
};

export function AssetForm({ open, onOpenChange, asset, type }: AssetFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [showImagePicker, setShowImagePicker] = useState(false);
  
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

            {/* Cashflow */}
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

            {/* Изменение цены */}
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

            {/* Локация */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("assets.form_location")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("assets.form_location_placeholder")}
                      data-testid="input-location"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Изображение */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("assets.form_image_url")}</FormLabel>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowImagePicker(true)}
                      className="w-full justify-start"
                      data-testid="button-choose-image"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      {field.value ? t("common.change") : t("assets.choose_from_library")}
                    </Button>
                    {field.value && (
                      <div className="relative aspect-video w-full max-w-xs rounded-md border overflow-hidden">
                        <img
                          src={field.value}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <ImageLibraryPicker
                      open={showImagePicker}
                      onOpenChange={setShowImagePicker}
                      onSelect={(url) => field.onChange(url)}
                      currentValue={field.value}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Заметки */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("assets.form_notes")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("assets.form_notes_placeholder")}
                      rows={3}
                      data-testid="textarea-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

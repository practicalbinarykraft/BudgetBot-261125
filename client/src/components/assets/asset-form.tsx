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

interface AssetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: any;
  type: 'asset' | 'liability';
}

const assetFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(['asset', 'liability']),
  categoryId: z.number().nullable(),
  
  currentValueOriginal: z.string().min(1, "Current value is required"),
  currencyOriginal: z.string().default('USD'),
  
  purchasePriceOriginal: z.string().optional(),
  purchaseDate: z.string().optional(),
  
  monthlyIncome: z.string().default('0'),
  monthlyExpense: z.string().default('0'),
  
  depreciationRate: z.string().optional(),
  appreciationRate: z.string().optional(),
  
  location: z.string().optional(),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
});

type FormData = z.infer<typeof assetFormSchema>;

export function AssetForm({ open, onOpenChange, asset, type }: AssetFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      
      monthlyIncome: asset?.monthlyIncome || '0',
      monthlyExpense: asset?.monthlyExpense || '0',
      
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
          throw new Error(`Unsupported currency: ${currency}. Please select a supported currency.`);
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
        // Convert monthly income/expense
        monthlyIncome: convertToUSD(data.monthlyIncome || '0', data.currencyOriginal),
        monthlyExpense: convertToUSD(data.monthlyExpense || '0', data.currencyOriginal),
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
      toast({
        title: asset ? "Asset updated" : "Asset created",
        description: `${form.getValues('name')} has been ${asset ? 'updated' : 'added'} successfully.`,
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save asset",
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
            {asset ? 'Edit' : 'Add'} {type === 'asset' ? 'Asset' : 'Liability'}
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
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Apartment in Moscow"
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
                  <FormLabel>Category</FormLabel>
                  <Select
                    value={field.value?.toString() || ""}
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="No category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No category</SelectItem>
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
                      <FormLabel>Current Value *</FormLabel>
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
                    <FormLabel>Currency</FormLabel>
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
                    <FormLabel>Purchase Price</FormLabel>
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
                    <FormLabel>Purchase Date</FormLabel>
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
                    <FormLabel>Monthly Income</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0"
                        data-testid="input-monthly-income"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">e.g., rent</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="monthlyExpense"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Expense</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0"
                        data-testid="input-monthly-expense"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">e.g., gas, taxes</p>
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
                    <FormLabel>Appreciation (% per year)</FormLabel>
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
                    <FormLabel>Depreciation (% per year)</FormLabel>
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
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Moscow, Pushkin St. 10"
                      data-testid="input-location"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* URL изображения */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      data-testid="input-image-url"
                    />
                  </FormControl>
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Additional information..."
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
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1"
                data-testid="button-submit"
              >
                {createMutation.isPending ? 'Saving...' : asset ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

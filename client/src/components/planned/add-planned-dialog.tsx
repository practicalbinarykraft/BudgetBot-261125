import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQuery } from "@tanstack/react-query";
import { Calendar, DollarSign, Tag } from "lucide-react";
import type { Category } from "@shared/schema";
import { useTranslation } from "@/i18n/context";
import { useTranslateCategory } from "@/lib/category-translations";

interface AddPlannedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: FormData) => void;
  isSubmitting?: boolean;
}

type FormData = {
  name: string;
  amount: string;
  targetDate: string;
  category?: string;
  currency?: string;
};

export function AddPlannedDialog({ open, onOpenChange, onAdd, isSubmitting }: AddPlannedDialogProps) {
  const { t, language } = useTranslation();
  const translateCategory = useTranslateCategory();
  
  const formSchema = useMemo(() => z.object({
    name: z.string().min(1, t("planned.validation_name_required")),
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/, t("planned.validation_amount_invalid")),
    targetDate: z.string().min(1, t("planned.validation_date_required")),
    category: z.string().optional(),
    currency: z.string().default("USD"),
  }), [t, language]);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: "",
      targetDate: "",
      category: "",
      currency: "USD",
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const handleSubmit = (data: FormData) => {
    onAdd(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isSubmitting) {
      return;
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-testid="dialog-add-planned">
        <DialogHeader>
          <DialogTitle>{t("planned.add_dialog_title")}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("planned.field_name")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("planned.field_name_placeholder")}
                      data-testid="input-planned-name"
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
                    <FormLabel>{t("planned.field_amount")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="text"
                          placeholder={t("planned.field_amount_placeholder")}
                          className="pl-10"
                          data-testid="input-planned-amount"
                        />
                      </div>
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
                    <FormLabel>{t("planned.field_currency")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-planned-currency">
                          <SelectValue placeholder={t("planned.field_currency")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="RUB">RUB (₽)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="KRW">KRW (₩)</SelectItem>
                        <SelectItem value="CNY">CNY (¥)</SelectItem>
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
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("planned.field_target_date")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="date"
                        className="pl-10"
                        data-testid="input-planned-date"
                      />
                    </div>
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
                  <FormLabel>{t("planned.field_category")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <SelectTrigger 
                          className="pl-10"
                          data-testid="select-planned-category"
                        >
                          <SelectValue placeholder={t("planned.field_category_placeholder")} />
                        </SelectTrigger>
                      </div>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {translateCategory(cat.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => handleOpenChange(false)}
                data-testid="button-cancel-add-planned"
                disabled={isSubmitting}
              >
                {t("planned.button_cancel")}
              </Button>
              <Button 
                type="submit"
                data-testid="button-confirm-add-planned"
                disabled={isSubmitting}
              >
                {isSubmitting ? t("planned.button_adding") : t("planned.button_add")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

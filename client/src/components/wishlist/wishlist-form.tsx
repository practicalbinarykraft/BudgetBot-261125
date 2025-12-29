import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWishlistSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/i18n/context";

const formSchema = insertWishlistSchema.extend({
  amount: z.string().min(1, "Amount is required"),
});

export type WishlistFormData = z.infer<typeof formSchema>;

interface WishlistFormProps {
  userId: number;
  onSubmit: (data: WishlistFormData) => void;
  onCancel: () => void;
  isPending: boolean;
}

export function WishlistForm({ userId, onSubmit, onCancel, isPending }: WishlistFormProps) {
  const { t } = useTranslation();
  const form = useForm<WishlistFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId,
      name: "",
      amount: "",
      targetDate: "",
      priority: "medium",
      isPurchased: false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("wishlist.item_name")}</FormLabel>
              <FormControl>
                <Input placeholder={t("wishlist.item_name_placeholder")} data-testid="input-wishlist-name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("wishlist.amount")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  data-testid="input-wishlist-amount"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("wishlist.priority")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-wishlist-priority">
                    <SelectValue placeholder={t("wishlist.select_priority")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">{t("wishlist.priority_low")}</SelectItem>
                  <SelectItem value="medium">{t("wishlist.priority_medium")}</SelectItem>
                  <SelectItem value="high">{t("wishlist.priority_high")}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("wishlist.target_date_optional")}</FormLabel>
              <FormControl>
                <Input type="date" data-testid="input-wishlist-date" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            data-testid="button-cancel-wishlist"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="flex-1"
            data-testid="button-submit-wishlist"
          >
            {isPending ? t("wishlist.adding") : t("wishlist.add_item")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

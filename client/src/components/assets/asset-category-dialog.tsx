import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n";

interface AssetCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'asset' | 'liability';
}

const assetCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().default("Tag"),
  color: z.string().default("#3b82f6"),
});

type FormData = z.infer<typeof assetCategorySchema>;

export function AssetCategoryDialog({ open, onOpenChange, type }: AssetCategoryDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(assetCategorySchema),
    defaultValues: {
      name: "",
      icon: "Tag",
      color: "#3b82f6",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        type: type === 'asset' ? 'income' : 'expense',
        applicableTo: 'asset',
      };
      const res = await apiRequest("POST", "/api/categories", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: t("common.success"),
        description: t("assets.category_created"),
      });
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
      <DialogContent data-testid="dialog-asset-category">
        <DialogHeader>
          <DialogTitle>
            {type === 'asset' ? t("assets.add_asset_category") : t("assets.add_liability_category")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("assets.category_name")}</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder={t("assets.category_name_placeholder")}
                      data-testid="input-category-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("assets.category_color")}</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="color" 
                        {...field} 
                        className="w-20 h-10"
                        data-testid="input-category-color"
                      />
                      <span className="text-sm text-muted-foreground">{field.value}</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
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
                disabled={createMutation.isPending}
                data-testid="button-create-category"
              >
                {createMutation.isPending ? t("common.creating") : t("common.create")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

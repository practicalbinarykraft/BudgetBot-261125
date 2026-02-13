import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, selectData } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n";
import { Trash2, Plus, AlertTriangle } from "lucide-react";
import { Category } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'asset' | 'liability';
}

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().default("#3b82f6"),
});

type FormData = z.infer<typeof categorySchema>;

interface DeleteConfirmState {
  category: Category | null;
  assetsCount: number;
}

export function CategoryManagerDialog({ open, onOpenChange, type }: CategoryManagerDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({ category: null, assetsCount: 0 });

  const form = useForm<FormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      color: "#3b82f6",
    },
  });

  // Fetch all categories
  const { data: allCategories = [] } = useQuery({
    queryKey: ["/api/categories"],
    enabled: open,
    select: (data: unknown) => selectData<Category>(data),
  });

  // Filter categories for assets
  const assetCategories = allCategories.filter(
    c => c.applicableTo === 'asset' || c.applicableTo === 'both'
  );

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        icon: "Tag",
        type: type === 'asset' ? 'income' : 'expense',
        applicableTo: 'asset',
      };
      const res = await apiRequest("POST", "/api/categories", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: t("common.success"),
        description: t("assets.category_created"),
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error_occurred"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: t("common.success"),
        description: t("assets.category_deleted"),
      });
      setDeleteConfirm({ category: null, assetsCount: 0 });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error_occurred"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle delete button click - fetch assets count first
  const handleDeleteClick = async (category: Category) => {
    try {
      const res = await apiRequest("GET", `/api/categories/${category.id}/assets-count`);
      const data = await res.json();
      setDeleteConfirm({ category, assetsCount: data.count });
    } catch (error) {
      // If error, show confirmation without count
      setDeleteConfirm({ category, assetsCount: 0 });
    }
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (deleteConfirm.category) {
      deleteMutation.mutate(deleteConfirm.category.id);
    }
  };

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md" data-testid="dialog-category-manager">
          <DialogHeader>
            <DialogTitle>{t("assets.manage_categories")}</DialogTitle>
          </DialogHeader>

          {/* Categories list */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">{t("assets.existing_categories")}</h4>
              {assetCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {t("assets.no_categories")}
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {assetCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-2 rounded-lg border bg-card"
                      data-testid={`category-item-${category.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: category.color || "#3b82f6" }}
                        />
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(category)}
                        data-testid={`button-delete-category-${category.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add category form */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">{t("assets.add_new_category")}</h4>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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
                            data-testid="input-new-category-name"
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
                              className="w-16 h-9 p-1"
                              data-testid="input-new-category-color"
                            />
                            <span className="text-sm text-muted-foreground">{field.value}</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="w-full"
                    data-testid="button-add-category"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {createMutation.isPending ? t("common.adding") : t("assets.add_category")}
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          {/* Close button */}
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-manager"
            >
              {t("common.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteConfirm.category}
        onOpenChange={(open) => !open && setDeleteConfirm({ category: null, assetsCount: 0 })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("assets.delete_category_title")}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>
                {t("assets.delete_category_confirm")} "{deleteConfirm.category?.name}"?
              </span>
              {deleteConfirm.assetsCount > 0 && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-yellow-800 dark:text-yellow-200">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">
                    {deleteConfirm.assetsCount} {t("assets.delete_category_warning")}
                  </span>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Category } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCategorySchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/i18n/context";
import { useTranslateCategory } from "@/lib/category-translations";
import { MobileMenuSheet } from "@/components/mobile-menu-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Label } from "@/components/ui/label";

// Popular emoji icons for categories
const CATEGORY_ICONS = [
  { emoji: '🍔', name: 'Food' },
  { emoji: '🚗', name: 'Transport' },
  { emoji: '🛍️', name: 'Shopping' },
  { emoji: '🎮', name: 'Entertainment' },
  { emoji: '💳', name: 'Bills' },
  { emoji: '💰', name: 'Salary' },
  { emoji: '💻', name: 'Freelance' },
  { emoji: '❓', name: 'Unaccounted' },
  { emoji: '🏠', name: 'Home' },
  { emoji: '🏥', name: 'Health' },
  { emoji: '📚', name: 'Education' },
  { emoji: '✈️', name: 'Travel' },
  { emoji: '☕', name: 'Coffee' },
  { emoji: '🍕', name: 'Pizza' },
  { emoji: '🎬', name: 'Movies' },
  { emoji: '🎵', name: 'Music' },
  { emoji: '🏋️', name: 'Fitness' },
  { emoji: '💊', name: 'Medicine' },
  { emoji: '🎁', name: 'Gifts' },
  { emoji: '🐾', name: 'Pets' },
];

type FormData = z.infer<typeof insertCategorySchema>;

export default function CategoriesPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = useIsMobile();  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const translateCategory = useTranslateCategory();

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const [selectedIcon, setSelectedIcon] = useState('🍔');

  // userId is added by server from session - don't include in client form
  const form = useForm<Omit<FormData, "userId">>({
    resolver: zodResolver(insertCategorySchema.omit({ userId: true })),
    defaultValues: {
      name: "",
      type: "expense",
      icon: "🍔",
      color: "#3b82f6",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<FormData, "userId">) => {
      const res = await apiRequest("POST", "/api/categories", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: t("common.success"),
        description: t("categories.added_successfully"),
      });
      form.reset();
      setSelectedIcon('🍔');
      setShowAddDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error_occurred"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      // 🔄 CASCADE: Category deletion also removes budgets via DB CASCADE DELETE
      // Invalidate both queries to ensure UI stays consistent
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: t("common.success"),
        description: t("categories.deleted_successfully"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error_occurred"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<FormData, "userId">) => {
    createMutation.mutate({
      ...data,
      icon: selectedIcon,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20 sm:pb-6">
        <Skeleton className="h-20" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  const incomeCategories = categories.filter((c) => 
    c.type === "income" && (c.applicableTo === "transaction" || c.applicableTo === "both")
  );
  const expenseCategories = categories.filter((c) => 
    c.type === "expense" && (c.applicableTo === "transaction" || c.applicableTo === "both")
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("categories.title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t("categories.organize")}</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          data-testid="button-add-category"
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("categories.add_category")}
        </Button>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{t("categories.income_categories")}</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {incomeCategories.map((category) => (
              <Card key={category.id} className="hover-elevate" data-testid={`category-${category.id}`}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-md flex items-center justify-center text-2xl"
                      style={{ backgroundColor: category.color ?? undefined }}
                    >
                      {category.icon && category.icon !== 'Tag' ? category.icon : '📁'}
                    </div>
                    <div>
                      <p className="font-medium">{translateCategory(category.name)}</p>
                      <Badge variant="secondary" className="text-xs mt-1">{t("categories.type_income")}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(category.id)}
                    data-testid={`button-delete-category-${category.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {incomeCategories.length === 0 && (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <p>{t("categories.no_income")}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{t("categories.expense_categories")}</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {expenseCategories.map((category) => (
              <Card key={category.id} className="hover-elevate" data-testid={`category-${category.id}`}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-md flex items-center justify-center text-2xl"
                      style={{ backgroundColor: category.color ?? undefined }}
                    >
                      {category.icon && category.icon !== 'Tag' ? category.icon : '📁'}
                    </div>
                    <div>
                      <p className="font-medium">{translateCategory(category.name)}</p>
                      <Badge variant="secondary" className="text-xs mt-1">{t("categories.type_expense")}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(category.id)}
                    data-testid={`button-delete-category-${category.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {expenseCategories.length === 0 && (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <p>{t("categories.no_expense")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("categories.add_category_dialog")}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("categories.name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("categories.name_placeholder")} data-testid="input-category-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("categories.type")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category-type">
                          <SelectValue placeholder={t("categories.select_type")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">{t("categories.type_income")}</SelectItem>
                        <SelectItem value="expense">{t("categories.type_expense")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>{t("categories.icon")}</Label>
                <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                  {CATEGORY_ICONS.map(({ emoji, name: iconName }) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => {
                        setSelectedIcon(emoji);
                        form.setValue("icon", emoji);
                      }}
                      className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl transition-all hover:scale-110 ${
                        selectedIcon === emoji ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted'
                      }`}
                      data-testid={`icon-option-${iconName}`}
                      aria-label={iconName}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("categories.color")}</FormLabel>
                    <FormControl>
                      <Input type="color" data-testid="input-category-color" {...field} value={field.value ?? undefined} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1"
                  data-testid="button-cancel-category"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-category"
                >
                  {createMutation.isPending ? t("categories.adding") : t("categories.add_category")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>


      <MobileMenuSheet
        open={showMobileMenu}
        onOpenChange={setShowMobileMenu}
      />
    </div>
  );
}

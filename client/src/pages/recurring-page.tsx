import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Recurring } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { RecurringEmptyState } from "@/components/recurring/RecurringEmptyState";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRecurringSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
// ⏰ parseISO prevents timezone bugs when parsing date strings from DB
import { format, parseISO } from "date-fns";
import { ru, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/i18n/context";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { MobileMenuSheet } from "@/components/mobile-menu-sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const formSchema = insertRecurringSchema.omit({ userId: true }).extend({
  amount: z.string().min(1),
});

type FormData = z.infer<typeof formSchema>;

export default function RecurringPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = useIsMobile();  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();

  const { data: recurring = [], isLoading } = useQuery<Recurring[]>({
    queryKey: ["/api/recurring"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "expense",
      amount: "",
      description: "",
      category: "",
      frequency: "monthly",
      nextDate: new Date().toISOString().split("T")[0],
      isActive: true,
      currency: "USD",
      amountUsd: "0",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData & { userId: number }) => {
      const res = await apiRequest("POST", "/api/recurring", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring"] });
      toast({
        title: t("common.success"),
        description: t("recurring.added_successfully"),
      });
      form.reset();
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
      await apiRequest("DELETE", `/api/recurring/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring"] });
      toast({
        title: t("common.success"),
        description: t("recurring.deleted_successfully"),
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

  const onSubmit = (data: FormData) => {
    if (!user?.id) {
      toast({
        title: t("common.error"),
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate({
      ...data,
      userId: user.id,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("recurring.title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t("recurring.manage")}</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-recurring" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          {t("recurring.add_recurring")}
        </Button>
      </div>

      {recurring.length === 0 ? (
        <RecurringEmptyState />
      ) : (
        <div className="space-y-3">
          {recurring.map((item) => (
            <Card key={item.id} className="hover-elevate" data-testid={`recurring-${item.id}`}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1">
                    <p className="font-medium">{item.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {t(`recurring.frequency_${item.frequency}`)}
                      </Badge>
                      {item.category && (
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {/* ⏰ parseISO prevents timezone bugs */}
                        {t("recurring.next")} {format(parseISO(item.nextDate), "d MMM yyyy", { locale: language === 'ru' ? ru : enUS })}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-mono font-semibold text-lg",
                    item.type === "income"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  )}>
                    {item.type === "income" ? "+" : "-"}${item.amount}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(item.id)}
                  data-testid={`button-delete-recurring-${item.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("recurring.add_dialog")}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("recurring.description")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("recurring.description_placeholder")} data-testid="input-recurring-description" {...field} />
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
                    <FormLabel>{t("recurring.type")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-recurring-type">
                          <SelectValue placeholder={t("recurring.select_type")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">{t("recurring.type_income")}</SelectItem>
                        <SelectItem value="expense">{t("recurring.type_expense")}</SelectItem>
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
                      <FormLabel>{t("recurring.amount")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-testid="input-recurring-amount"
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
                      <FormLabel>{t("recurring.currency")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-recurring-currency">
                            <SelectValue placeholder={t("recurring.currency")} />
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
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("recurring.frequency")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-recurring-frequency">
                          <SelectValue placeholder={t("recurring.select_frequency")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">{t("recurring.frequency_daily")}</SelectItem>
                        <SelectItem value="weekly">{t("recurring.frequency_weekly")}</SelectItem>
                        <SelectItem value="monthly">{t("recurring.frequency_monthly")}</SelectItem>
                        <SelectItem value="quarterly">{t("recurring.frequency_quarterly")}</SelectItem>
                        <SelectItem value="yearly">{t("recurring.frequency_yearly")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("recurring.next_date")}</FormLabel>
                    <FormControl>
                      <Input type="date" data-testid="input-recurring-date" {...field} />
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
                  data-testid="button-cancel-recurring"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-recurring"
                >
                  {createMutation.isPending ? t("recurring.adding") : t("recurring.add_recurring")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileBottomNav
          onMenuClick={() => setShowMobileMenu(true)}
          onAddClick={() => {
            toast({
              title: "Добавить транзакцию",
              description: "Функция скоро будет доступна!",
            });
          }}
          onAiChatClick={() => {
            toast({
              title: "AI Chat",
              description: "Функция AI чата скоро будет доступна!",
            });
          }}
        />
      )}

      <MobileMenuSheet
        open={showMobileMenu}
        onOpenChange={setShowMobileMenu}
      />
    </div>
  );
}

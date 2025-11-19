import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlannedIncome, Category, insertPlannedIncomeSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/context";
import { PlannedIncomeCard } from "@/components/planned-income/planned-income-card";
import { PlannedIncomeFormDialog } from "@/components/planned-income/planned-income-form-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

type FilterStatus = "all" | "pending" | "received" | "cancelled";
type FormData = z.infer<typeof insertPlannedIncomeSchema>;

export default function PlannedIncomePage() {
  const [activeTab, setActiveTab] = useState<FilterStatus>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingIncome, setEditingIncome] = useState<PlannedIncome | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const form = useForm<FormData>({
    resolver: zodResolver(insertPlannedIncomeSchema),
    defaultValues: {
      amount: "",
      currency: "USD",
      description: "",
      expectedDate: format(new Date(), "yyyy-MM-dd"),
      categoryId: undefined,
      notes: undefined,
    },
  });

  const { data: allIncome = [], isLoading } = useQuery<PlannedIncome[]>({
    queryKey: ["/api/planned-income"],
  });

  const { data: allCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const incomeCategories = useMemo(
    () => allCategories.filter((c) => c.type === "income"),
    [allCategories]
  );

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/planned-income", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planned-income"] });
      toast({
        title: t("common.success"),
        description: t("planned_income.created_successfully"),
      });
      form.reset({
        amount: "",
        currency: "USD",
        description: "",
        expectedDate: format(new Date(), "yyyy-MM-dd"),
        categoryId: undefined,
        notes: undefined,
      });
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormData> }) => {
      const res = await apiRequest("PATCH", `/api/planned-income/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planned-income"] });
      toast({
        title: t("common.success"),
        description: t("planned_income.updated_successfully"),
      });
      setEditingIncome(null);
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
      await apiRequest("DELETE", `/api/planned-income/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planned-income"] });
      toast({
        title: t("common.success"),
        description: t("planned_income.deleted_successfully"),
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

  const receiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/planned-income/${id}/receive`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planned-income"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({
        title: t("common.success"),
        description: t("planned_income.received_successfully"),
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

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/planned-income/${id}/cancel`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planned-income"] });
      toast({
        title: t("common.success"),
        description: t("planned_income.cancelled_successfully"),
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

  const filteredIncome = useMemo(() => {
    if (activeTab === "all") return allIncome;
    return allIncome.filter((income) => income.status === activeTab);
  }, [allIncome, activeTab]);

  const statusCounts = useMemo(() => {
    return {
      all: allIncome.length,
      pending: allIncome.filter((i) => i.status === "pending").length,
      received: allIncome.filter((i) => i.status === "received").length,
      cancelled: allIncome.filter((i) => i.status === "cancelled").length,
    };
  }, [allIncome]);

  const handleSubmit = (data: FormData) => {
    if (editingIncome) {
      updateMutation.mutate({ id: editingIncome.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (income: PlannedIncome) => {
    setEditingIncome(income);
    form.reset({
      amount: income.amount,
      currency: income.currency || "USD",
      description: income.description,
      expectedDate: income.expectedDate,
      categoryId: income.categoryId ?? undefined,
      notes: income.notes ?? undefined,
    });
    setShowAddDialog(true);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingIncome(null);
    form.reset({
      amount: "",
      currency: "USD",
      description: "",
      expectedDate: format(new Date(), "yyyy-MM-dd"),
      categoryId: undefined,
      notes: undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="flex-1 overflow-auto p-6">
          <Skeleton className="h-10 w-full mb-4" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            {t("planned_income.title")}
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-page-description">
            {t("planned_income.description")}
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          data-testid="button-add-planned-income"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("planned_income.add")}
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterStatus)} className="h-full flex flex-col">
          <TabsList className="mx-6 mt-4 w-fit" data-testid="tabs-filter">
            <TabsTrigger value="all" data-testid="tab-all">
              {t("planned_income.filter.all")} ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">
              {t("planned_income.filter.pending")} ({statusCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="received" data-testid="tab-received">
              {t("planned_income.filter.received")} ({statusCounts.received})
            </TabsTrigger>
            <TabsTrigger value="cancelled" data-testid="tab-cancelled">
              {t("planned_income.filter.cancelled")} ({statusCounts.cancelled})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="flex-1 px-6 pb-6 mt-4">
            {filteredIncome.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <CalendarDays className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2" data-testid="text-empty-title">
                  {t("planned_income.no_income")}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md" data-testid="text-empty-description">
                  {t("planned_income.no_income_description")}
                </p>
                {activeTab === "all" && (
                  <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-first">
                    <Plus className="w-4 h-4 mr-2" />
                    {t("planned_income.add")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4" data-testid="list-planned-income">
                {filteredIncome.map((income) => (
                  <PlannedIncomeCard
                    key={income.id}
                    income={income}
                    categories={allCategories}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onReceive={(id) => receiveMutation.mutate(id)}
                    onCancel={(id) => cancelMutation.mutate(id)}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <PlannedIncomeFormDialog
        open={showAddDialog}
        onOpenChange={handleCloseDialog}
        form={form}
        onSubmit={handleSubmit}
        editing={!!editingIncome}
        incomeCategories={incomeCategories}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

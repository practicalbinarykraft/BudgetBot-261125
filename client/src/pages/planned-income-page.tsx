import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlannedIncome, Category, insertPlannedIncomeSchema } from "@shared/schema";
import { Plus, CalendarDays, Coins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/context";
import { PlannedIncomeCard } from "@/components/planned-income/planned-income-card";
import { PlannedIncomeFormDialog } from "@/components/planned-income/planned-income-form-dialog";
import { PlannedLayout } from "@/components/planned-layout/planned-layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { MobileMenuSheet } from "@/components/mobile-menu-sheet";
import { useIsMobile } from "@/hooks/use-mobile";

type FilterStatus = "all" | "pending" | "received" | "cancelled";
type FormData = z.infer<typeof insertPlannedIncomeSchema>;

export default function PlannedIncomePage() {
  const [activeTab, setActiveTab] = useState<FilterStatus>("all");

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = useIsMobile();  const [showAddDialog, setShowAddDialog] = useState(false);
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

  const tabs = [
    { value: "all", label: t("planned_income.filter.all"), count: statusCounts.all },
    { value: "pending", label: t("planned_income.filter.pending"), count: statusCounts.pending },
    { value: "received", label: t("planned_income.filter.received"), count: statusCounts.received },
    { value: "cancelled", label: t("planned_income.filter.cancelled"), count: statusCounts.cancelled },
  ];

  return (
    <>
      <PlannedLayout
        title={t("planned_income.title")}
        subtitle={t("planned_income.description")}
        icon={Coins}
        addButtonText={t("planned_income.add")}
        onAdd={() => setShowAddDialog(true)}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(v) => setActiveTab(v as FilterStatus)}
        emptyIcon={CalendarDays}
        emptyTitle={t("planned_income.no_income")}
        emptySubtitle={t("planned_income.no_income_description")}
        isEmpty={filteredIncome.length === 0}
        isLoading={isLoading}
        loadingElement={
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
        }
      >
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
      </PlannedLayout>

      <PlannedIncomeFormDialog
        open={showAddDialog}
        onOpenChange={handleCloseDialog}
        form={form}
        onSubmit={handleSubmit}
        editing={!!editingIncome}
        incomeCategories={incomeCategories}
        isPending={createMutation.isPending || updateMutation.isPending}
      />


      <MobileMenuSheet
        open={showMobileMenu}
        onOpenChange={setShowMobileMenu}
      />
    </>
  );
}

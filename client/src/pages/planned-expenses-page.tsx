import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlannedTransaction } from "@shared/schema";
import { Plus, Calendar } from "lucide-react";
import { PlannedItemCard } from "@/components/planned/planned-item-card";
import { AddPlannedDialog } from "@/components/planned/add-planned-dialog";
import { PlannedLayout } from "@/components/planned-layout/planned-layout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { parseISO, isToday, isTomorrow, differenceInDays, startOfWeek, endOfWeek, isPast } from "date-fns";
import { useTranslation } from "@/i18n";
import { MobileMenuSheet } from "@/components/mobile-menu-sheet";
import { useIsMobile } from "@/hooks/use-mobile";

type GroupedPlanned = {
  overdue: PlannedTransaction[];
  today: PlannedTransaction[];
  tomorrow: PlannedTransaction[];
  thisWeek: PlannedTransaction[];
  nextWeek: PlannedTransaction[];
  later: PlannedTransaction[];
};

function groupByDate(items: PlannedTransaction[]): GroupedPlanned {
  const groups: GroupedPlanned = {
    overdue: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    nextWeek: [],
    later: [],
  };

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  items.forEach((item) => {
    const targetDate = parseISO(item.targetDate);
    const daysDiff = differenceInDays(targetDate, now);

    if (isPast(targetDate) && item.status === "planned") {
      groups.overdue.push(item);
    } else if (isToday(targetDate)) {
      groups.today.push(item);
    } else if (isTomorrow(targetDate)) {
      groups.tomorrow.push(item);
    } else if (targetDate >= weekStart && targetDate <= weekEnd) {
      groups.thisWeek.push(item);
    } else if (daysDiff > 0 && daysDiff <= 14) {
      groups.nextWeek.push(item);
    } else {
      groups.later.push(item);
    }
  });

  return groups;
}

export default function PlannedExpensesPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = useIsMobile();  const [activeTab, setActiveTab] = useState<"all" | "planned" | "completed">("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, language } = useTranslation();

  const { data: allPlanned = [], isLoading } = useQuery<PlannedTransaction[]>({
    queryKey: ["/api/planned"],
  });

  const filteredPlanned = useMemo(() => {
    if (activeTab === "all") return allPlanned;
    if (activeTab === "planned") return allPlanned.filter(p => p.status === "planned");
    return allPlanned.filter(p => p.status === "purchased" || p.status === "cancelled");
  }, [allPlanned, activeTab]);

  const groupedPlanned = useMemo(() => groupByDate(filteredPlanned), [filteredPlanned]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/planned/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planned"] });
      toast({ title: t("common.success"), description: t("planned.removed_successfully") });
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/planned/${id}/purchase`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({ title: t("common.success"), description: t("planned.completed_successfully") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error_occurred"), description: error.message, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/planned/${id}/cancel`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planned"] });
      toast({ title: t("common.success"), description: t("planned.cancelled_successfully") });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; amount: string; targetDate: string; category?: string; currency?: string }) => {
      const res = await apiRequest("POST", "/api/planned", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/predictions"] });
      toast({ title: t("common.success"), description: t("planned.added_successfully") });
      setShowAddDialog(false);
    },
    onError: (error: Error) => {
      toast({ title: t("common.error_occurred"), description: error.message, variant: "destructive" });
    },
  });

  const toggleChartMutation = useMutation({
    mutationFn: async ({ id, show }: { id: number; show: boolean }) => {
      const res = await apiRequest("PATCH", `/api/planned/${id}`, { showOnChart: show });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/trend"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: t("common.error_occurred"), 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleAddPlanned = (data: { name: string; amount: string; targetDate: string; category?: string; currency?: string }) => {
    createMutation.mutate(data);
  };

  const handleToggleChart = (id: number, show: boolean) => {
    toggleChartMutation.mutate({ id, show });
  };

  const tabCounts = useMemo(() => ({
    all: allPlanned.length,
    planned: allPlanned.filter(p => p.status === "planned").length,
    completed: allPlanned.filter(p => p.status === "purchased" || p.status === "cancelled").length,
  }), [allPlanned]);

  const tabs = [
    { value: "all", label: t("planned.tab_all"), count: tabCounts.all },
    { value: "planned", label: t("planned.tab_planned"), count: tabCounts.planned },
    { value: "completed", label: t("planned.tab_completed"), count: tabCounts.completed },
  ];

  const renderGroup = (title: string, items: PlannedTransaction[], count: number) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-3 pb-20 sm:pb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg sm:text-xl font-semibold">{title}</h3>
          <span className="text-sm text-muted-foreground">({count})</span>
        </div>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <PlannedItemCard
              key={item.id}
              item={item}
              onDelete={deleteMutation.mutate}
              onPurchase={purchaseMutation.mutate}
              onCancel={cancelMutation.mutate}
              onToggleChart={handleToggleChart}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <PlannedLayout
        title={t("planned.title")}
        subtitle={t("planned.description")}
        icon={Calendar}
        addButtonText={t("planned.add_planned")}
        onAdd={() => setShowAddDialog(true)}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(v) => setActiveTab(v as typeof activeTab)}
        emptyIcon={Calendar}
        emptyTitle={t("planned.no_items")}
        emptySubtitle={t("planned.add_first")}
        isEmpty={filteredPlanned.length === 0}
        isLoading={isLoading}
        loadingElement={
          <div className="space-y-4 sm:space-y-6">
            <Skeleton className="h-20" />
            <Skeleton className="h-96" />
          </div>
        }
      >
        <div className="space-y-4 sm:space-y-6">
          {renderGroup(t("planned.overdue"), groupedPlanned.overdue, groupedPlanned.overdue.length)}
          {renderGroup(t("planned.today"), groupedPlanned.today, groupedPlanned.today.length)}
          {renderGroup(t("planned.tomorrow"), groupedPlanned.tomorrow, groupedPlanned.tomorrow.length)}
          {renderGroup(t("planned.this_week"), groupedPlanned.thisWeek, groupedPlanned.thisWeek.length)}
          {renderGroup(t("planned.next_week"), groupedPlanned.nextWeek, groupedPlanned.nextWeek.length)}
          {renderGroup(t("planned.later"), groupedPlanned.later, groupedPlanned.later.length)}
        </div>
      </PlannedLayout>

      <AddPlannedDialog
        key={language}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={handleAddPlanned}
        isSubmitting={createMutation.isPending}
      />


      <MobileMenuSheet
        open={showMobileMenu}
        onOpenChange={setShowMobileMenu}
      />
    </>
  );
}

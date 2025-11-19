import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlannedTransaction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { PlannedItemCard } from "@/components/planned/planned-item-card";
import { AddPlannedDialog } from "@/components/planned/add-planned-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { parseISO, isToday, isTomorrow, differenceInDays, startOfWeek, endOfWeek, isPast } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/i18n/context";

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

export default function PlannedPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "planned" | "completed">("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

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
    mutationFn: async (data: { name: string; amount: string; targetDate: string; category?: string }) => {
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

  const handleAddPlanned = (data: { name: string; amount: string; targetDate: string; category?: string }) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const renderGroup = (title: string, items: PlannedTransaction[], count: number) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="text-sm text-muted-foreground">({count})</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <PlannedItemCard
              key={item.id}
              item={item}
              onDelete={deleteMutation.mutate}
              onPurchase={purchaseMutation.mutate}
              onCancel={cancelMutation.mutate}
            />
          ))}
        </div>
      </div>
    );
  };

  const totalPlanned = allPlanned.filter(p => p.status === "planned").length;
  const totalAmount = allPlanned
    .filter(p => p.status === "planned")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("planned.title")}</h1>
          <p className="text-muted-foreground">
            {totalPlanned} {t("planned.total_planned")} · ${totalAmount.toFixed(2)} {t("planned.total_amount")}
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-planned">
          <Plus className="h-4 w-4 mr-2" />
          {t("planned.add_planned")}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">{t("planned.tab_all")}</TabsTrigger>
          <TabsTrigger value="planned" data-testid="tab-planned">{t("planned.tab_planned")}</TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">{t("planned.tab_completed")}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 mt-6">
          {filteredPlanned.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">{t("planned.no_items")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("planned.add_first")}
              </p>
            </div>
          ) : (
            <>
              {renderGroup(t("planned.overdue"), groupedPlanned.overdue, groupedPlanned.overdue.length)}
              {renderGroup(t("planned.today"), groupedPlanned.today, groupedPlanned.today.length)}
              {renderGroup(t("planned.tomorrow"), groupedPlanned.tomorrow, groupedPlanned.tomorrow.length)}
              {renderGroup(t("planned.this_week"), groupedPlanned.thisWeek, groupedPlanned.thisWeek.length)}
              {renderGroup(t("planned.next_week"), groupedPlanned.nextWeek, groupedPlanned.nextWeek.length)}
              {renderGroup(t("planned.later"), groupedPlanned.later, groupedPlanned.later.length)}
            </>
          )}
        </TabsContent>
      </Tabs>

      <AddPlannedDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={handleAddPlanned}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}

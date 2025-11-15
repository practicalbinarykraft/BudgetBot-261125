import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlannedTransaction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { PlannedItemCard } from "@/components/planned/planned-item-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { parseISO, isToday, isTomorrow, differenceInDays, startOfWeek, endOfWeek, isPast } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      toast({ title: "Success", description: "Planned transaction removed" });
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
      toast({ title: "Success", description: "Purchase completed and transaction created" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/planned/${id}/cancel`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planned"] });
      toast({ title: "Success", description: "Planned transaction cancelled" });
    },
  });

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
          <h1 className="text-3xl font-bold">Planned Purchases</h1>
          <p className="text-muted-foreground">
            {totalPlanned} items planned · ${totalAmount.toFixed(2)} total
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-planned">
          <Plus className="h-4 w-4 mr-2" />
          Add Plan
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          <TabsTrigger value="planned" data-testid="tab-planned">Planned</TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 mt-6">
          {filteredPlanned.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No planned purchases</h3>
              <p className="text-sm text-muted-foreground">
                Schedule purchases from your wishlist or create new ones
              </p>
            </div>
          ) : (
            <>
              {renderGroup("Overdue", groupedPlanned.overdue, groupedPlanned.overdue.length)}
              {renderGroup("Today", groupedPlanned.today, groupedPlanned.today.length)}
              {renderGroup("Tomorrow", groupedPlanned.tomorrow, groupedPlanned.tomorrow.length)}
              {renderGroup("This Week", groupedPlanned.thisWeek, groupedPlanned.thisWeek.length)}
              {renderGroup("Next Week", groupedPlanned.nextWeek, groupedPlanned.nextWeek.length)}
              {renderGroup("Later", groupedPlanned.later, groupedPlanned.later.length)}
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Planned Purchase</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Coming soon: Add planned purchases directly or schedule from wishlist
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

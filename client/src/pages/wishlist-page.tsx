import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WishlistItemWithPrediction } from "@/types/goal-prediction";
import { WishlistItem as WishlistItemType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { WishlistEmptyState } from "@/components/wishlist/WishlistEmptyState";
import { WishlistFilters, SortOption } from "@/components/wishlist/wishlist-filters";
import { WishlistItem } from "@/components/wishlist/wishlist-item";
import { WishlistForm, WishlistFormData } from "@/components/wishlist/wishlist-form";
import { SchedulePurchaseDialog } from "@/components/wishlist/schedule-purchase-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { sortWishlist } from "@/lib/wishlist-utils";

export default function WishlistPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [scheduleItem, setScheduleItem] = useState<WishlistItemWithPrediction | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("priority");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wishlist = [], isLoading } = useQuery<WishlistItemWithPrediction[]>({
    queryKey: ["/api/wishlist"],
  });

  const sortedWishlist = useMemo(() => sortWishlist(wishlist, sortBy), [wishlist, sortBy]);

  const createMutation = useMutation({
    mutationFn: async (data: WishlistFormData) => {
      const sanitized = {
        ...data,
        targetDate: data.targetDate || undefined,
      };
      const res = await apiRequest("POST", "/api/wishlist", sanitized);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Success",
        description: "Item added to wishlist",
      });
      setShowAddDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/wishlist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Success",
        description: "Item removed from wishlist",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const togglePurchasedMutation = useMutation({
    mutationFn: async ({ id, isPurchased }: { id: number; isPurchased: boolean }) => {
      const res = await apiRequest("PATCH", `/api/wishlist/${id}`, { isPurchased });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async ({ wishlistId, targetDate }: { wishlistId: number; targetDate: string }) => {
      const item = wishlist.find((w) => w.id === wishlistId);
      if (!item) throw new Error("Item not found");

      const res = await apiRequest("POST", "/api/planned", {
        name: item.name,
        amount: item.amount,
        targetDate,
        source: "wishlist",
        wishlistId,
        userId: user?.id,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planned"] });
      toast({
        title: "Success",
        description: "Purchase scheduled successfully",
      });
      setScheduleItem(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleTogglePurchased = (id: number) => {
    const item = wishlist.find((w) => w.id === id);
    if (item) {
      togglePurchasedMutation.mutate({ id, isPurchased: !item.isPurchased });
    }
  };

  const handleSchedule = (id: number) => {
    const item = wishlist.find((w) => w.id === id);
    if (item) {
      setScheduleItem(item);
    }
  };

  const handleScheduleConfirm = (wishlistId: number, targetDate: string) => {
    scheduleMutation.mutate({ wishlistId, targetDate });
  };

  const handleSubmit = (data: WishlistFormData) => {
    createMutation.mutate({
      ...data,
      userId: user?.id || 0,
      isPurchased: false,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wishlist</h1>
          <p className="text-muted-foreground">Plan your future purchases</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-wishlist">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {wishlist.length === 0 ? (
        <WishlistEmptyState />
      ) : (
        <>
          <WishlistFilters sortBy={sortBy} onSortChange={setSortBy} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedWishlist.map((item) => (
              <WishlistItem
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onTogglePurchased={handleTogglePurchased}
                onSchedule={handleSchedule}
              />
            ))}
          </div>
        </>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Wishlist Item</DialogTitle>
          </DialogHeader>
          <WishlistForm
            userId={user?.id || 0}
            onSubmit={handleSubmit}
            onCancel={() => setShowAddDialog(false)}
            isPending={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <SchedulePurchaseDialog
        item={scheduleItem}
        open={!!scheduleItem}
        onOpenChange={(open) => !open && setScheduleItem(null)}
        onSchedule={handleScheduleConfirm}
      />
    </div>
  );
}

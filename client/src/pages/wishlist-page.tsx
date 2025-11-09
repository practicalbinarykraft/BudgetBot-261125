import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WishlistItem } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Check } from "lucide-react";
import { WishlistEmptyState } from "@/components/wishlist/WishlistEmptyState";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWishlistSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
// ⏰ parseISO prevents timezone bugs when parsing date strings from DB
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = insertWishlistSchema.extend({
  amount: z.string().min(1, "Amount is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function WishlistPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wishlist = [], isLoading } = useQuery<WishlistItem[]>({
    queryKey: ["/api/wishlist"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: user?.id || 0,
      name: "",
      amount: "",
      targetDate: "",
      priority: "medium",
      isPurchased: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/wishlist", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Success",
        description: "Item added to wishlist",
      });
      form.reset();
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

  const onSubmit = (data: FormData) => {
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

  const priorityColors = {
    low: "bg-blue-500",
    medium: "bg-yellow-500",
    high: "bg-red-500",
  };

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {wishlist.map((item) => (
            <Card key={item.id} className="hover-elevate" data-testid={`wishlist-${item.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{item.name}</h3>
                    <p className="text-2xl font-mono font-bold mt-2">${item.amount}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePurchasedMutation.mutate({ 
                      id: item.id, 
                      isPurchased: !item.isPurchased 
                    })}
                    data-testid={`button-toggle-purchased-${item.id}`}
                  >
                    <Check className={item.isPurchased ? "text-green-600" : "text-muted-foreground"} />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${priorityColors[item.priority as keyof typeof priorityColors]}`} />
                  <Badge variant="secondary" className="text-xs capitalize">
                    {item.priority}
                  </Badge>
                  {item.targetDate && (
                    <p className="text-xs text-muted-foreground">
                      {/* ⏰ parseISO prevents timezone bugs */}
                      Target: {format(parseISO(item.targetDate), "MMM dd, yyyy")}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => deleteMutation.mutate(item.id)}
                  data-testid={`button-delete-wishlist-${item.id}`}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Wishlist Item</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. New Laptop" data-testid="input-wishlist-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-wishlist-amount"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-wishlist-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" data-testid="input-wishlist-date" {...field} value={field.value ?? ""} />
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
                  data-testid="button-cancel-wishlist"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-wishlist"
                >
                  {createMutation.isPending ? "Adding..." : "Add Item"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
